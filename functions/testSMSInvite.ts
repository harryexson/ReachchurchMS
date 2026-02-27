import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { test_phone_number } = body;

        const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const phoneNumber = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');

        const credentialsCheck = {
            SIGNALHOUSE_AUTH_TOKEN: authToken ? '✅ Set' : '❌ Missing',
            SIGNALHOUSE_API_KEY: apiKey ? '✅ Set' : '❌ Missing',
            SIGNALHOUSE_PHONE_NUMBER: phoneNumber ? `✅ ${phoneNumber}` : '❌ Missing'
        };

        if (!authToken || !apiKey || !phoneNumber) {
            return Response.json({
                error: 'Incomplete SignalHouse configuration',
                credentials_check: credentialsCheck,
                instructions: 'Go to Base44 Dashboard → Settings → Secrets and set SIGNALHOUSE_AUTH_TOKEN, SIGNALHOUSE_API_KEY, and SIGNALHOUSE_PHONE_NUMBER'
            }, { status: 400 });
        }

        if (test_phone_number) {
            const result = await base44.functions.invoke('sendSignalhouseSMS', {
                to: test_phone_number,
                message: '🎉 Test SMS from REACH Church Connect! Your SignalHouse SMS integration is working correctly.',
                skipDisclaimer: true
            });

            if (result.data?.success) {
                await base44.entities.TextMessage.create({
                    phone_number: test_phone_number,
                    direction: 'outbound',
                    message_body: 'Test SMS via SignalHouse',
                    status: 'sent',
                    message_id: result.data.message_id
                });

                return Response.json({
                    success: true,
                    message: 'Test SMS sent successfully via SignalHouse!',
                    details: { to: test_phone_number, from: phoneNumber, message_id: result.data.message_id },
                    credentials_check: credentialsCheck
                });
            } else {
                return Response.json({
                    error: 'Failed to send test SMS',
                    signalhouse_error: result.data?.error,
                    credentials_check: credentialsCheck
                }, { status: 400 });
            }
        }

        return Response.json({
            success: true,
            message: 'SignalHouse configuration looks good!',
            credentials_check: credentialsCheck,
            next_step: 'Provide a test_phone_number in the request body to send a test SMS'
        });

    } catch (error) {
        return Response.json({ error: 'Failed to test SMS', details: error.message }, { status: 500 });
    }
});