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
            return Response.json({ 
                error: 'SignalHouse not configured',
                details: 'Missing required environment variables',
                help: 'SignalHouse requires API authentication through their portal. Please contact SignalHouse support for API integration details or use their webhook-based integrations instead.'
            }, { status: 500 });
        }

        console.log('=== SignalHouse SMS Request ===');
        console.log('To:', to);
        console.log('From:', fromNumber);
        console.log('Account ID:', accountId);

        // Helper to normalize any number to E.164 format
        const toE164 = (num) => {
            // Strip all non-digit characters
            const digits = num.replace(/\D/g, '');
            // If 10 digits, assume US number - add +1
            if (digits.length === 10) return `+1${digits}`;
            // If 11 digits starting with 1, add +
            if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
            // Already has country code
            return `+${digits}`;
        };

        const cleanFrom = toE164(fromNumber);
        const cleanTo = toE164(to);

        console.log('Formatted from:', cleanFrom);
        console.log('Formatted to:', cleanTo);

        // SignalHouse uses Group ID as the 'from' sender identifier
        const groupId = 'GG683P';

        const payload = {
            apiKey: apiKey,
            from: groupId,
            to: [cleanTo],
            body: message,
            verify: true,
            shortLink: false
        };
        
        console.log('Raw SIGNALHOUSE_PHONE_NUMBER:', JSON.stringify(fromNumber));
        console.log('cleanFrom:', cleanFrom);
        console.log('cleanTo:', cleanTo);
        console.log('Final payload:', JSON.stringify(payload));

        console.log('Request payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Response: ${responseText}`);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            return Response.json({ 
                error: 'Invalid response from SignalHouse',
                raw_response: responseText.substring(0, 500)
            }, { status: 500 });
        }

        if (response.ok) {
            console.log('✅ SMS sent successfully!');
            return Response.json({ 
                success: true, 
                message_id: data.messageId || data.id,
                status: data.status || 'sent',
                data: data
            });
        }

        console.error('API error:', data);
        return Response.json({ 
            error: data.message || data.error || 'Failed to send SMS', 
            details: data
        }, { status: response.status });

    } catch (error) {
        console.error('SMS error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});