import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// CRITICAL: This function is deprecated. Use sendSignalhouseSMS instead.
// SignalHouse.io replaced Sinch/Twilio for SMS, MMS, and RCS messaging.

// TCPA Compliance - Required disclaimer for all SMS messages
const SMS_DISCLAIMER = "\n\nTo opt out text: STOP, END, CANCEL, UNSUBSCRIBE, QUIT, REVOKE, or OPT OUT. For more info see Terms under privacy. Msg & data rates may apply.";

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== DEPRECATED SINCH SMS - USE SIGNALHOUSE INSTEAD =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        
        // This function can be called internally without user auth
        let user = null;
        try {
            user = await base44.auth.me();
            console.log(`[${requestId}] User authenticated:`, user.email);
        } catch (e) {
            console.log(`[${requestId}] No authenticated user (internal call)`);
        }

        const body = await req.json();
        const { to, message } = body;

        console.log(`[${requestId}] To: ${to}`);
        console.log(`[${requestId}] Message length: ${message.length} chars`);

        if (!to || !message) {
            console.error(`[${requestId}] ❌ Missing fields`);
            return Response.json({ 
                success: false,
                error: 'Missing required fields: to, message' 
            }, { status: 400 });
        }

        // Append TCPA compliance disclaimer
        const messageWithDisclaimer = message + SMS_DISCLAIMER;
        console.log(`[${requestId}] Final message length: ${messageWithDisclaimer.length} chars`);

        // CRITICAL: Redirect to SignalHouse
        console.warn(`[${requestId}] ⚠️ DEPRECATED: Sinch is no longer supported. Use SignalHouse.io instead.`);
        return Response.json({
            success: false,
            error: 'Sinch is deprecated. Please use SignalHouse.io for SMS/MMS/RCS messaging.',
            instructions: [
                '1. Go to Dashboard → Code → Environment Variables',
                '2. Set SIGNALHOUSE_API_KEY, SIGNALHOUSE_ACCOUNT_ID, SIGNALHOUSE_PHONE_NUMBER',
                '3. Use sendSignalhouseSMS function instead',
                '4. Visit https://signalhouse.io for account setup'
            ],
            migration_guide: 'SignalHouse offers superior SMS, MMS, RCS, and Video messaging capabilities.'
        }, { status: 410 });

        // Function is deprecated - no longer executing Sinch logic

    } catch (error) {
        console.error(`[${requestId}] ❌ Error:`, error);
        console.error(`[${requestId}] Stack:`, error.stack);
        return Response.json({ 
            success: false,
            error: error.message,
            details: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
});