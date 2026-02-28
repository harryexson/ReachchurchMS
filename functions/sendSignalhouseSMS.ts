import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// TCPA Compliance disclaimer
const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text HELP for help.";

// Helper: format phone to SignalHouse format (digits only, with country code)
function formatPhone(num) {
    const digits = num.replace(/\D/g, '');
    if (digits.length === 10) return `1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return digits;
    return digits;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Allow internal (service) calls without user auth
        let user = null;
        try { user = await base44.auth.me(); } catch (_) {}

        const { to, message, skipDisclaimer } = await req.json();

        if (!to || !message) {
            return Response.json({ error: 'to and message are required' }, { status: 400 });
        }

        const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '15748893590';

        if (!authToken) {
            return Response.json({ error: 'SIGNALHOUSE_AUTH_TOKEN not configured' }, { status: 500 });
        }

        // Support single or multiple recipients - always send as array
        const toList = Array.isArray(to) ? to : [to];
        const from = rawFrom.startsWith('+') ? rawFrom : `+${rawFrom.replace(/\D/g, '')}`;
        const finalMessage = skipDisclaimer ? message : message + SMS_DISCLAIMER;

        if (!apiKey) {
            return Response.json({ error: 'SIGNALHOUSE_API_KEY not configured' }, { status: 500 });
        }

        const payload = {
            from,
            to: toList,
            body: finalMessage,
            apiKey,
        };

        console.log('SignalHouse SMS payload:', JSON.stringify({ from, to: toList, bodyLength: finalMessage.length }));

        const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-api-key': apiKey,
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', responseText.substring(0, 500));

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (_) {
            return Response.json({
                error: 'Invalid response from SignalHouse',
                status: response.status,
                raw: responseText.substring(0, 500)
            }, { status: 500 });
        }

        if (response.ok) {
            return Response.json({
                success: true,
                message_id: data.messageId || data.id || data.data?.messageId,
                status: data.status || 'sent',
                recipients: toList,
                data
            });
        }

        console.error('SignalHouse error response:', response.status, JSON.stringify(data));
        return Response.json({
            success: false,
            error: data.message || data.error || data.detail || 'Failed to send SMS',
            http_status: response.status,
            details: data
        }, { status: response.status });

    } catch (error) {
        console.error('SignalHouse SMS error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});