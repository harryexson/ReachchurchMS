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
        const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');

        if (!authToken) {
            return Response.json({ error: 'SIGNALHOUSE_AUTH_TOKEN not set' }, { status: 500 });
        }

        const toSignalhouseFormat = (num) => {
            const digits = num.replace(/\D/g, '');
            if (digits.length === 10) return `1${digits}`;
            if (digits.length === 11 && digits.startsWith('1')) return digits;
            return digits;
        };

        const cleanTo = `+${toSignalhouseFormat(to)}`;
        const fromNumber = '+15748893590';

        // SignalHouse expects numbers WITHOUT the + prefix
        const fromFormatted = fromNumber.replace('+', '');
        const toFormatted = cleanTo.replace('+', '');

        const payload = {
            from: fromFormatted,
            to: [toFormatted],
            body: message,
            apiKey: apiKey || ''
        };

        const debugInfo = { 
            url: 'https://api.signalhouse.io/message/sendSMS',
            from: fromFormatted, 
            to: toFormatted,
            authType: 'Bearer JWT',
            apiKeyPresent: !!apiKey,
            apiKeyLength: apiKey ? apiKey.length : 0
        };

        const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-api-key': apiKey || ''
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
                raw: responseText.substring(0, 500),
                debug: debugInfo
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
            debug: debugInfo
        }, { status: response.status });

    } catch (error) {
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});