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
                details: 'Missing required environment variables',
                help: 'SignalHouse requires API authentication through their portal. Please contact SignalHouse support for API integration details or use their webhook-based integrations instead.'
            }, { status: 500 });
        }

        console.log('=== SignalHouse SMS Request ===');
        console.log('To:', to);
        console.log('From:', fromNumber);
        console.log('Account ID:', accountId);

        // Strip + prefix from phone numbers (SignalHouse expects numbers without +)
        const cleanFrom = fromNumber.replace(/^\+/, '');
        const cleanTo = to.replace(/^\+/, '');

        // SignalHouse API structure based on their actual format
        const payload = {
            from: cleanFrom,
            to: [cleanTo],
            body: message,
            verify: true,
            shortLink: false
        };

        console.log('Request payload:', JSON.stringify(payload, null, 2));

        const endpoints = [
            'https://api.signalhouse.io/messaging/sms/send',
            'https://api.signalhouse.io/sms/send',
            'https://api.signalhouse.io/messaging/send',
            'https://api.signalhouse.io/v1/sms'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`\n📡 Trying: ${endpoint}`);
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                console.log(`Status: ${response.status}`);
                const responseText = await response.text();
                console.log(`Response: ${responseText.substring(0, 500)}`);

                if (responseText.trim().startsWith('<')) {
                    console.log('❌ HTML response, wrong endpoint');
                    continue;
                }

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch {
                    console.log('❌ Invalid JSON');
                    continue;
                }

                if (response.ok) {
                    console.log('✅ SMS sent successfully!');
                    return Response.json({ 
                        success: true, 
                        message_id: data.messageId || data.id,
                        status: data.status || 'sent',
                        endpoint_used: endpoint,
                        data: data
                    });
                }

                if (data && (data.error || data.message)) {
                    console.error('API error:', data);
                    return Response.json({ 
                        error: data.message || data.error || 'Failed to send SMS', 
                        details: data,
                        endpoint_used: endpoint
                    }, { status: response.status });
                }

            } catch (endpointError) {
                console.log(`❌ ${endpoint} failed:`, endpointError.message);
                continue;
            }
        }

        return Response.json({ 
            error: 'Unable to determine SignalHouse SMS endpoint',
            help: 'Please log into https://devapi.signalhouse.io/apiDocs with your API key to find the correct endpoint',
            endpoints_tried: endpoints
        }, { status: 500 });

    } catch (error) {
        console.error('SMS error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});