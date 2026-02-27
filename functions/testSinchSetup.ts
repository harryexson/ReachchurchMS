import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Renamed: now checks SignalHouse setup instead of Sinch
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const phoneNumber = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');

        const envCheck = {
            SIGNALHOUSE_AUTH_TOKEN: authToken ? '✅ Set' : '❌ Missing',
            SIGNALHOUSE_API_KEY: apiKey ? '✅ Set' : '❌ Missing',
            SIGNALHOUSE_PHONE_NUMBER: phoneNumber ? `✅ ${phoneNumber}` : '❌ Missing'
        };

        const keywords = await base44.entities.TextKeyword.list();
        const activeKeywords = keywords.filter(k => k.is_active);
        const recentMessages = await base44.entities.TextMessage.list('-created_date', 5);

        return Response.json({
            success: true,
            environment_variables: envCheck,
            all_configured: !!(authToken && apiKey && phoneNumber),
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
            recent_messages: recentMessages.map(m => ({
                direction: m.direction,
                phone: m.phone_number,
                message: m.message_body?.substring(0, 50),
                keyword: m.keyword_triggered,
                status: m.status,
                date: m.created_date
            })),
            webhook_url: `Configure inbound webhook in SignalHouse dashboard → Settings → Webhooks → handleSignalhouseWebhook`,
            instructions: !(authToken && apiKey && phoneNumber) ? [
                'Go to Base44 Dashboard → Settings → Secrets',
                'Add SIGNALHOUSE_AUTH_TOKEN, SIGNALHOUSE_API_KEY, and SIGNALHOUSE_PHONE_NUMBER'
            ] : [
                'SignalHouse credentials are set ✅',
                'Make sure webhook URL is configured in SignalHouse Dashboard',
                'Go to: https://app.signalhouse.io → Settings → Webhooks',
                'Set inbound webhook to your handleSignalhouseWebhook function URL'
            ]
        });

    } catch (error) {
        return Response.json({ error: 'Failed to check setup', details: error.message }, { status: 500 });
    }
});