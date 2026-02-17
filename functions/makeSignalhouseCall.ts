import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, callbackUrl } = await req.json();

        if (!to) {
            return Response.json({ error: 'to number is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const accountId = Deno.env.get('SIGNALHOUSE_ACCOUNT_ID');
        const fromNumber = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');

        if (!apiKey || !accountId || !fromNumber) {
            return Response.json({ error: 'SignalHouse not configured' }, { status: 500 });
        }

        const payload = {
            account_id: accountId,
            from: fromNumber,
            to: to
        };

        if (callbackUrl) {
            payload.callback_url = callbackUrl;
        }

        const response = await fetch('https://api.signalhouse.io/v1/calls', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return Response.json({ error: data.error || 'Failed to initiate call', details: data }, { status: response.status });
        }

        return Response.json({ 
            success: true, 
            call_id: data.id,
            status: data.status,
            data: data
        });
    } catch (error) {
        console.error('Call error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});