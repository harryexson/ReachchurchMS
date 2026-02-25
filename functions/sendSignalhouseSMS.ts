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
        console.log('API Key length:', apiKey?.length);

        // SignalHouse API documentation is behind authentication
        // Contact support@signalhouse.io for proper API endpoint and authentication
        return Response.json({ 
            error: 'SignalHouse API integration incomplete',
            details: 'SignalHouse requires direct API access setup through their support team.',
            recommendation: 'Please contact SignalHouse support (support@signalhouse.io) to get:',
            required_info: [
                '1. The correct API endpoint URL for sending SMS',
                '2. Proper authentication method (API key format/location)',
                '3. Request body structure and required fields',
                '4. Example curl command or code snippet'
            ],
            alternative: 'Consider using webhook-based integration through SignalHouse portal instead of direct API calls.',
            note: 'Their API docs (devapi.signalhouse.io/apiDocs) require authentication and don\'t show SMS sending endpoints publicly.'
        }, { status: 501 });

    } catch (error) {
        console.error('SMS error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});