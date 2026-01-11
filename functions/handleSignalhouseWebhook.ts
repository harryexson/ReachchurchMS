import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// TCPA Compliance - Required disclaimer for all SMS messages
const SMS_DISCLAIMER = "\n\nWe respect your privacy. Your information is used only for church communications and is never shared. Msg & data rates may apply. Reply STOP to opt-out.";

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
    const keyword = message.trim().split(/\s+/)[0].toUpperCase();

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

        // Handle STOP/UNSUBSCRIBE requests
        if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(keyword)) {
            console.log('🛑 Processing opt-out request...');
            
            const subscribers = await base44.asServiceRole.entities.TextSubscriber.filter({ 
                phone_number: from 
            });
            
            if (subscribers.length > 0) {
                await base44.asServiceRole.entities.TextSubscriber.update(subscribers[0].id, {
                    status: 'opted_out',
                    opt_out_date: new Date().toISOString()
                });
                console.log('✅ Subscriber opted out');
            }
            
            // Send confirmation (no disclaimer needed for opt-out confirmation)
            const confirmMessage = 'You have been unsubscribed from church messages. No further messages will be sent. Reply HELP for support.';
            await sendOptOutSMS(base44, from, confirmMessage);
        }

        // Handle HELP requests
        if (['HELP', 'INFO', 'SUPPORT'].includes(keyword)) {
            console.log('❓ Processing help request...');
            const helpMessage = 'REACH Church Connect - For support, contact us at support@reachchurchms.com or reply STOP to unsubscribe.';
            await sendHelpSMS(base44, from, helpMessage);
        }
    } catch (error) {
        console.error('Error logging incoming SMS:', error);
    }
}

async function sendOptOutSMS(base44, to, message) {
    try {
        // Send opt-out confirmation without disclaimer
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const defaultFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');
        
        if (!apiKey) return;
        
        await fetch('https://api.signalhouse.com/v1/sms/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                from: defaultFrom,
                message: message
            })
        });
    } catch (error) {
        console.error('Error sending opt-out SMS:', error);
    }
}

async function sendHelpSMS(base44, to, message) {
    try {
        const apiKey = Deno.env.get('SIGNALHOUSE_API_KEY');
        const defaultFrom = Deno.env.get('SIGNALHOUSE_PHONE_NUMBER');
        
        if (!apiKey) return;
        
        await fetch('https://api.signalhouse.com/v1/sms/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                from: defaultFrom,
                message: message
            })
        });
    } catch (error) {
        console.error('Error sending help SMS:', error);
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