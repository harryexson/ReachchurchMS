import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Parse incoming webhook payload
        const payload = await req.json();
        
        console.log('SignalHouse webhook received:', JSON.stringify(payload, null, 2));

        const { event_type, message, account_id } = payload;

        // Verify account ID matches
        const expectedAccountId = Deno.env.get('SIGNALHOUSE_ACCOUNT_ID');
        if (account_id !== expectedAccountId) {
            console.error('Invalid account ID');
            return Response.json({ error: 'Invalid account' }, { status: 403 });
        }

        // Handle different event types
        switch (event_type) {
            case 'message.received':
                // Incoming message from a user
                await handleIncomingMessage(base44, message);
                break;
            
            case 'message.delivered':
                // Message successfully delivered
                await updateMessageStatus(base44, message.id, 'delivered');
                break;
            
            case 'message.failed':
                // Message failed to deliver
                await updateMessageStatus(base44, message.id, 'failed');
                break;
            
            case 'message.read':
                // Message was read by recipient
                await updateMessageStatus(base44, message.id, 'read');
                break;
            
            default:
                console.log('Unhandled event type:', event_type);
        }

        return Response.json({ success: true, received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function handleIncomingMessage(base44, message) {
    try {
        // Store incoming message
        await base44.asServiceRole.entities.TextMessage.create({
            from_number: message.from,
            to_number: message.to,
            message_body: message.body,
            direction: 'inbound',
            status: 'received',
            external_message_id: message.id,
            message_type: message.type || 'sms',
            media_urls: message.media_urls || [],
            received_at: new Date().toISOString()
        });

        console.log('Stored incoming message:', message.id);
    } catch (error) {
        console.error('Error storing message:', error);
    }
}

async function updateMessageStatus(base44, messageId, status) {
    try {
        const messages = await base44.asServiceRole.entities.TextMessage.filter({
            external_message_id: messageId
        });

        if (messages.length > 0) {
            await base44.asServiceRole.entities.TextMessage.update(messages[0].id, {
                status: status,
                updated_at: new Date().toISOString()
            });
            console.log('Updated message status:', messageId, status);
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}