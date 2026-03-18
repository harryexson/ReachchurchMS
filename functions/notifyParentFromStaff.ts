import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const MESSAGE_TEMPLATES = {
    feeding_needed: (child) => `🍼 Children's Church Update: ${child} needs to be fed. Please come to the children's area or respond to this message.`,
    diaper_change: (child) => `👶 Children's Church Update: ${child} needs a diaper/clothes change. Please come to the children's area.`,
    emergency: (child) => `🚨 URGENT - Children's Church: Please come to the children's area immediately regarding ${child}.`,
    pickup_now: (child) => `📢 Children's Church: Please come pick up ${child} at your earliest convenience.`,
    medication_needed: (child) => `💊 Children's Church: ${child}'s medication is due. Please come to the children's area.`,
    crying_upset: (child) => `😢 Children's Church: ${child} is upset and needs you. Please come to the children's area.`,
    injury: (child) => `🩹 Children's Church: ${child} has had a minor incident. Please come to the children's area right away.`,
    supplies_needed: (child) => `🎒 Children's Church: We need supplies (extra clothes/diapers) for ${child}. Please bring them to the children's area.`,
    behavior_concern: (child) => `⚠️ Children's Church: We'd like to speak with you about ${child}. Please come to the children's area when service ends.`,
    ready_for_pickup: (child) => `✅ Children's Church: ${child} is ready for pickup! Please come to the children's area with your pickup code.`,
    general: (child, msg) => `📢 Children's Church regarding ${child}: ${msg}`
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const {
            check_in_id,
            child_name,
            parent_name,
            parent_phone,
            parent_email,
            message_type,
            custom_message,
            send_sms,
            send_email,
            send_in_app,
            ministry_area,
            location_room,
            church_admin_email
        } = body;

        if (!check_in_id || !child_name || !message_type) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const templateFn = MESSAGE_TEMPLATES[message_type] || MESSAGE_TEMPLATES.general;
        const messageText = message_type === 'general'
            ? templateFn(child_name, custom_message)
            : templateFn(child_name);

        const fullMessage = `${messageText}\n\nRoom: ${location_room || 'Children\'s Church'} | ${ministry_area || 'Children\'s Ministry'}\n\nThis message is from your church's Children's Ministry staff.`;

        let smsSuccess = false;
        let emailSuccess = false;
        let inAppSuccess = false;
        const errors = [];

        // Send SMS
        if (send_sms && parent_phone) {
            try {
                let cleanPhone = parent_phone.replace(/\D/g, '');
                if (cleanPhone.length === 10) cleanPhone = '1' + cleanPhone;

                const smsRes = await base44.asServiceRole.functions.invoke('sendSignalhouseSMS', {
                    to: cleanPhone,
                    message: fullMessage,
                    skipDisclaimer: true
                });
                smsSuccess = smsRes?.data?.success === true;
                if (!smsSuccess) errors.push('SMS: ' + (smsRes?.data?.error || 'failed'));
            } catch (e) {
                errors.push('SMS error: ' + e.message);
            }
        }

        // Send Email
        if (send_email && parent_email) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: parent_email,
                    from_name: "Children's Church",
                    subject: `Children's Church Update - ${child_name}`,
                    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #7c3aed, #db2777); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">👶 Children's Church</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Message for ${parent_name || 'Parent/Guardian'}</p>
                        </div>
                        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                            <p style="font-size: 18px; color: #111827; font-weight: bold;">Hello ${parent_name || 'Parent'}!</p>
                            <div style="background: #f3f4f6; border-left: 4px solid #7c3aed; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p style="font-size: 16px; color: #1f2937; margin: 0;">${fullMessage.replace(/\n/g, '<br>')}</p>
                            </div>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you have questions, please come to the children's area directly.</p>
                        </div>
                    </div>`
                });
                emailSuccess = true;
            } catch (e) {
                errors.push('Email error: ' + e.message);
            }
        }

        // Send In-App notification
        if (send_in_app && parent_email) {
            try {
                await base44.asServiceRole.entities.Notification.create({
                    user_email: parent_email,
                    title: `Children's Church: ${child_name}`,
                    message: messageText,
                    type: 'kids_ministry',
                    read: false,
                    created_at: new Date().toISOString()
                });
                inAppSuccess = true;
            } catch (e) {
                errors.push('In-app error: ' + e.message);
            }
        }

        // Save message record
        const sentVia = [];
        if (smsSuccess) sentVia.push('sms');
        if (emailSuccess) sentVia.push('email');
        if (inAppSuccess) sentVia.push('in_app');

        await base44.asServiceRole.entities.KidsParentMessage.create({
            check_in_id,
            child_name,
            parent_name: parent_name || '',
            parent_phone: parent_phone || '',
            parent_email: parent_email || '',
            message_type,
            message_text: fullMessage,
            sent_via: sentVia,
            sent_by: user.email,
            sent_by_name: user.full_name,
            ministry_area: ministry_area || '',
            location_room: location_room || '',
            sent_at: new Date().toISOString(),
            sms_success: smsSuccess,
            email_success: emailSuccess,
            in_app_success: inAppSuccess,
            church_admin_email: church_admin_email || ''
        });

        return Response.json({
            success: smsSuccess || emailSuccess || inAppSuccess,
            sms_success: smsSuccess,
            email_success: emailSuccess,
            in_app_success: inAppSuccess,
            errors
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});