import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] Kids Check-In SMS via SignalHouse`);

    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        const { phone, child_name, check_in_code, event_title, qr_code_url, church_name } = body;

        if (!phone || !child_name || !check_in_code) {
            return Response.json({ success: false, error: 'Missing required fields: phone, child_name, check_in_code' }, { status: 400 });
        }

        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '1' + cleanPhone;

        const from = church_name ? `${church_name} - Children's Church` : "Children's Church";

        const message = `👶 ${from}

✅ ${child_name} is checked in for ${event_title || 'Kids Ministry'}!

🔑 Pick-Up Code: ${check_in_code}
${qr_code_url ? `\n📱 QR Code: ${qr_code_url}` : ''}

Show this code to staff at checkout. God bless! 🙏

This is an automated message from your church's Children's Ministry.`;

        console.log(`[${requestId}] Sending via SignalHouse to: +${cleanPhone}`);

        const response = await base44.functions.invoke('sendSignalhouseSMS', {
            to: cleanPhone,
            message,
            skipDisclaimer: true
        });

        console.log(`[${requestId}] Response:`, JSON.stringify(response.data));

        if (response.data?.success) {
            return Response.json({
                success: true,
                message: 'SMS sent successfully',
                message_id: response.data.message_id,
                to: '+' + cleanPhone
            });
        } else {
            return Response.json({
                success: false,
                error: response.data?.error || 'SMS send failed',
                details: response.data
            }, { status: 500 });
        }

    } catch (error) {
        console.error(`[${requestId}] Error:`, error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});