import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, message } = await req.json();

        if (!to || !message) {
            return Response.json({ error: 'to and message are required' }, { status: 400 });
        }

        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const accountId = Deno.env.get('SIGNALHOUSE_ACCOUNT_ID');
        const fromNumber = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');

        if (!apiKey || !accountId || !fromNumber) {
            return Response.json({ 
                error: 'SignalHouse not configured',
                details: 'Missing required environment variables'
            }, { status: 500 });
        }

        console.log('Sending SMS via SignalHouse:', { to, from: fromNumber });

        const payload = {
            phoneNumber: fromNumber,
            recipientPhoneNumber: to,
            message: message
        };

        console.log('Request payload:', payload);

        const response = await fetch('https://devapi.signalhouse.io/v1/sendSMS', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);

        const responseText = await response.text();
        console.log('Response text:', responseText.substring(0, 500));
        
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse response as JSON');
            return Response.json({ 
                error: 'SignalHouse API returned invalid response',
                details: 'The API returned HTML instead of JSON. Please check your API credentials.',
                response_preview: responseText.substring(0, 200),
                troubleshooting: [
                    '1. Verify your SIGNALHOUSE_API_KEY is correct',
                    '2. Check that your SignalHouse account is active',
                    '3. Ensure your phone number is verified in SignalHouse',
                    '4. Contact SignalHouse support if the issue persists'
                ]
            }, { status: 500 });
        }

        if (!response.ok) {
            console.error('SignalHouse API error:', data);
            return Response.json({ 
                error: data.message || data.error || 'Failed to send SMS', 
                details: data 
            }, { status: response.status });
        }

        console.log('SMS sent successfully:', data);

        return Response.json({ 
            success: true, 
            message_id: data.messageId || data.id,
            status: data.status || 'sent',
            data: data
        });
    } catch (error) {
        console.error('SMS error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});