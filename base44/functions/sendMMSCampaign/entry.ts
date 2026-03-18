import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// TCPA Compliance disclaimer
const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text YES to opt-in.";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { campaign_id } = await req.json();

        if (!campaign_id) {
            return Response.json({ error: 'Campaign ID required' }, { status: 400 });
        }

        // Get campaign details
        const campaigns = await base44.entities.MMSCampaign.filter({ id: campaign_id });
        if (campaigns.length === 0) {
            return Response.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const campaign = campaigns[0];

        // Get Sinch credentials
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        if (settings.length === 0) {
            return Response.json({ error: 'Church settings not found' }, { status: 404 });
        }

        const churchSettings = settings[0];

        if (!churchSettings.sinch_service_plan_id || !churchSettings.sinch_api_token || !churchSettings.sinch_phone_number) {
            return Response.json({ 
                error: 'Sinch not configured. Please set up SMS in Settings.' 
            }, { status: 400 });
        }

        const servicePlanId = churchSettings.sinch_service_plan_id;
        const apiToken = churchSettings.sinch_api_token;
        const fromNumber = churchSettings.sinch_phone_number;

        // Get campaign slides
        const slides = await base44.entities.MMSSlide.filter({ campaign_id });
        slides.sort((a, b) => a.slide_number - b.slide_number);

        // Get target subscribers
        let subscribers = [];
        if (campaign.target_audience && campaign.target_audience.length > 0) {
            for (const groupName of campaign.target_audience) {
                const groupSubs = await base44.entities.TextSubscriber.filter({ 
                    status: 'active',
                    groups: groupName 
                });
                subscribers = subscribers.concat(groupSubs);
            }
        } else {
            // Send to all active subscribers
            subscribers = await base44.entities.TextSubscriber.filter({ status: 'active' });
        }

        // Remove duplicates
        const uniqueSubscribers = Array.from(
            new Map(subscribers.map(sub => [sub.phone_number, sub])).values()
        );

        console.log(`Sending MMS campaign to ${uniqueSubscribers.length} subscribers`);

        // Build MMS message body
        let messageBody = campaign.title + "\n\n";
        
        // Add slide content
        for (const slide of slides) {
            if (slide.title) messageBody += slide.title + "\n";
            if (slide.body_text) messageBody += slide.body_text + "\n\n";
        }

        // Add public link to view full campaign
        const publicLink = `${Deno.env.get('BASE_URL') || 'https://preview--church-connect-5900d129.base44.app'}/view-mms-campaign/${campaign.share_token}`;
        messageBody += `\n\nView full campaign: ${publicLink}`;

        // Add TCPA disclaimer
        messageBody += SMS_DISCLAIMER;

        let successCount = 0;
        let failedCount = 0;

        // Send to each subscriber via Sinch
        for (const subscriber of uniqueSubscribers) {
            try {
                // Format phone number
                let formattedPhone = subscriber.phone_number.replace(/\D/g, '');
                if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
                    formattedPhone = '1' + formattedPhone;
                }
                if (!formattedPhone.startsWith('+')) {
                    formattedPhone = '+' + formattedPhone;
                }

                // Prepare media URLs for MMS
                const mediaUrls = slides
                    .filter(slide => slide.media_url)
                    .map(slide => slide.media_url)
                    .slice(0, 10); // Sinch supports up to 10 media files

                // Send via Sinch MMS API
                const sinchUrl = `https://us.sms.api.sinch.com/xms/v1/${servicePlanId}/batches`;
                
                const payload = {
                    from: fromNumber,
                    to: [formattedPhone],
                    body: messageBody
                };

                // Add media URLs if available (for MMS)
                if (mediaUrls.length > 0) {
                    payload.parameters = {
                        media_urls: mediaUrls
                    };
                }

                const response = await fetch(sinchUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiToken}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    successCount++;
                    
                    // Log delivery
                    await base44.asServiceRole.entities.MMSDelivery.create({
                        campaign_id,
                        recipient_phone: formattedPhone,
                        recipient_name: subscriber.name || 'Unknown',
                        delivery_method: 'sms_mms',
                        status: 'sent',
                        sent_date: new Date().toISOString(),
                        message_id: data.id
                    });

                    // Log to TextMessage table
                    await base44.asServiceRole.entities.TextMessage.create({
                        phone_number: formattedPhone,
                        direction: 'outbound',
                        message_body: messageBody,
                        status: 'sent',
                        twilio_sid: data.id
                    });
                } else {
                    failedCount++;
                    console.error(`Failed to send to ${formattedPhone}:`, data);
                    
                    await base44.asServiceRole.entities.MMSDelivery.create({
                        campaign_id,
                        recipient_phone: formattedPhone,
                        recipient_name: subscriber.name || 'Unknown',
                        delivery_method: 'sms_mms',
                        status: 'failed',
                        sent_date: new Date().toISOString(),
                        error_message: data.text || 'Unknown error'
                    });
                }

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                failedCount++;
                console.error(`Error sending to ${subscriber.phone_number}:`, error);
                
                await base44.asServiceRole.entities.MMSDelivery.create({
                    campaign_id,
                    recipient_phone: subscriber.phone_number,
                    recipient_name: subscriber.name || 'Unknown',
                    delivery_method: 'sms_mms',
                    status: 'failed',
                    sent_date: new Date().toISOString(),
                    error_message: error.message
                });
            }
        }

        // Update campaign
        await base44.entities.MMSCampaign.update(campaign_id, {
            status: 'sent',
            sent_date: new Date().toISOString(),
            total_recipients: uniqueSubscribers.length,
            delivered_count: successCount
        });

        return Response.json({
            success: true,
            total_recipients: uniqueSubscribers.length,
            delivered: successCount,
            failed: failedCount,
            public_link: publicLink
        });

    } catch (error) {
        console.error('MMS Campaign error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});