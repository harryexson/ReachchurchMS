import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, videoUrl, thumbnailUrl, caption } = await req.json();

        if (!to || !videoUrl) {
            return Response.json({ error: 'to and videoUrl are required' }, { status: 400 });
        }

        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const accountId = Deno.env.get('SIGNALHOUSE_ACCOUNT_ID');
        const fromNumber = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');

        if (!apiKey || !accountId || !fromNumber) {
            return Response.json({ error: 'SignalHouse not configured' }, { status: 500 });
        }

        const payload = {
            account_id: accountId,
            from: fromNumber,
            to: to,
            type: 'mms',
            media_urls: [videoUrl]
        };

        if (caption) {
            payload.body = caption;
        }

        if (thumbnailUrl) {
            payload.thumbnail_url = thumbnailUrl;
        }

        const response = await fetch('https://api.signalhouse.io/v1/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return Response.json({ error: data.error || 'Failed to send video', details: data }, { status: response.status });
        }

        return Response.json({ 
            success: true, 
            message_id: data.id,
            status: data.status,
            data: data
        });
    } catch (error) {
        console.error('Video error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});