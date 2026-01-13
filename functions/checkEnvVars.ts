import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Check if environment variables are set
        const servicePlanId = Deno.env.get("SINCH_SERVICE_PLAN_ID");
        const apiToken = Deno.env.get("SINCH_API_TOKEN");
        const phoneNumber = Deno.env.get("SINCH_PHONE_NUMBER");

        const allSet = !!(servicePlanId && apiToken && phoneNumber);

        return Response.json({
            all_set: allSet,
            variables: {
                SINCH_SERVICE_PLAN_ID: servicePlanId ? '✅ Set' : '❌ Not Set',
                SINCH_API_TOKEN: apiToken ? '✅ Set' : '❌ Not Set',
                SINCH_PHONE_NUMBER: phoneNumber || '❌ Not Set'
            }
        });

    } catch (error) {
        console.error('Check env vars error:', error);
        return Response.json({ 
            error: 'Failed to check environment variables',
            details: error.message 
        }, { status: 500 });
    }
});