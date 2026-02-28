import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function formatPhone(num) {
    const digits = num.replace(/\D/g, '');
    if (digits.length === 10) return `1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return digits;
    return digits;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        let user = null;
        try { user = await base44.auth.me(); } catch (_) {}

        const { to, message, mediaUrls } = await req.json();

        if (!to || (!message && (!mediaUrls || mediaUrls.length === 0))) {
            return Response.json({ error: 'to and either message or mediaUrls are required' }, { status: 400 });
        }

        const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '15748893590';

        if (!authToken) {
            return Response.json({ error: 'SIGNALHOUSE_AUTH_TOKEN not configured' }, { status: 500 });
        }

        const toFormatted = formatPhone(to);
        const from = formatPhone(rawFrom);

        const payload = {
            from,
            to: [toFormatted],
            body: message || '',
            mediaUrl: mediaUrls || []
        };

        if (!apiKey) {
            return Response.json({ error: 'SIGNALHOUSE_API_KEY not configured' }, { status: 500 });
        }
        payload.apiKey = apiKey;

        console.log('SignalHouse MMS - from:', from, 'to:', toFormatted, 'media count:', mediaUrls?.length);

        const response = await fetch('https://api.signalhouse.io/message/sendMMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('MMS Response status:', response.status);
        console.log('MMS Response body:', responseText.substring(0, 500));

        let data;
        try { data = JSON.parse(responseText); } catch (_) {
            return Response.json({ error: 'Invalid response from SignalHouse', raw: responseText }, { status: 500 });
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
            success: false,
            error: data.message || data.error || 'Failed to send MMS',
            details: data
        }, { status: response.status });

    } catch (error) {
        console.error('SignalHouse MMS error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});