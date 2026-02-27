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

        const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');

        if (!authToken) {
            return Response.json({ error: 'SIGNALHOUSE_AUTH_TOKEN not set' }, { status: 500 });
        }

        const toSignalhouseFormat = (num) => {
            const digits = num.replace(/\D/g, '');
            if (digits.length === 10) return `1${digits}`;
            if (digits.length === 11 && digits.startsWith('1')) return digits;
            return digits;
        };

        const toFormatted = toSignalhouseFormat(to);
        const fromNumber = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '15748893590';

        // Use authToken as apiKey since they may be the same credential
        const apiKeyToUse = apiKey || authToken;

        const payload = {
            from: fromNumber.replace(/\D/g, ''),
            to: [toFormatted],
            body: message,
            apiKey: apiKeyToUse
        };

        console.log('Auth token first 8:', authToken.substring(0, 8), 'length:', authToken.length);
        console.log('API key first 8:', apiKey ? apiKey.substring(0, 8) : 'MISSING', 'length:', apiKey ? apiKey.length : 0);
        console.log('Using apiKey first 8:', apiKeyToUse.substring(0, 8));
        console.log('Payload (no secrets):', JSON.stringify({ ...payload, apiKey: '[REDACTED]' }));

        const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            return Response.json({ 
                error: 'Invalid response from SignalHouse',
                status: response.status,
                raw: responseText.substring(0, 500)
            }, { status: 500 });
        }

        if (response.ok) {
            return Response.json({ 
                success: true, 
                message_id: data.messageId || data.id,
                status: data.status || 'sent',
                data: data
            });
        }

        return Response.json({ 
            error: data.message || data.error || 'Failed to send SMS',
            http_status: response.status,
            details: data,
            debug: { to: toFormatted, apiKeyPresent: !!apiKey }
        }, { status: response.status });

    } catch (error) {
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});