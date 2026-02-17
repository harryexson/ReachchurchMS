import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const apiKey = Deno.env.get("SIGNALHOUSE_API_KEY");
        const accountId = Deno.env.get("SIGNALHOUSE_ACCOUNT_ID");
        const phoneNumber = Deno.env.get("SIGNALHOUSE_PHONE_NUMBER");

        const envVars = {
            SIGNALHOUSE_API_KEY: apiKey ? '✅ Configured' : '❌ Missing',
            SIGNALHOUSE_ACCOUNT_ID: accountId ? '✅ Configured' : '❌ Missing',
            SIGNALHOUSE_PHONE_NUMBER: phoneNumber ? '✅ Configured' : '❌ Missing',
        };

        let allConfigured = true;
        let instructions = [];

        if (!apiKey) {
            allConfigured = false;
            instructions.push("Missing SIGNALHOUSE_API_KEY. Please add it to your environment variables.");
        }
        if (!accountId) {
            allConfigured = false;
            instructions.push("Missing SIGNALHOUSE_ACCOUNT_ID. Please add it to your environment variables.");
        }
        if (!phoneNumber) {
            allConfigured = false;
            instructions.push("Missing SIGNALHOUSE_PHONE_NUMBER. Please add it to your environment variables.");
        }

        let connectionTestSuccess = false;
        let connectionTestError = null;

        if (allConfigured) {
            try {
                const response = await fetch('https://api.signalhouse.io/v1/accounts/' + accountId, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    connectionTestSuccess = true;
                } else {
                    const errorData = await response.json();
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