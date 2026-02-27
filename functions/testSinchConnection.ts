import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Renamed: now tests SignalHouse connection instead of Sinch
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const phoneNumber = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');

        if (!authToken || !apiKey || !phoneNumber) {
            return Response.json({
                success: false,
                error: 'Missing SignalHouse credentials',
                details: {
                    SIGNALHOUSE_AUTH_TOKEN: authToken ? 'SET' : 'MISSING',
                    SIGNALHOUSE_API_KEY: apiKey ? 'SET' : 'MISSING',
                    SIGNALHOUSE_PHONE_NUMBER: phoneNumber || 'MISSING'
                }
            });
        }

        // Test API connection
        const testResponse = await fetch('https://api.signalhouse.io/numbers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (testResponse.ok) {
            return Response.json({
                success: true,
                message: '✅ SignalHouse connection successful!',
                details: { api_status: testResponse.status, phone_number: phoneNumber }
            });
        } else {
            const err = await testResponse.text();
            return Response.json({
                success: false,
                error: 'SignalHouse API authentication failed',
                details: { status: testResponse.status, response: err }
            });
        }

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});