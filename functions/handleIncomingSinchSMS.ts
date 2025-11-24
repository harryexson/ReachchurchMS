import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// TCPA Compliance - Required disclaimer for all SMS messages
const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text YES to opt-in.";

Deno.serve(async (req) => {
    console.log('=== SINCH WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse the incoming body
        let body;
        try {
            const rawBody = await req.text();
            console.log('Raw body:', rawBody);
            body = JSON.parse(rawBody);
            console.log('✅ Parsed body:', JSON.stringify(body, null, 2));
        } catch (parseError) {
            console.error('❌ Failed to parse JSON body:', parseError);
            return Response.json({
                error: 'Invalid JSON body',
                message: 'Could not parse request body'
            }, { status: 400 });
        }
        
        // Extract message details from Sinch format
        const from = body.from;
        const to = body.to;
        const messageBody = body.body || body.message || body.text;
        const messageId = body.id;
        const messageType = body.type;

        console.log('📱 Message details:', { from, to, messageBody, messageId, messageType });

        // Validate required fields
        if (!from || !messageBody) {
            console.error('❌ Missing required fields');

            // If this is a manual test (empty body), provide helpful info
            if (!from && !to && !messageBody) {
                return Response.json({ 
                    status: 'test_mode',
                    message: 'Webhook is configured correctly! When Sinch sends an SMS, it will include the required fields.',
                    expected_format: {
                        from: '+15551234567',
                        to: '+15743755450',
                        body: 'TEST',
                        id: 'message_id',
                        type: 'mo_text'
                    },
                    instructions: [
                        '1. Verify this webhook URL is configured in Sinch Dashboard',
                        '2. Send an SMS with a keyword to your Sinch number',
                        '3. Check the logs to see the actual webhook payload from Sinch'
                    ]
                }, { status: 200 });
            }

            return Response.json({ 
                error: 'Missing required fields',
                received: { from, to, messageBody, messageId },
                message: 'Thank you for your message. We received it but some information was missing.'
            }, { status: 200 });
        }

        // Extract keyword (first word, uppercase)
        const keyword = messageBody.trim().split(/\s+/)[0].toUpperCase();
        console.log('🔑 Detected keyword:', keyword);
        
        // Log incoming message to database - USE SERVICE ROLE (no auth required)
        try {
            await base44.asServiceRole.entities.TextMessage.create({
                phone_number: from,
                direction: 'inbound',
                message_body: messageBody,
                keyword_triggered: keyword,
                status: 'received',
                message_id: messageId
            });
            console.log('✅ Logged inbound message to database');
        } catch (dbError) {
            console.error('⚠️ Failed to log message (non-critical):', dbError.message);
        }

        // Get Sinch credentials for sending response
        let sinchServicePlanId = Deno.env.get("SINCH_SERVICE_PLAN_ID");
        let sinchApiToken = Deno.env.get("SINCH_API_TOKEN");
        let sinchPhoneNumber = Deno.env.get("SINCH_PHONE_NUMBER");

        console.log('📋 Checking Sinch credentials...');
        console.log('From env - Service Plan ID:', sinchServicePlanId ? 'SET' : 'NOT SET');
        console.log('From env - API Token:', sinchApiToken ? 'SET' : 'NOT SET');
        console.log('From env - Phone Number:', sinchPhoneNumber || 'NOT SET');

        // If not in environment, try to load from database
        if (!sinchServicePlanId || !sinchApiToken || !sinchPhoneNumber) {
            console.log('⚠️ Credentials not in environment, attempting to load from database...');
            try {
                const settings = await base44.asServiceRole.entities.ChurchSettings.list();
                if (settings.length > 0) {
                    const churchSettings = settings[0];
                    sinchServicePlanId = sinchServicePlanId || churchSettings.sinch_service_plan_id;
                    sinchApiToken = sinchApiToken || churchSettings.sinch_api_token;
                    sinchPhoneNumber = sinchPhoneNumber || churchSettings.sinch_phone_number;
                    
                    console.log('From DB - Service Plan ID:', sinchServicePlanId ? 'SET' : 'NOT SET');
                    console.log('From DB - API Token:', sinchApiToken ? 'SET' : 'NOT SET');
                    console.log('From DB - Phone Number:', sinchPhoneNumber || 'NOT SET');
                }
            } catch (dbError) {
                console.error('❌ Failed to load from database:', dbError);
            }
        }

        if (!sinchServicePlanId || !sinchApiToken || !sinchPhoneNumber) {
            console.error('❌ CRITICAL: Sinch credentials not found in environment OR database!');
            console.error('Please set credentials in Dashboard → Code → Environment Variables');
            return Response.json({
                error: 'SMS not configured',
                message: 'Please contact admin - SMS system not configured'
            }, { status: 200 });
        }

        console.log('✅ Sinch credentials loaded successfully');

        // Check for existing visitor with this phone number
        let existingVisitors = [];
        try {
            existingVisitors = await base44.asServiceRole.entities.Visitor.filter({ phone: from });
            console.log(`Found ${existingVisitors.length} existing visitor(s) with phone ${from}`);
        } catch (err) {
            console.error('Error checking for existing visitors:', err);
        }

        // Check if this is a name response (not a keyword)
        const keywords = await base44.asServiceRole.entities.TextKeyword.filter({ 
            keyword: keyword,
            is_active: true 
        });

        // If no keyword match and there's an existing visitor with pending name
        if (keywords.length === 0 && existingVisitors.length > 0) {
            const visitor = existingVisitors[0];
            
            // Check if this visitor needs their name updated
            if (visitor.name === 'SMS Visitor' || visitor.name.includes('Text Message') || !visitor.name) {
                console.log('📝 Updating visitor name from SMS response');
                
                // The entire message is probably their name
                const newName = messageBody.trim();
                
                // Update visitor with real name
                await base44.asServiceRole.entities.Visitor.update(visitor.id, {
                    name: newName,
                    email: `${newName.replace(/\s+/g, '.').toLowerCase()}@sms-visitor.temp`
                });

                // Send thank you message
                const thankYouMessage = `Thank you, ${newName}! We've updated your information. We're excited to connect with you at church! 🙏`;
                
                const sendResult = await sendSinchSMS(from, thankYouMessage, sinchServicePlanId, sinchApiToken, sinchPhoneNumber);
                
                await base44.asServiceRole.entities.TextMessage.create({
                    phone_number: from,
                    direction: 'outbound',
                    message_body: thankYouMessage + SMS_DISCLAIMER,
                    status: sendResult.success ? 'sent' : 'failed',
                    error_message: sendResult.success ? null : sendResult.error
                });

                console.log('✅ Visitor name updated successfully');
                
                return Response.json({
                    status: 'ok',
                    message: 'Visitor name updated'
                }, { status: 200 });
            }
        }

        // Handle no matching keyword
        if (keywords.length === 0) {
            console.log('📝 No matching keyword, sending default response');
            const defaultMessage = 'Thank you for texting us! For help, text HELP. To stop receiving messages, text STOP.';
            
            const sendResult = await sendSinchSMS(from, defaultMessage, sinchServicePlanId, sinchApiToken, sinchPhoneNumber);
            
            await base44.asServiceRole.entities.TextMessage.create({
                phone_number: from,
                direction: 'outbound',
                message_body: defaultMessage + SMS_DISCLAIMER,
                keyword_triggered: keyword,
                status: sendResult.success ? 'sent' : 'failed',
                error_message: sendResult.success ? null : sendResult.error
            });

            return Response.json({ 
                status: sendResult.success ? 'ok' : 'error',
                message: sendResult.success ? 'Default response sent' : sendResult.error
            }, { status: 200 });
        }

        // Process keyword
        const keywordConfig = keywords[0];
        console.log('✅ Using keyword config:', keywordConfig.keyword);

        // Update usage count - USE SERVICE ROLE
        try {
            await base44.asServiceRole.entities.TextKeyword.update(keywordConfig.id, {
                usage_count: (keywordConfig.usage_count || 0) + 1
            });
            console.log('✅ Updated usage count to', (keywordConfig.usage_count || 0) + 1);
        } catch (updateError) {
            console.error('⚠️ Failed to update usage count:', updateError.message);
        }

        // Check/create subscriber - USE SERVICE ROLE (no auth required)
        try {
            let subscribers = await base44.asServiceRole.entities.TextSubscriber.filter({ 
                phone_number: from 
            });

            if (subscribers.length === 0) {
                console.log('📝 Creating new subscriber - NO AUTH REQUIRED');
                await base44.asServiceRole.entities.TextSubscriber.create({
                    phone_number: from,
                    opt_in_date: new Date().toISOString(),
                    opt_in_keyword: keyword,
                    status: 'active',
                    groups: keywordConfig.add_to_group ? [keywordConfig.add_to_group] : []
                });
                console.log('✅ New subscriber created');
            } else {
                console.log('✅ Existing subscriber found');
            }
        } catch (subError) {
            console.error('⚠️ Subscriber error (non-critical):', subError.message);
        }

        // Build response message
        let responseMessage = keywordConfig.auto_response || 'Thank you for your message!';

        // Add link if configured
        if (keywordConfig.link_url) {
            responseMessage += `\n\n${keywordConfig.link_url}`;
        }

        // Add menu options if configured
        if (keywordConfig.response_type === 'menu' && keywordConfig.menu_options && keywordConfig.menu_options.length > 0) {
            responseMessage += '\n\n';
            keywordConfig.menu_options.forEach(option => {
                responseMessage += `${option.option_number}. ${option.option_text}\n`;
            });
            responseMessage += '\nReply with a number to select.';
        }

        console.log('📤 Prepared response message:', responseMessage);

        // Create visitor record if configured - USE SERVICE ROLE (no auth required)
        if (keywordConfig.create_visitor_record) {
            try {
                if (existingVisitors.length === 0) {
                    console.log('📝 Creating visitor record - NO AUTH REQUIRED');
                    
                    // Create with placeholder, then ask for name
                    await base44.asServiceRole.entities.Visitor.create({
                        name: 'SMS Visitor',
                        email: `sms_${from.replace(/[^0-9]/g, '')}@visitor.temp`,
                        phone: from,
                        visit_date: new Date().toISOString().split('T')[0],
                        follow_up_status: 'new',
                        notes: `Opted in via SMS keyword: ${keyword}`
                    });
                    console.log('✅ Visitor record created');
                    
                    // Add name request to response
                    responseMessage += '\n\nTo personalize your experience, please reply with your first and last name. 😊';
                }
            } catch (visitorError) {
                console.error('⚠️ Failed to create visitor:', visitorError.message);
            }
        }

        // Send SMS response via Sinch API
        console.log('📨 Attempting to send SMS response...');
        const sendResult = await sendSinchSMS(from, responseMessage, sinchServicePlanId, sinchApiToken, sinchPhoneNumber);
        
        // Log outbound message with actual send status - USE SERVICE ROLE
        try {
            await base44.asServiceRole.entities.TextMessage.create({
                phone_number: from,
                direction: 'outbound',
                message_body: responseMessage + SMS_DISCLAIMER,
                keyword_triggered: keyword,
                status: sendResult.success ? 'sent' : 'failed',
                message_id: sendResult.messageId,
                error_message: sendResult.success ? null : sendResult.error
            });
            console.log(`✅ Logged outbound message as: ${sendResult.success ? 'SENT' : 'FAILED'}`);
        } catch (dbError) {
            console.error('⚠️ Failed to log outbound message:', dbError.message);
        }

        if (sendResult.success) {
            console.log('✅ SMS response sent successfully! NO REGISTRATION REQUIRED.');
            console.log('Message ID:', sendResult.messageId);
        } else {
            console.error('❌ Failed to send SMS response:', sendResult.error);
        }

        console.log('=== END SINCH WEBHOOK ===');

        return Response.json({
            status: sendResult.success ? 'ok' : 'error',
            message: sendResult.success ? 'Keyword processed and response sent' : `Failed to send response: ${sendResult.error}`,
            details: sendResult
        }, { status: 200 });

    } catch (error) {
        console.error('=== CRITICAL ERROR ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== END ERROR ===');
        
        return Response.json({
            error: 'Internal server error',
            message: 'We encountered an error processing your message.',
            details: error.message
        }, { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
});

// Helper function to send SMS via Sinch API
async function sendSinchSMS(to, message, servicePlanId, apiToken, fromNumber) {
    try {
        console.log('💬 Sending SMS via Sinch API');
        console.log('To:', to);
        console.log('From:', fromNumber);
        console.log('Message:', message);
        console.log('Service Plan ID:', servicePlanId ? servicePlanId.substring(0, 8) + '...' : 'NOT SET');
        console.log('API Token:', apiToken ? 'SET (' + apiToken.length + ' chars)' : 'NOT SET');

        // Format phone number
        let formattedTo = to;
        if (!to.startsWith('+')) {
            formattedTo = '+' + to;
        }

        let formattedFrom = fromNumber;
        if (!fromNumber.startsWith('+')) {
            formattedFrom = '+' + fromNumber;
        }

        // Add TCPA disclaimer
        const messageWithDisclaimer = message + SMS_DISCLAIMER;

        // Sinch API endpoint
        const sinchUrl = `https://us.sms.api.sinch.com/xms/v1/${servicePlanId}/batches`;
        
        console.log('Sinch API URL:', sinchUrl);

        const payload = {
            from: formattedFrom,
            to: [formattedTo],
            body: messageWithDisclaimer
        };

        console.log('Request payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(sinchUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        console.log('Sinch API response status:', response.status);
        console.log('Sinch API response:', JSON.stringify(responseData, null, 2));

        if (response.ok) {
            console.log('✅ Sinch API call successful');
            return { 
                success: true, 
                data: responseData,
                messageId: responseData.id
            };
        } else {
            console.error('❌ Sinch API call failed');
            console.error('Status:', response.status);
            console.error('Error:', responseData);
            return { 
                success: false, 
                error: `Sinch API error: ${responseData.text || responseData.message || 'Unknown error'}`,
                details: responseData
            };
        }

    } catch (error) {
        console.error('❌ Exception in sendSinchSMS:', error);
        return { 
            success: false, 
            error: `Failed to send SMS: ${error.message}`
        };
    }
}