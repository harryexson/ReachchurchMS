import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { campaign_id } = await req.json();

        if (!campaign_id) {
            return Response.json({ error: 'Campaign ID required' }, { status: 400 });
        }

        // Get campaign
        const campaign = await base44.asServiceRole.entities.EmailCampaign.get(campaign_id);
        if (!campaign) {
            return Response.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get template
        const template = await base44.asServiceRole.entities.EmailTemplate.get(campaign.template_id);
        if (!template) {
            return Response.json({ error: 'Template not found' }, { status: 404 });
        }

        // Get recipients based on target audience
        let recipients = [];
        const subscriptions = await base44.asServiceRole.entities.Subscription.list();

        switch (campaign.target_audience) {
            case 'all_subscribers':
                recipients = subscriptions;
                break;
            case 'trial_users':
                recipients = subscriptions.filter(s => s.status === 'trial');
                break;
            case 'active_subscribers':
                recipients = subscriptions.filter(s => s.status === 'active');
                break;
            case 'specific_tier':
                recipients = subscriptions.filter(s => s.subscription_tier === campaign.target_tier);
                break;
        }

        console.log(`Sending campaign to ${recipients.length} recipients`);

        // Update campaign status
        await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
            status: 'sending',
            total_recipients: recipients.length,
            sent_date: new Date().toISOString()
        });

        // Send emails
        let sent = 0;
        let failed = 0;

        for (const subscription of recipients) {
            try {
                const trackingId = `${campaign_id}_${subscription.id}_${Date.now()}`;
                
                // Replace variables in template
                let emailBody = template.body_html
                    .replace(/\{\{church_name\}\}/g, subscription.church_name || '')
                    .replace(/\{\{trial_end_date\}\}/g, subscription.trial_end_date || '')
                    .replace(/\{\{subscription_tier\}\}/g, subscription.subscription_tier || '');

                // Add tracking pixel
                const trackingPixel = `<img src="${Deno.env.get('BASE44_APP_URL')}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
                emailBody += trackingPixel;

                // Send email
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: subscription.church_admin_email,
                    subject: template.subject.replace(/\{\{church_name\}\}/g, subscription.church_name || ''),
                    body: emailBody
                });

                // Log send
                await base44.asServiceRole.entities.EmailCampaignLog.create({
                    campaign_id: campaign_id,
                    recipient_email: subscription.church_admin_email,
                    recipient_name: subscription.church_name,
                    subscription_id: subscription.id,
                    status: 'sent',
                    sent_date: new Date().toISOString(),
                    tracking_id: trackingId
                });

                sent++;
            } catch (error) {
                console.error(`Failed to send to ${subscription.church_admin_email}:`, error);
                
                await base44.asServiceRole.entities.EmailCampaignLog.create({
                    campaign_id: campaign_id,
                    recipient_email: subscription.church_admin_email,
                    recipient_name: subscription.church_name,
                    subscription_id: subscription.id,
                    status: 'failed',
                    error_message: error.message
                });
                
                failed++;
            }
        }

        // Update campaign with final stats
        await base44.asServiceRole.entities.EmailCampaign.update(campaign_id, {
            status: 'sent',
            emails_sent: sent,
            emails_failed: failed
        });

        return Response.json({
            success: true,
            sent,
            failed,
            total: recipients.length
        });

    } catch (error) {
        console.error('Campaign send error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});