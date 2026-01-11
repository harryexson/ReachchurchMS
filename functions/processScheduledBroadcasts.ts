import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        console.log('🔄 Processing scheduled broadcasts...');

        // Get all scheduled broadcasts that are due
        const now = new Date();
        const broadcasts = await base44.asServiceRole.entities.ScheduledBroadcast.filter({
            status: 'scheduled'
        });

        const dueBroadcasts = broadcasts.filter(b => new Date(b.scheduled_date) <= now);
        console.log(`📋 Found ${dueBroadcasts.length} broadcasts to send`);

        const results = [];

        for (const broadcast of dueBroadcasts) {
            try {
                console.log(`📤 Processing broadcast: ${broadcast.campaign_name}`);

                // Update status to sending
                await base44.asServiceRole.entities.ScheduledBroadcast.update(broadcast.id, {
                    status: 'sending'
                });

                // Get subscribers based on segmentation
                let subscribers = await base44.asServiceRole.entities.TextSubscriber.filter({
                    status: 'active'
                });

                // Apply segmentation
                if (broadcast.segment_type === 'groups' && broadcast.target_groups?.length > 0) {
                    subscribers = subscribers.filter(sub => 
                        broadcast.target_groups.some(groupId => sub.groups?.includes(groupId))
                    );
                } else if (broadcast.segment_type === 'keywords' && broadcast.target_keywords?.length > 0) {
                    subscribers = subscribers.filter(sub => 
                        broadcast.target_keywords.includes(sub.subscribed_keyword)
                    );
                }

                console.log(`👥 Sending to ${subscribers.length} subscribers`);

                let sent = 0;
                let failed = 0;

                // Send messages
                for (const subscriber of subscribers) {
                    try {
                        await base44.asServiceRole.functions.invoke('sendSinchSMS', {
                            to: subscriber.phone_number,
                            message: broadcast.message_content
                        });
                        sent++;
                    } catch (error) {
                        console.error(`Failed to send to ${subscriber.phone_number}:`, error);
                        failed++;
                    }
                }

                // Update broadcast status
                await base44.asServiceRole.entities.ScheduledBroadcast.update(broadcast.id, {
                    status: 'sent',
                    messages_sent: sent,
                    messages_failed: failed,
                    sent_date: new Date().toISOString()
                });

                results.push({
                    broadcast_id: broadcast.id,
                    campaign_name: broadcast.campaign_name,
                    sent,
                    failed
                });

                console.log(`✅ Broadcast complete: ${sent} sent, ${failed} failed`);

            } catch (error) {
                console.error(`Error processing broadcast ${broadcast.id}:`, error);
                
                await base44.asServiceRole.entities.ScheduledBroadcast.update(broadcast.id, {
                    status: 'failed'
                });

                results.push({
                    broadcast_id: broadcast.id,
                    campaign_name: broadcast.campaign_name,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            processed: dueBroadcasts.length,
            results
        });

    } catch (error) {
        console.error('Error processing scheduled broadcasts:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});