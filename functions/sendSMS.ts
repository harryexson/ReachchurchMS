import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// TCPA Compliance - Required disclaimer for all SMS messages
const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text YES to opt-in.";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sinchServicePlanId = Deno.env.get("SINCH_SERVICE_PLAN_ID");
        const sinchApiToken = Deno.env.get("SINCH_API_TOKEN");
        const sinchPhoneNumber = Deno.env.get("SINCH_PHONE_NUMBER");

        if (!sinchServicePlanId || !sinchApiToken || !sinchPhoneNumber) {
            return Response.json({ 
                error: 'SMS not configured',
                details: 'Missing Sinch credentials. Please add SINCH_SERVICE_PLAN_ID, SINCH_API_TOKEN, and SINCH_PHONE_NUMBER in Environment Variables.'
            }, { status: 500 });
        }

        const body = await req.json();
        const { to, message, group } = body;

        let recipients = [];
        
        if (to) {
            // Single recipient
            recipients = [to];
        } else if (group) {
            // Send to all subscribers in a group
            const subscribers = await base44.entities.TextSubscriber.filter({
                status: 'active'
            });
            recipients = subscribers
                .filter(sub => sub.groups && sub.groups.includes(group))
                .map(sub => sub.phone_number);
        }

        if (recipients.length === 0) {
            return Response.json({ error: 'No recipients found' }, { status: 400 });
        }

        const results = [];
        const messageWithDisclaimer = message + SMS_DISCLAIMER;

        for (const recipient of recipients) {
            try {
                // Format phone number to E.164
                let formattedTo = recipient.replace(/\D/g, '');
                if (!formattedTo.startsWith('1') && formattedTo.length === 10) {
                    formattedTo = '1' + formattedTo;
                }
                if (!formattedTo.startsWith('+')) {
                    formattedTo = '+' + formattedTo;
                }

                const response = await fetch(
                    `https://us.sms.api.sinch.com/xms/v1/${sinchServicePlanId}/batches`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${sinchApiToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: sinchPhoneNumber,
                            to: [formattedTo],
                            body: messageWithDisclaimer
                        })
                    }
                );

                const data = await response.json();

                // Log the message
                await base44.entities.TextMessage.create({
                    phone_number: formattedTo,
                    direction: 'outbound',
                    message_body: messageWithDisclaimer,
                    status: response.ok ? 'sent' : 'failed',
                    message_id: data.id,
                    error_message: data.text || null
                });

                results.push({
                    recipient: formattedTo,
                    status: response.ok ? 'sent' : 'failed',
                    message_id: data.id
                });

            } catch (error) {
                console.error(`Failed to send SMS to ${recipient}:`, error);
                results.push({
                    recipient,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            total_sent: results.filter(r => r.status === 'sent').length,
            total_failed: results.filter(r => r.status === 'failed').length,
            results
        });

    } catch (error) {
        console.error('Send SMS error:', error);
        return Response.json({ 
            error: 'Failed to send SMS',
            details: error.message 
        }, { status: 500 });
    }
});