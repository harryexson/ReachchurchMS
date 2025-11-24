import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== KIDS CHECK-IN SMS REQUEST =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));

        const { phone, child_name, check_in_code, event_title, qr_code_url } = body;

        if (!phone || !child_name || !check_in_code) {
            console.error(`[${requestId}] ❌ Missing required fields`);
            return Response.json({ 
                success: false,
                error: 'Missing required fields: phone, child_name, check_in_code' 
            }, { status: 400 });
        }

        // Validate phone number format
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            cleanPhone = '1' + cleanPhone;
        }
        if (!cleanPhone.startsWith('1') || cleanPhone.length !== 11) {
            console.error(`[${requestId}] ❌ Invalid phone format: ${phone}`);
            return Response.json({ 
                success: false,
                error: 'Invalid phone number format. Must be 10 digits (US) or include country code',
                provided_phone: phone,
                cleaned_phone: cleanPhone
            }, { status: 400 });
        }

        const formattedPhone = '+' + cleanPhone;
        console.log(`[${requestId}] Formatted phone: ${formattedPhone}`);

        // Create message with QR code access
        const message = `✅ ${child_name} checked in for ${event_title}

Your pick-up code: ${check_in_code}

View QR code: ${qr_code_url}

Present this code at check-out.`;

        console.log(`[${requestId}] Sending SMS via sendSinchSMS...`);
        console.log(`[${requestId}] Message length: ${message.length} chars`);

        // Send SMS via Sinch
        const response = await base44.functions.invoke('sendSinchSMS', {
            to: formattedPhone,
            message: message
        });

        console.log(`[${requestId}] sendSinchSMS response:`, JSON.stringify(response.data, null, 2));

        // Check if response indicates test mode
        if (response.data && response.data.test_mode) {
            console.log(`[${requestId}] ⚠️ SINCH TEST MODE DETECTED`);
            return Response.json({ 
                success: false,
                error: 'Sinch account in TEST MODE',
                test_mode: true,
                phone_attempted: formattedPhone,
                message: `Cannot send to ${formattedPhone} - Sinch account is in test mode and can only send to verified numbers.`,
                instructions: [
                    '1. Go to https://dashboard.sinch.com',
                    '2. Navigate to Numbers → Verified Numbers',
                    `3. Add and verify ${formattedPhone}`,
                    '4. OR upgrade your Sinch account to Production Mode',
                    '5. Try sending SMS again'
                ]
            }, { status: 200 }); // Return 200 so it doesn't look like a server error
        }

        if (response.data && response.data.success) {
            console.log(`[${requestId}] ✅ SMS sent successfully`);
            return Response.json({ 
                success: true,
                message: "SMS sent successfully",
                message_id: response.data.message_id,
                to: formattedPhone,
                delivery_status: 'pending_verification'
            });
        } else {
            console.error(`[${requestId}] ❌ SMS send failed:`, response.data);
            return Response.json({ 
                success: false,
                error: response.data?.error || "SMS send failed",
                details: response.data,
                phone_attempted: formattedPhone
            }, { status: 500 });
        }

    } catch (error) {
        console.error(`[${requestId}] ❌ Exception:`, error);
        console.error(`[${requestId}] Stack:`, error.stack);
        return Response.json({ 
            success: false,
            error: error.message || "Failed to send SMS",
            details: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
});