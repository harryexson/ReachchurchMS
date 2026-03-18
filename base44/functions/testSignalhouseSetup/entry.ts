import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const apiKey = Deno.env.get("SIGNALHOUSE_API_KEY");
        const authToken = Deno.env.get("SIGNALHOUSE_AUTH_TOKEN");
        const phoneNumber = Deno.env.get("SIGNALHOUSE_PHONE_NUMBER");

        const envVars = {
            SIGNALHOUSE_API_KEY: apiKey ? '✅ Configured' : '❌ Missing',
            SIGNALHOUSE_AUTH_TOKEN: authToken ? '✅ Configured' : '❌ Missing',
            SIGNALHOUSE_PHONE_NUMBER: phoneNumber ? '✅ Configured' : '❌ Missing',
        };

        let allConfigured = !!(apiKey && authToken);
        let instructions = [];

        if (!apiKey) instructions.push("Missing SIGNALHOUSE_API_KEY. Please add it to your environment variables.");
        if (!authToken) instructions.push("Missing SIGNALHOUSE_AUTH_TOKEN. Please add it to your environment variables.");
        if (!phoneNumber) instructions.push("Missing SIGNALHOUSE_PHONE_NUMBER (optional but recommended).");

        let connectionTestSuccess = false;
        let connectionTestError = null;

        if (allConfigured) {
            try {
                // Test connection by calling the numbers endpoint
                const response = await fetch('https://api.signalhouse.io/numbers', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    }
                });

                const responseText = await response.text();
                console.log('Connection test status:', response.status);
                console.log('Connection test response:', responseText.substring(0, 300));

                if (response.ok) {
                    connectionTestSuccess = true;
                } else {
                    let errorData;
                    try { errorData = JSON.parse(responseText); } catch { errorData = { message: responseText }; }
                    connectionTestError = `SignalHouse API error: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`;
                    allConfigured = false;
                }
            } catch (e) {
                connectionTestError = `Network or API connection error: ${e.message}`;
                allConfigured = false;
            }
        }

        let activeKeywordsCount = 0;
        try {
            const keywords = await base44.asServiceRole.entities.TextKeyword.filter({ is_active: true });
            activeKeywordsCount = keywords.length;
        } catch (e) {
            console.error("Error fetching keywords:", e);
        }

        return Response.json({
            all_configured: allConfigured,
            environment_variables: envVars,
            connection_test_success: connectionTestSuccess,
            connection_test_error: connectionTestError,
            instructions: instructions.length > 0 ? instructions : ["All environment variables are set."],
            keywords: { active: activeKeywordsCount }
        });

    } catch (error) {
        console.error('Error in testSignalhouseSetup:', error);
        return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
});