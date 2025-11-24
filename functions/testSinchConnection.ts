import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get credentials from environment
        const envPlanId = Deno.env.get("SINCH_SERVICE_PLAN_ID");
        const envToken = Deno.env.get("SINCH_API_TOKEN");
        const envPhone = Deno.env.get("SINCH_PHONE_NUMBER");

        // Get credentials from database
        let dbPlanId, dbToken, dbPhone;
        try {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                dbPlanId = settings[0].sinch_service_plan_id;
                dbToken = settings[0].sinch_api_token;
                dbPhone = settings[0].sinch_phone_number;
            }
        } catch (dbError) {
            console.error('Failed to load from database:', dbError);
        }

        // Use env first, fallback to DB
        const finalPlanId = envPlanId || dbPlanId;
        const finalToken = envToken || dbToken;
        const finalPhone = envPhone || dbPhone;

        if (!finalPlanId || !finalToken || !finalPhone) {
            return Response.json({
                success: false,
                error: 'Missing credentials',
                details: {
                    service_plan_id: finalPlanId ? 'SET' : 'MISSING',
                    api_token: finalToken ? 'SET' : 'MISSING',
                    phone_number: finalPhone || 'MISSING',
                    source_env: {
                        service_plan_id: !!envPlanId,
                        api_token: !!envToken,
                        phone_number: !!envPhone
                    },
                    source_db: {
                        service_plan_id: !!dbPlanId,
                        api_token: !!dbToken,
                        phone_number: !!dbPhone
                    }
                }
            });
        }

        // Test API connection
        const sinchUrl = `https://us.sms.api.sinch.com/xms/v1/${finalPlanId}/batches`;

        try {
            const testResponse = await fetch(sinchUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${finalToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const responseData = await testResponse.json();

            if (testResponse.ok) {
                return Response.json({
                    success: true,
                    message: '✅ Sinch connection successful!',
                    details: {
                        api_status: testResponse.status,
                        phone_number: finalPhone,
                        credentials_from: envPlanId ? 'environment' : 'database'
                    }
                });
            } else {
                return Response.json({
                    success: false,
                    error: 'API authentication failed',
                    details: {
                        status: testResponse.status,
                        response: responseData
                    }
                });
            }
        } catch (apiError) {
            return Response.json({
                success: false,
                error: 'Failed to connect to Sinch API',
                details: {
                    error_message: apiError.message
                }
            });
        }

    } catch (error) {
        console.error('Test Connection Error:', error);
        return Response.json({
            success: false,
            error: 'Test failed',
            details: error.message
        }, { status: 500 });
    }
});