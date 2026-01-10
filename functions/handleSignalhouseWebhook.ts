import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse webhook payload
        const payload = await req.json();
        console.log('📥 Signalhouse webhook received:', payload);

        const eventType = payload.event || payload.type;
        
        // Handle different webhook event types
        switch (eventType) {
            case 'sms.received':
                await handleIncomingSMS(base44, payload);
                break;
            
            case 'sms.delivered':
            case 'sms.sent':
                await handleSMSStatus(base44, payload);
                break;
            
            case 'call.initiated':
            case 'call.answered':
            case 'call.completed':
            case 'call.failed':
                await handleCallStatus(base44, payload);
                break;
            
            case 'voice.received':
                await handleIncomingCall(base44, payload);
                break;
            
            default:
                console.log('⚠️ Unhandled webhook event:', eventType);
        }

        return Response.json({ success: true, received: true });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

async function handleIncomingSMS(base44, payload) {
    console.log('📱 Processing incoming SMS:', payload);
    
    const from = payload.from || payload.sender;
    const message = payload.message || payload.body || payload.text;
    const to = payload.to || payload.recipient;

    try {
        // Log the incoming message
        await base44.asServiceRole.entities.TextMessage.create({
            from_number: from,
            to_number: to,
            message_body: message,
            direction: 'inbound',
            status: 'received',
            message_sid: payload.message_id || payload.id,
            received_at: new Date().toISOString()
        });

        console.log('✅ Incoming SMS logged');
    } catch (error) {
        console.error('Error logging incoming SMS:', error);
    }
}

async function handleSMSStatus(base44, payload) {
    console.log('📊 SMS status update:', payload);
    
    const messageId = payload.message_id || payload.id;
    const status = payload.status;

    try {
        // Find and update the message status
        const messages = await base44.asServiceRole.entities.TextMessage.filter({
            message_sid: messageId
        });

        if (messages.length > 0) {
            await base44.asServiceRole.entities.TextMessage.update(messages[0].id, {
                status: status,
                updated_at: new Date().toISOString()
            });
            console.log('✅ SMS status updated');
        }
    } catch (error) {
        console.error('Error updating SMS status:', error);
    }
}

async function handleCallStatus(base44, payload) {
    console.log('📞 Call status update:', payload);
    
    // You can log call events or update records as needed
    const callId = payload.call_id || payload.id;
    const status = payload.status;
    
    console.log(`Call ${callId} status: ${status}`);
}

async function handleIncomingCall(base44, payload) {
    console.log('📞 Incoming call:', payload);
    
    const from = payload.from || payload.caller;
    const to = payload.to || payload.recipient;
    
    console.log(`Incoming call from ${from} to ${to}`);
    
    // You can add logic to handle incoming calls
    // e.g., route to specific staff, record voicemail, etc.
}