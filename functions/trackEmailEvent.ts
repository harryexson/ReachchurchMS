import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const eventType = pathParts[pathParts.length - 2]; // 'open' or 'click'
        const trackingId = pathParts[pathParts.length - 1];

        if (!trackingId) {
            return new Response('Not found', { status: 404 });
        }

        // Find the email log
        const logs = await base44.asServiceRole.entities.EmailCampaignLog.filter({
            tracking_id: trackingId
        });

        if (logs.length === 0) {
            return new Response('Not found', { status: 404 });
        }

        const log = logs[0];
        const now = new Date().toISOString();

        if (eventType === 'open') {
            // Update log with open event
            const updateData = {
                open_count: (log.open_count || 0) + 1
            };
            
            if (!log.opened_date) {
                updateData.opened_date = now;
                updateData.status = 'opened';
                
                // Update campaign unique opens
                const campaign = await base44.asServiceRole.entities.EmailCampaign.get(log.campaign_id);
                await base44.asServiceRole.entities.EmailCampaign.update(log.campaign_id, {
                    unique_opens: (campaign.unique_opens || 0) + 1
                });
            }
            
            await base44.asServiceRole.entities.EmailCampaignLog.update(log.id, updateData);

            // Return 1x1 transparent pixel
            const pixel = new Uint8Array([
                0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
                0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
                0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
                0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
                0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
                0x01, 0x00, 0x3b
            ]);
            
            return new Response(pixel, {
                headers: {
                    'Content-Type': 'image/gif',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
        } else if (eventType === 'click') {
            // Update log with click event
            const updateData = {
                click_count: (log.click_count || 0) + 1
            };
            
            if (!log.clicked_date) {
                updateData.clicked_date = now;
                updateData.status = 'clicked';
                
                // Update campaign unique clicks
                const campaign = await base44.asServiceRole.entities.EmailCampaign.get(log.campaign_id);
                await base44.asServiceRole.entities.EmailCampaign.update(log.campaign_id, {
                    unique_clicks: (campaign.unique_clicks || 0) + 1
                });
            }
            
            await base44.asServiceRole.entities.EmailCampaignLog.update(log.id, updateData);

            return Response.json({ success: true });
        }

        return new Response('Invalid event type', { status: 400 });

    } catch (error) {
        console.error('Tracking error:', error);
        return new Response('Error', { status: 500 });
    }
});