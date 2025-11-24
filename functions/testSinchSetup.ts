import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check environment variables
        const sinchServicePlanId = Deno.env.get("SINCH_SERVICE_PLAN_ID");
        const sinchApiToken = Deno.env.get("SINCH_API_TOKEN");
        const sinchPhoneNumber = Deno.env.get("SINCH_PHONE_NUMBER");

        const envCheck = {
            SINCH_SERVICE_PLAN_ID: sinchServicePlanId ? '✅ Set' : '❌ Missing',
            SINCH_API_TOKEN: sinchApiToken ? '✅ Set' : '❌ Missing',
            SINCH_PHONE_NUMBER: sinchPhoneNumber ? `✅ ${sinchPhoneNumber}` : '❌ Missing'
        };

        // Check keywords
        const keywords = await base44.entities.TextKeyword.list();
        const activeKeywords = keywords.filter(k => k.is_active);

        // Check church settings
        const settings = await base44.entities.ChurchSettings.list();
        const sinchConfigured = settings.length > 0 ? settings[0].sinch_configured : false;

        // Check recent messages
        const recentMessages = await base44.entities.TextMessage.list('-created_date', 5);

        return Response.json({
            success: true,
            environment_variables: envCheck,
            all_configured: sinchServicePlanId && sinchApiToken && sinchPhoneNumber,
            keywords: {
                total: keywords.length,
                active: activeKeywords.length,
                list: activeKeywords.map(k => ({
                    keyword: k.keyword,
                    response_type: k.response_type,
                    has_link: !!k.link_url,
                    is_active: k.is_active
                }))
            },
            church_settings: {
                sinch_configured: sinchConfigured
            },
            recent_messages: recentMessages.map(m => ({
                direction: m.direction,
                phone: m.phone_number,
                message: m.message_body?.substring(0, 50),
                keyword: m.keyword_triggered,
                status: m.status,
                date: m.created_date
            })),
            webhook_url: `https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS`,
            instructions: !sinchServicePlanId || !sinchApiToken || !sinchPhoneNumber ? [
                "Go to Base44 Dashboard → Settings → Environment Variables",
                "Add SINCH_SERVICE_PLAN_ID, SINCH_API_TOKEN, and SINCH_PHONE_NUMBER"
            ] : [
                "Environment variables are set ✅",
                "Make sure webhook URL is configured in Sinch Dashboard",
                "Go to: https://dashboard.sinch.com",
                "Navigate to Numbers → Click your number → Set webhook URL",
                "Test by texting one of your keywords to your church number"
            ]
        });

    } catch (error) {
        console.error('Test setup error:', error);
        return Response.json({ 
            error: 'Failed to check setup',
            details: error.message 
        }, { status: 500 });
    }
});