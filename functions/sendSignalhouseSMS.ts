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

        // Try multiple potential SMS endpoints based on common CPaaS patterns
        const endpoints = [
            'https://api.signalhouse.io/sms/send',
            'https://api.signalhouse.io/messaging/send',
            'https://api.signalhouse.io/v1/messages',
            'https://api.signalhouse.io/messages'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`\nTrying endpoint: ${endpoint}`);
                
                const payload = {
                    to: to,
                    from: fromNumber,
                    body: message,
                    message: message,
                    phoneNumber: fromNumber,
                    recipientPhoneNumber: to
                };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'x-account-id': accountId,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                console.log(`Response status: ${response.status}`);
                const responseText = await response.text();
                console.log(`Response preview: ${responseText.substring(0, 300)}`);

                // If we got HTML, continue to next endpoint
                if (responseText.trim().startsWith('<')) {
                    console.log('Got HTML response, trying next endpoint...');
                    continue;
                }

                // Try to parse JSON
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch {
                    console.log('Invalid JSON, trying next endpoint...');
                    continue;
                }

                // If we got a successful response
                if (response.ok || (data && !data.error)) {
                    console.log('✅ SMS sent successfully:', data);
                    return Response.json({ 
                        success: true, 
                        message_id: data.messageId || data.id || data.message_id,
                        status: data.status || 'sent',
                        endpoint_used: endpoint,
                        data: data
                    });
                }

                // If we got an error response but it's JSON (correct endpoint, wrong auth/params)
                if (data) {
                    console.error('API error from endpoint:', endpoint, data);
                    return Response.json({ 
                        error: data.message || data.error || 'Failed to send SMS', 
                        details: data,
                        endpoint_used: endpoint,
                        help: 'Verify your SIGNALHOUSE_API_KEY and SIGNALHOUSE_ACCOUNT_ID are correct'
                    }, { status: response.status });
                }

            } catch (endpointError) {
                console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
                continue;
            }
        }

        // If all endpoints failed
        return Response.json({ 
            error: 'Unable to send SMS via SignalHouse',
            details: 'All attempted endpoints returned HTML or failed',
            troubleshooting: [
                '1. Log into https://devapi.signalhouse.io/apiDocs with your API key',
                '2. Find the correct SMS sending endpoint in the documentation',
                '3. Contact support@signalhouse.io for API integration help',
                '4. Use their webhook-based integration as an alternative'
            ],
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