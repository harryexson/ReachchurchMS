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

        if (!apiKey || !authToken) {
            return Response.json({ error: 'SIGNALHOUSE_API_KEY and SIGNALHOUSE_AUTH_TOKEN must both be set' }, { status: 500 });
        }

        const toSignalhouseFormat = (num) => {
            const digits = num.replace(/\D/g, '');
            if (digits.length === 10) return `1${digits}`;
            if (digits.length === 11 && digits.startsWith('1')) return digits;
            return digits;
        };

        const cleanTo = `+${toSignalhouseFormat(to)}`;
        // Use Phone Number SID as the from identifier (fc39f15a-b0fc-43cd-9096-d7857c05069d)
        const phoneNumberSid = 'fc39f15a-b0fc-43cd-9096-d7857c05069d';

        const payload = {
            from: phoneNumberSid,
            to: [cleanTo],
            body: message
        };

        const credentials = btoa(`${apiKey}:${authToken}`);

        const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
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
            debug: { from: fromNumber, to: cleanTo, payload }
        }, { status: response.status });

    } catch (error) {
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});