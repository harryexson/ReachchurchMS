import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// TCPA Compliance - Required disclaimer for all SMS messages
const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text YES to opt-in.";

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== SINCH SMS REQUEST =====`);
    
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

        // Get Sinch credentials from settings
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        
        if (settings.length === 0) {
            console.error(`[${requestId}] ❌ No church settings found`);
            return Response.json({ 
                success: false,
                error: 'Church settings not found' 
            }, { status: 404 });
        }

        const churchSettings = settings[0];

        if (!churchSettings.sinch_service_plan_id || !churchSettings.sinch_api_token) {
            console.error(`[${requestId}] ❌ Sinch not configured`);
            return Response.json({ 
                success: false,
                error: 'Sinch not configured. Please set up SMS in Settings.',
                instructions: [
                    '1. Go to Settings → SMS/Sinch tab',
                    '2. Enter your Sinch credentials',
                    '3. Click "Save & Test Connection"',
                    '4. Try sending SMS again'
                ]
            }, { status: 400 });
        }

        const servicePlanId = churchSettings.sinch_service_plan_id;
        const apiToken = churchSettings.sinch_api_token;
        const fromNumber = churchSettings.sinch_phone_number;

        if (!fromNumber) {
            console.error(`[${requestId}] ❌ No Sinch phone number`);
            return Response.json({ 
                success: false,
                error: 'Sinch phone number not configured' 
            }, { status: 400 });
        }

        console.log(`[${requestId}] From: ${fromNumber}`);
        console.log(`[${requestId}] Service Plan: ${servicePlanId.substring(0, 8)}...`);

        // Format phone number to E.164
        let formattedTo = to.replace(/\D/g, '');
        if (!formattedTo.startsWith('1') && formattedTo.length === 10) {
            formattedTo = '1' + formattedTo;
        }
        if (!formattedTo.startsWith('+')) {
            formattedTo = '+' + formattedTo;
        }

        console.log(`[${requestId}] Formatted to: ${formattedTo}`);

        // Send SMS via Sinch
        const sinchUrl = `https://us.sms.api.sinch.com/xms/v1/${servicePlanId}/batches`;
        
        console.log(`[${requestId}] Calling Sinch API...`);
        const response = await fetch(sinchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
            },
            body: JSON.stringify({
                from: fromNumber,
                to: [formattedTo],
                body: messageWithDisclaimer
            })
        });

        const data = await response.json();
        console.log(`[${requestId}] Sinch response status: ${response.status}`);
        console.log(`[${requestId}] Sinch response data:`, JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error(`[${requestId}] ❌ Sinch API error:`, data);
            
            // Check if it's a test mode error
            const isTestModeError = data.text && (
                data.text.includes('test') || 
                data.text.includes('Trial') ||
                data.text.includes('not verified') ||
                data.text.includes('verification')
            );
            
            return Response.json({ 
                success: false,
                error: data.text || 'Failed to send SMS',
                details: data,
                sinch_status: response.status,
                test_mode: isTestModeError,
                phone_attempted: formattedTo
            }, { status: response.status });
        }

        // Log the SMS in database
        console.log(`[${requestId}] Logging SMS to database...`);
        await base44.asServiceRole.entities.TextMessage.create({
            phone_number: formattedTo,
            direction: 'outbound',
            message_body: messageWithDisclaimer,
            status: 'sent',
            message_id: data.id
        });

        console.log(`[${requestId}] ✅ SMS sent successfully - Batch ID: ${data.id}`);
        return Response.json({ 
            success: true,
            message_id: data.id,
            to: formattedTo,
            batch_id: data.id,
            sinch_response: data
        });

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