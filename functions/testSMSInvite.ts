import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import twilio from 'npm:twilio';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { test_phone_number } = body;

        // Try to get Twilio credentials from environment variables first
        let twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        let twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        let twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

        const envSource = {
            account_sid: twilioAccountSid ? 'env' : 'not_in_env',
            auth_token: twilioAuthToken ? 'env' : 'not_in_env',
            phone_number: twilioPhoneNumber ? 'env' : 'not_in_env'
        };

        // If not in env, try to get from ChurchSettings
        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                const churchSettings = settings[0];
                if (!twilioAccountSid && churchSettings.twilio_account_sid) {
                    twilioAccountSid = churchSettings.twilio_account_sid;
                    envSource.account_sid = 'church_settings';
                }
                if (!twilioAuthToken && churchSettings.twilio_auth_token) {
                    twilioAuthToken = churchSettings.twilio_auth_token;
                    envSource.auth_token = 'church_settings';
                }
                if (!twilioPhoneNumber && churchSettings.twilio_phone_number) {
                    twilioPhoneNumber = churchSettings.twilio_phone_number;
                    envSource.phone_number = 'church_settings';
                }
            }
        }

        const credentialsCheck = {
            account_sid: twilioAccountSid ? `✅ Found (from ${envSource.account_sid})` : '❌ Missing',
            auth_token: twilioAuthToken ? `✅ Found (from ${envSource.auth_token})` : '❌ Missing',
            phone_number: twilioPhoneNumber ? `✅ ${twilioPhoneNumber} (from ${envSource.phone_number})` : '❌ Missing'
        };

        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
            return Response.json({ 
                error: 'Incomplete Twilio configuration',
                credentials_check: credentialsCheck,
                instructions: 'Go to Settings → SMS/Twilio tab and save your credentials, then click "Save & Test Connection"'
            }, { status: 400 });
        }

        // Test sending SMS
        if (test_phone_number) {
            let formattedPhone = test_phone_number;
            if (!test_phone_number.startsWith('+')) {
                formattedPhone = '+' + test_phone_number;
            }

            try {
                const client = twilio(twilioAccountSid, twilioAuthToken);
                
                const message = await client.messages.create({
                    body: `🎉 Test SMS from ChurchConnect! Your SMS invites are working correctly. Meeting invitations will be sent from this number.`,
                    from: twilioPhoneNumber,
                    to: formattedPhone
                });

                // Log the message
                await base44.entities.TextMessage.create({
                    phone_number: formattedPhone,
                    direction: 'outbound',
                    message_body: 'Test SMS',
                    status: 'sent',
                    twilio_sid: message.sid,
                    cost: parseFloat(message.price || 0)
                });

                return Response.json({
                    success: true,
                    message: 'Test SMS sent successfully!',
                    details: {
                        to: formattedPhone,
                        from: twilioPhoneNumber,
                        sid: message.sid,
                        status: message.status
                    },
                    credentials_check: credentialsCheck
                });

            } catch (twilioError) {
                return Response.json({
                    error: 'Failed to send test SMS',
                    twilio_error: twilioError.message,
                    error_code: twilioError.code,
                    credentials_check: credentialsCheck,
                    suggestion: twilioError.code === 21211 ? 
                        'Invalid phone number format. Make sure it includes country code (e.g., +15551234567)' :
                        twilioError.code === 20003 ?
                        'Authentication failed. Check your Account SID and Auth Token' :
                        'Check Twilio console for more details'
                }, { status: 400 });
            }
        }

        return Response.json({
            success: true,
            message: 'Twilio configuration looks good!',
            credentials_check: credentialsCheck,
            next_step: 'Provide a test_phone_number in the request body to send a test SMS'
        });

    } catch (error) {
        console.error('Test SMS error:', error);
        return Response.json({ 
            error: 'Failed to test SMS',
            details: error.message 
        }, { status: 500 });
    }
});