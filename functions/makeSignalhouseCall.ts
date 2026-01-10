import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, from, message, voiceType } = await req.json();

        if (!to) {
            return Response.json({ 
                error: 'Missing required field: to' 
            }, { status: 400 });
        }

        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const defaultFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');

        if (!apiKey) {
            return Response.json({ 
                error: 'Signalhouse API key not configured. Please set SIGNALHOUSE_API_KEY in settings.' 
            }, { status: 500 });
        }

        // Make voice call via Signalhouse API
        const response = await fetch('https://api.signalhouse.com/v1/voice/call', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                from: from || defaultFrom,
                message: message || 'This is a call from your church.',
                voice: voiceType || 'female' // Options: male, female
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Signalhouse API error:', data);
            return Response.json({ 
                error: 'Failed to make call',
                details: data 
            }, { status: response.status });
        }

        console.log('✅ Call initiated successfully:', data);

        return Response.json({
            success: true,
            callId: data.call_id || data.id,
            status: data.status,
            data: data
        });

    } catch (error) {
        console.error('Error making call:', error);
        return Response.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
});