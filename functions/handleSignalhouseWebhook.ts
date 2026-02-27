import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// SignalHouse Inbound Webhook Handler
// Configure this URL in your SignalHouse dashboard under Settings → Webhooks
// URL: (your app URL)/api/functions/handleSignalhouseWebhook

const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out.";

Deno.serve(async (req) => {
    console.log('=== SIGNALHOUSE WEBHOOK RECEIVED ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    try {
        const base44 = createClientFromRequest(req);

        // Parse body
        let body;
        try {
            const rawBody = await req.text();
            console.log('Raw body:', rawBody);

            if (!rawBody || rawBody.trim() === '' || rawBody === '{}') {
                return Response.json({
                    status: 'webhook_ready',
                    message: '✅ SignalHouse webhook is active and ready to receive messages!',
                    setup_instructions: [
                        '1. Go to your SignalHouse dashboard',
                        '2. Navigate to Settings → Webhooks',
                        '3. Set the inbound webhook URL to this function URL',
                        '4. Select events: SMS received, delivery status',
                        '5. Save and test with a real SMS'
                    ]
                }, { status: 200 });
            }

            body = JSON.parse(rawBody);
            console.log('Parsed body:', JSON.stringify(body, null, 2));
        } catch (parseError) {
            console.error('Failed to parse body:', parseError);
            return Response.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        // SignalHouse webhook can send different formats depending on event type
        // Handle both inbound SMS and delivery status updates
        const eventType = body.type || body.event_type || body.eventType;
        const messageData = body.data || body.message || body;

        // Extract common fields - handle multiple possible formats
        const from = messageData.from || messageData.sender || body.from;
        const to = messageData.to || messageData.recipient || body.to;
        const messageBody = messageData.body || messageData.text || messageData.message || body.body;
        const messageId = messageData.id || messageData.messageId || body.id;
        const status = messageData.status || body.status;

        console.log('Event type:', eventType);
        console.log('From:', from, 'To:', to, 'Body:', messageBody);

        // Handle delivery status updates
        if (eventType && ['delivered', 'failed', 'undelivered', 'sent'].includes(eventType?.toLowerCase())) {
            await updateMessageStatus(base44, messageId, eventType.toLowerCase());
            return Response.json({ success: true, event: eventType });
        }

        // Handle inbound SMS
        if (from && messageBody) {
            await handleIncomingMessage(base44, { from, to, body: messageBody, id: messageId });
            return Response.json({ success: true, processed: 'inbound_sms' });
        }

        // Handle delivery callback format
        if (status && messageId) {
            await updateMessageStatus(base44, messageId, status);
            return Response.json({ success: true, processed: 'status_update' });
        }

        console.log('Unrecognized webhook format - logging and returning 200');
        return Response.json({ success: true, received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        // Always return 200 to prevent SignalHouse from retrying
        return Response.json({ error: error.message, received: true }, { status: 200 });
    }
});

async function handleIncomingMessage(base44, message) {
    const { from, to, body: messageBody, id: messageId } = message;

    // Log the inbound message
    try {
        await base44.asServiceRole.entities.TextMessage.create({
            phone_number: from,
            direction: 'inbound',
            message_body: messageBody,
            status: 'received',
            message_id: messageId
        });
        console.log('✅ Inbound message logged');
    } catch (dbError) {
        console.error('Failed to log inbound message:', dbError.message);
    }

    const keyword = messageBody.trim().split(/\s+/)[0].toUpperCase();
    console.log('Keyword detected:', keyword);

    // Handle opt-out
    if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT'].includes(keyword) || messageBody.toUpperCase().includes('OPT OUT')) {
        try {
            const subscribers = await base44.asServiceRole.entities.TextSubscriber.filter({ phone_number: from });
            if (subscribers.length > 0) {
                await base44.asServiceRole.entities.TextSubscriber.update(subscribers[0].id, { status: 'opted_out' });
            }
        } catch (e) { console.error('Opt-out error:', e.message); }

        await sendSignalHouseReply(base44, from, 'You have been unsubscribed. No further messages will be sent. Reply START to re-subscribe.', true);
        return;
    }

    // Handle HELP
    if (['HELP', 'INFO', 'SUPPORT'].includes(keyword)) {
        await sendSignalHouseReply(base44, from, 'REACH Church Connect - For support: support@reachchurchms.com. Text STOP to unsubscribe.');
        return;
    }

    // Handle START / re-subscribe
    if (keyword === 'START') {
        try {
            const subscribers = await base44.asServiceRole.entities.TextSubscriber.filter({ phone_number: from });
            if (subscribers.length > 0) {
                await base44.asServiceRole.entities.TextSubscriber.update(subscribers[0].id, { status: 'active' });
            }
        } catch (e) { console.error('Re-subscribe error:', e.message); }

        await sendSignalHouseReply(base44, from, 'You have been re-subscribed to REACH Church Connect messages.', true);
        return;
    }

    // Handle SMS Giving
    if (['GIVE', 'DONATE', 'OFFERING', 'TITHE'].includes(keyword)) {
        try {
            await base44.asServiceRole.functions.invoke('processSMSGiving', { from, body: messageBody });
        } catch (e) { console.error('SMS giving error:', e.message); }
        return;
    }

    // Check for custom keywords
    const keywords = await base44.asServiceRole.entities.TextKeyword.filter({ keyword, is_active: true });

    if (keywords.length === 0) {
        // AI auto-responder check
        const aiResponse = await analyzeAndRespond(messageBody, base44);
        if (aiResponse) {
            await sendSignalHouseReply(base44, from, aiResponse);
            return;
        }

        // Default response
        await sendSignalHouseReply(base44, from, 'Thank you for texting us! Text HELP for support or STOP to unsubscribe.');
        return;
    }

    // Process matched keyword
    const keywordConfig = keywords[0];

    try {
        await base44.asServiceRole.entities.TextKeyword.update(keywordConfig.id, {
            usage_count: (keywordConfig.usage_count || 0) + 1
        });
    } catch (e) {}

    // Create/update subscriber
    try {
        const existing = await base44.asServiceRole.entities.TextSubscriber.filter({ phone_number: from });
        if (existing.length === 0) {
            await base44.asServiceRole.entities.TextSubscriber.create({
                phone_number: from,
                opt_in_date: new Date().toISOString(),
                opt_in_keyword: keyword,
                status: 'active',
                groups: keywordConfig.add_to_group ? [keywordConfig.add_to_group] : []
            });
        }
    } catch (e) { console.error('Subscriber error:', e.message); }

    // Build response
    let responseMessage = keywordConfig.auto_response || 'Thank you for your message!';
    if (keywordConfig.link_url) responseMessage += `\n\n${keywordConfig.link_url}`;

    // Create visitor record if configured
    if (keywordConfig.create_visitor_record) {
        try {
            const existing = await base44.asServiceRole.entities.Visitor.filter({ phone: from });
            if (existing.length === 0) {
                await base44.asServiceRole.entities.Visitor.create({
                    name: 'SMS Visitor',
                    email: `sms_${from.replace(/[^0-9]/g, '')}@visitor.temp`,
                    phone: from,
                    visit_date: new Date().toISOString().split('T')[0],
                    follow_up_status: 'new',
                    notes: `Opted in via SMS keyword: ${keyword}`
                });
                responseMessage += '\n\nTo personalize your experience, please reply with your first and last name.';
            }
        } catch (e) { console.error('Visitor creation error:', e.message); }
    }

    await sendSignalHouseReply(base44, from, responseMessage);
}

async function sendSignalHouseReply(base44, to, message, skipDisclaimer = false) {
    try {
        const authToken = Deno.env.get('SIGNALHOUSE_AUTH_TOKEN');
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const rawFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER') || '15748893590';

        const from = rawFrom.replace(/\D/g, '');
        const toFormatted = to.replace(/\D/g, '');
        const finalMessage = skipDisclaimer ? message : message + SMS_DISCLAIMER;

        const payload = { from, to: [toFormatted], body: finalMessage };
        if (apiKey && apiKey.length < 100) payload.apiKey = apiKey;

        const response = await fetch('https://api.signalhouse.io/message/sendSMS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Reply sent, status:', response.status, 'messageId:', data.messageId || data.id);

        await base44.asServiceRole.entities.TextMessage.create({
            phone_number: to,
            direction: 'outbound',
            message_body: finalMessage,
            status: response.ok ? 'sent' : 'failed',
            message_id: data.messageId || data.id
        });

        return response.ok;
    } catch (error) {
        console.error('Reply send error:', error.message);
        return false;
    }
}

async function updateMessageStatus(base44, messageId, status) {
    if (!messageId) return;
    try {
        const messages = await base44.asServiceRole.entities.TextMessage.filter({ message_id: messageId });
        if (messages.length > 0) {
            await base44.asServiceRole.entities.TextMessage.update(messages[0].id, { status });
            console.log('Updated message status:', messageId, '->', status);
        }
    } catch (error) {
        console.error('Error updating message status:', error.message);
    }
}

async function analyzeAndRespond(message, base44) {
    try {
        const messageLower = message.toLowerCase();
        const churchInfos = await base44.asServiceRole.entities.ChurchInfo.filter({ is_active: true }).catch(() => []);
        churchInfos.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const info of churchInfos) {
            const keywords = info.question_keywords || [];
            if (keywords.some(k => messageLower.includes(k.toLowerCase()))) {
                return info.response_text;
            }
        }

        if (messageLower.includes('?') || ['how', 'what', 'when', 'where'].some(w => messageLower.includes(w))) {
            return "Thanks for your question! Text HELP to connect with our team.";
        }

        return null;
    } catch (_) { return null; }
}