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
        if (!apiKey) {
            return Response.json({ error: 'SIGNALHOUSE_API_KEY not set' }, { status: 500 });
        }

        const toSignalhouseFormat = (num) => {
            const digits = num.replace(/\D/g, '');
            if (digits.length === 10) return `1${digits}`;
            if (digits.length === 11 && digits.startsWith('1')) return digits;
            return digits;
        };

        const toFormatted = toSignalhouseFormat(to);
        const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '15748893590';
        const from = rawFrom.replace(/\D/g, '');

        const payload = {
            from,
            to: [toFormatted],
            body: message,
            apiKey
        };

        console.log('SENDING SMS - from:', from, 'to:', toFormatted);
        console.log('apiKey length:', apiKey.length, 'first8:', apiKey.substring(0, 8));

        const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', responseText.substring(0, 500));

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
                data
            });
        }

        return Response.json({
            error: data.message || data.error || 'Failed to send SMS',
            http_status: response.status,
            details: data
        }, { status: response.status });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});