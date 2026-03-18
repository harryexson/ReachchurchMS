// v5 - use only apiKey for both header auth and body field
const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text HELP for help.";

function formatPhone(num) {
    const digits = String(num).replace(/\D/g, '');
    if (digits.length === 10) return '1' + digits;
    if (digits.length === 11 && digits.startsWith('1')) return digits;
    return digits;
}

Deno.serve(async (req) => {
    const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY') || '';
    const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '';

    console.log('[v5] ENV: apiKey_len=' + apiKey.length + ' apiKey[0:16]=' + apiKey.substring(0, 16));

    if (req.method !== 'POST') {
        return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    const rawBody = await req.text();
    let body;
    try { body = JSON.parse(rawBody); } catch (e) {
        return Response.json({ error: 'Invalid JSON: ' + e.message }, { status: 400 });
    }

    const to = body.to;
    const message = body.message;
    const skipDisclaimer = body.skipDisclaimer;

    if (!to || !message) {
        return Response.json({ error: 'to and message are required' }, { status: 400 });
    }

    if (!apiKey) return Response.json({ error: 'SIGNALHOUSE_API_KEY not configured' }, { status: 500 });
    if (!rawFrom) return Response.json({ error: 'SIGNALHOUSE_PHONE_NUMBER not configured' }, { status: 500 });

    const toList = Array.isArray(to) ? to.map(formatPhone) : [formatPhone(to)];
    const from = formatPhone(rawFrom);
    const finalMessage = skipDisclaimer ? message : message + SMS_DISCLAIMER;

    const payload = { from, to: toList, body: finalMessage, apiKey };

    console.log('[v5] payload keys:', Object.keys(payload).join(','), 'to:', toList, 'from:', from);

    const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('[v5] SH status:', response.status, 'body:', responseText.substring(0, 500));

    let data;
    try { data = JSON.parse(responseText); } catch (_) {
        return Response.json({ error: 'Non-JSON from SignalHouse', raw: responseText.substring(0, 300), http_status: response.status }, { status: 500 });
    }

    if (response.ok) {
        return Response.json({
            success: true,
            message_id: data.messageId || data.id || (data.data && data.data.messageId),
            status: data.status || 'sent',
            recipients: toList,
            data
        });
    }

    return Response.json({
        success: false,
        error: data.message || data.error || data.detail || 'Failed to send SMS',
        http_status: response.status,
        details: data
    }, { status: response.status });
});