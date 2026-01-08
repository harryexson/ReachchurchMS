import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { from, body } = await req.json();

        console.log('Processing SMS giving from:', from, 'Body:', body);

        // Parse the SMS message
        // Expected formats:
        // "GIVE 50" or "GIVE $50" or "GIVE 50 tithe"
        // "DONATE 100 building"
        const text = body.trim().toUpperCase();
        const parts = text.split(/\s+/);

        if (parts.length < 2) {
            return Response.json({
                error: 'Invalid format',
                message: 'Please text: GIVE [amount] or GIVE [amount] [type]'
            });
        }

        const keyword = parts[0];
        if (!['GIVE', 'DONATE', 'OFFERING', 'TITHE'].includes(keyword)) {
            return Response.json({
                error: 'Invalid keyword',
                message: 'Valid keywords: GIVE, DONATE, OFFERING, TITHE'
            });
        }

        // Extract amount
        let amountStr = parts[1].replace(/[$€£¥₦]/g, '');
        const amount = parseFloat(amountStr);

        if (isNaN(amount) || amount <= 0) {
            return Response.json({
                error: 'Invalid amount',
                message: 'Please specify a valid donation amount'
            });
        }

        // Extract donation type (optional)
        const donationType = parts[2]?.toLowerCase() || 'offering';

        // Check if donor exists in system
        const phoneClean = from.replace(/\D/g, '');
        const donors = await base44.asServiceRole.entities.Member.filter({
            phone: { $regex: phoneClean }
        });

        let donor = null;
        if (donors.length > 0) {
            donor = donors[0];
        } else {
            // Check visitors
            const visitors = await base44.asServiceRole.entities.Visitor.filter({
                phone: { $regex: phoneClean }
            });
            if (visitors.length > 0) {
                donor = visitors[0];
            }
        }

        if (!donor) {
            // Create temporary donor record
            const baseUrl = 'https://base44.app/apps/68d38ad0f4d6d5d05900d129';
            const replyUrl = `${baseUrl}/PublicGiving?phone=${encodeURIComponent(from)}&amount=${amount}`;
            
            await base44.asServiceRole.functions.invoke('sendSinchSMS', {
                to: from,
                message: `Thank you for your donation! To complete your $${amount} ${donationType} donation, please visit: ${replyUrl}\n\nReply STOP to unsubscribe.`
            });

            return Response.json({
                success: true,
                message: 'Payment link sent',
                requiresSetup: true
            });
        }

        // Create donation checkout session
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchName = settings[0]?.church_name || 'Our Church';

        // Build absolute URL
        const baseUrl = 'https://base44.app/apps/68d38ad0f4d6d5d05900d129';
        const checkoutUrl = `${baseUrl}/PublicGiving?phone=${encodeURIComponent(from)}&amount=${amount}&type=${donationType}&donor=${encodeURIComponent(donor.email || donor.name)}`;

        // Send SMS with payment link
        await base44.asServiceRole.functions.invoke('sendSinchSMS', {
            to: from,
            message: `Hi ${donor.name || donor.first_name}! Click here to complete your $${amount} donation to ${churchName}: ${checkoutUrl}\n\nReply STOP to unsubscribe.`
        });

        // Log the SMS giving attempt
        await base44.asServiceRole.entities.TextMessage.create({
            from_number: from,
            to_number: Deno.env.get('SINCH_PHONE_NUMBER'),
            message_body: body,
            direction: 'inbound',
            status: 'processed',
            message_type: 'sms_giving',
            metadata: {
                amount: amount,
                donation_type: donationType,
                donor_name: donor.name || donor.first_name,
                donor_email: donor.email,
                checkout_url: checkoutUrl
            }
        });

        return Response.json({
            success: true,
            message: 'Payment link sent to donor',
            amount: amount,
            donationType: donationType,
            checkoutUrl: checkoutUrl
        });

    } catch (error) {
        console.error('Error processing SMS giving:', error);
        return Response.json({
            error: 'Processing failed',
            message: error.message
        }, { status: 500 });
    }
});