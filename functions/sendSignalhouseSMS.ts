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
            return Response.json({ error: 'SignalHouse not configured' }, { status: 500 });
        }

        const response = await fetch('https://api.signalhouse.io/v2/sms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                account_id: accountId,
                from: fromNumber,
                to: to,
                body: message,
                type: 'sms'
            })
        });

        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse response:', responseText);
            return Response.json({ 
                error: 'Invalid response from SignalHouse', 
                details: responseText.substring(0, 200) 
            }, { status: 500 });
        }

        if (!response.ok) {
            return Response.json({ error: data.error || 'Failed to send SMS', details: data }, { status: response.status });
        }

        return Response.json({ 
            success: true, 
            message_id: data.id,
            status: data.status,
            data: data
        });
    } catch (error) {
        console.error('SMS error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});