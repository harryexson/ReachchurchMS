
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// TCPA Compliance - Required disclaimer for all SMS messages
const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text YES to opt-in.";

Deno.serve(async (req) => {
    console.log('=== sendMeetingInvites function called ===');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        console.log('User authenticated:', user?.email || 'No user');

        if (!user) {
            console.error('No user authenticated');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('Request body:', JSON.stringify(body, null, 2));
        
        const { 
            meeting_id, 
            meeting_title, 
            meeting_url, 
            meeting_id_code,
            meeting_password,
            scheduled_time,
            description,
            method, 
            recipients, 
            custom_message 
        } = body;

        if (!recipients || recipients.length === 0) {
            return Response.json({
                success: false,
                error: 'No recipients provided',
                sent: 0,
                failed: 0
            }, { status: 400 });
        }

        console.log('Sending invites - Method:', method, 'Recipients:', recipients.length);

        let sentCount = 0;
        let failedCount = 0;
        const errors = [];

        if (method === 'email') {
            console.log('=== EMAIL MODE ===');
            
            for (const email of recipients) {
                try {
                    console.log(`Attempting to send email to: ${email}`);
                    
                    const { SendEmail } = base44.integrations.Core;
                    await SendEmail({
                        to: email,
                        from_name: 'ChurchConnect',
                        subject: `Video Meeting Invitation: ${meeting_title}`,
                        body: custom_message
                    });

                    console.log(`✅ Email sent successfully to: ${email}`);

                    // Record the participant
                    try {
                        await base44.asServiceRole.entities.MeetingParticipant.create({
                            meeting_id: meeting_id,
                            participant_name: email.split('@')[0],
                            participant_email: email,
                            role: 'participant',
                            registration_status: 'invited'
                        });
                    } catch (participantError) {
                        console.log('Could not create participant record (non-critical):', participantError.message);
                    }

                    sentCount++;
                    
                } catch (error) {
                    console.error(`❌ Failed to send email to ${email}:`, error);
                    failedCount++;
                    errors.push({ 
                        recipient: email, 
                        error: error.message || 'Unknown error'
                    });
                }
            }
        } else if (method === 'sms') {
            console.log('=== SMS MODE ===');
            
            // Get Sinch credentials from environment (primary) or database (fallback)
            let servicePlanId = Deno.env.get("SINCH_SERVICE_PLAN_ID");
            let apiToken = Deno.env.get("SINCH_API_TOKEN");
            let fromNumber = Deno.env.get("SINCH_PHONE_NUMBER");

            console.log('Sinch from env:', { 
                hasServicePlanId: !!servicePlanId, 
                hasApiToken: !!apiToken, 
                hasFromNumber: !!fromNumber 
            });

            if (!servicePlanId || !apiToken || !fromNumber) {
                console.log('Sinch not in env, checking ChurchSettings...');
                try {
                    const settings = await base44.asServiceRole.entities.ChurchSettings.list();
                    if (settings.length > 0) {
                        const churchSettings = settings[0];
                        servicePlanId = churchSettings.sinch_service_plan_id || servicePlanId;
                        apiToken = churchSettings.sinch_api_token || apiToken;
                        fromNumber = churchSettings.sinch_phone_number || fromNumber;
                        console.log('Sinch from ChurchSettings:', { 
                            hasServicePlanId: !!servicePlanId, 
                            hasApiToken: !!apiToken, 
                            hasFromNumber: !!fromNumber 
                        });
                    }
                } catch (error) {
                    console.error('Failed to load ChurchSettings:', error);
                }
            }

            if (!servicePlanId || !apiToken || !fromNumber) {
                console.error('Sinch not configured');
                return Response.json({ 
                    success: false,
                    error: 'SMS not configured',
                    details: 'Please configure Sinch credentials in Settings → SMS/Sinch tab AND Dashboard → Code → Environment Variables',
                    sent: 0,
                    failed: recipients.length
                }, { status: 400 });
            }

            for (const phone of recipients) {
                try {
                    let formattedPhone = phone;
                    if (!phone.startsWith('+')) {
                        formattedPhone = '+' + phone.replace(/\D/g, '');
                    }

                    console.log(`Sending SMS to: ${formattedPhone}`);

                    const sinchResponse = await fetch(
                        `https://us.sms.api.sinch.com/xms/v1/${servicePlanId}/batches`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiToken}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                from: fromNumber,
                                to: [formattedPhone],
                                body: custom_message + SMS_DISCLAIMER, // Appending disclaimer here
                            }),
                        }
                    );

                    if (!sinchResponse.ok) {
                        const errorText = await sinchResponse.text();
                        throw new Error(`Sinch API error: ${errorText}`);
                    }

                    const sinchData = await sinchResponse.json();
                    console.log(`✅ SMS sent successfully:`, sinchData.id);

                    // Log message
                    try {
                        // Log the original custom_message without the disclaimer, as that's what the user input.
                        await base44.asServiceRole.entities.TextMessage.create({
                            phone_number: formattedPhone,
                            direction: 'outbound',
                            message_body: custom_message, 
                            status: 'sent',
                            twilio_sid: sinchData.id
                        });
                    } catch (logError) {
                        console.log('Could not log message (non-critical):', logError.message);
                    }

                    // Record participant
                    try {
                        await base44.asServiceRole.entities.MeetingParticipant.create({
                            meeting_id: meeting_id,
                            participant_name: formattedPhone,
                            participant_email: `sms_${formattedPhone.replace('+', '')}@temp.invite`,
                            role: 'participant',
                            registration_status: 'invited'
                        });
                    } catch (participantError) {
                        console.log('Could not create participant record (non-critical):', participantError.message);
                    }

                    sentCount++;
                } catch (error) {
                    console.error(`❌ Failed to send SMS to ${phone}:`, error);
                    failedCount++;
                    errors.push({ 
                        recipient: phone, 
                        error: error.message || 'Unknown error'
                    });
                }
            }
        }

        const response = {
            success: sentCount > 0,
            sent: sentCount,
            failed: failedCount,
            total: recipients.length,
            message: `Successfully sent ${sentCount} invitation${sentCount !== 1 ? 's' : ''}${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
            errors: errors.length > 0 ? errors : undefined
        };

        console.log('=== Final result ===', JSON.stringify(response, null, 2));

        return Response.json(response);

    } catch (error) {
        console.error('=== CRITICAL ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        
        return Response.json({ 
            success: false,
            error: 'Failed to send invitations',
            details: error.message || error.toString(),
            sent: 0,
            failed: 0
        }, { status: 500 });
    }
});
