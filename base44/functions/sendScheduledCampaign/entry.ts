import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { campaign_id } = await req.json();

        // Get campaign details
        const campaigns = await base44.entities.SMSCampaign.filter({ id: campaign_id });
        if (campaigns.length === 0) {
            return Response.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const campaign = campaigns[0];

        // Get target subscribers
        let subscribers = await base44.entities.TextSubscriber.filter({ status: 'active' });
        
        if (campaign.target_groups && campaign.target_groups.length > 0) {
            subscribers = subscribers.filter(sub => 
                sub.groups && sub.groups.some(g => campaign.target_groups.includes(g))
            );
        }

        // Update campaign status
        await base44.entities.SMSCampaign.update(campaign_id, {
            status: 'in_progress',
            total_recipients: subscribers.length,
            messages_sent: 0,
            messages_failed: 0
        });

        const results = [];
        let sent = 0;
        let failed = 0;

        // Send messages
        for (const subscriber of subscribers) {
            try {
                const sendResult = await base44.functions.invoke('sendSinchSMS', {
                    to: subscriber.phone_number,
                    message: campaign.message
                });

                if (sendResult.data?.success) {
                    sent++;
                } else {
                    failed++;
                }

                results.push({
                    phone: subscriber.phone_number,
                    status: sendResult.data?.success ? 'sent' : 'failed'
                });

            } catch (error) {
                failed++;
                results.push({
                    phone: subscriber.phone_number,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        // Update campaign with final results
        await base44.entities.SMSCampaign.update(campaign_id, {
            status: 'sent',
            messages_sent: sent,
            messages_failed: failed,
            sent_date: new Date().toISOString()
        });

        // Track analytics
        await base44.entities.SMSAnalytics.create({
            date: new Date().toISOString().split('T')[0],
            keyword: campaign.keyword,
            campaign_id: campaign_id,
            messages_sent: sent
        });

        return Response.json({
            success: true,
            campaign_id,
            total: subscribers.length,
            sent,
            failed,
            results
        });

    } catch (error) {
        console.error('Campaign send error:', error);
        return Response.json({ 
            error: 'Failed to send campaign',
            details: error.message 
        }, { status: 500 });
    }
});