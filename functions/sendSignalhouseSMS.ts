// v2-fresh
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text HELP for help.";

function formatPhone(num) {
    const digits = String(num).replace(/\D/g, '');
    if (digits.length === 10) return '1' + digits;
    if (digits.length === 11 && digits.startsWith('1')) return digits;
    return digits;
}

Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch (_) {}

    const body = await req.json();
    const to = body.to;
    const message = body.message;
    const skipDisclaimer = body.skipDisclaimer;

    if (!to || !message) {
        return Response.json({ error: 'to and message are required' }, { status: 400 });
    }

    const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN') || '';
    const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY') || '';
    const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '';

    // DIAGNOSTIC: always log env state
    const envDiag = { authToken_len: authToken.length, apiKey_len: apiKey.length, apiKey_first8: apiKey.substring(0,8), rawFrom };
    console.log('ENV DIAG', JSON.stringify(envDiag));

    if (!authToken) return Response.json({ error: 'SIGNALHOUSE_AUTH_TOKEN not configured' }, { status: 500 });
    if (!apiKey) return Response.json({ error: 'SIGNALHOUSE_API_KEY not configured' }, { status: 500 });
    if (!rawFrom) return Response.json({ error: 'SIGNALHOUSE_PHONE_NUMBER not configured' }, { status: 500 });

    const toList = Array.isArray(to) ? to.map(formatPhone) : [formatPhone(to)];
    const from = formatPhone(rawFrom);
    const finalMessage = skipDisclaimer ? message : message + SMS_DISCLAIMER;

    const payload = {
        from,
        to: toList,
        body: finalMessage,
        apiKey,
    };

    console.log('PAYLOAD', JSON.stringify({ from, to: toList, apiKey_len: apiKey.length }));

    const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
            'x-api-key': apiKey,
        },
        body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('RESPONSE', response.status, responseText.substring(0, 500));

    let data;
    try { data = JSON.parse(responseText); } catch (_) {
        return Response.json({ error: 'Non-JSON from SignalHouse', raw: responseText.substring(0, 300), status: response.status }, { status: 500 });
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