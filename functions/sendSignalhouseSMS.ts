import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// TCPA Compliance - Required disclaimer for all SMS messages
const SMS_DISCLAIMER = "\n\nWe respect your privacy. Your information is used only for church communications and is never shared. Msg & data rates may apply. Reply STOP to opt-out.";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, message, from } = await req.json();

        if (!to || !message) {
            return Response.json({ 
                error: 'Missing required fields: to, message' 
            }, { status: 400 });
        }

        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const defaultFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');

        if (!apiKey) {
            return Response.json({ 
                error: 'Signalhouse API key not configured. Please set SIGNALHOUSE_API_KEY in settings.' 
            }, { status: 500 });
        }

        // Append compliance disclaimer to message
        const messageWithDisclaimer = message + SMS_DISCLAIMER;

        // Send SMS via Signalhouse API
        const response = await fetch('https://api.signalhouse.com/v1/sms/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                from: from || defaultFrom,
                message: messageWithDisclaimer
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Signalhouse API error:', data);
            return Response.json({ 
                error: 'Failed to send SMS',
                details: data 
            }, { status: response.status });
        }

        console.log('✅ SMS sent successfully:', data);

        return Response.json({
            success: true,
            messageId: data.message_id || data.id,
            status: data.status,
            data: data
        });

    } catch (error) {
        console.error('Error sending SMS:', error);
        return Response.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
});