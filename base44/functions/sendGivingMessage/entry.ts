import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// TCPA Compliance - Required disclaimer for all SMS messages
const SMS_DISCLAIMER = "\n\nMsg & Data Rates may apply. Text STOP to opt-out. Text YES to opt-in.";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            donation_id, 
            donor_name, 
            donor_email, 
            donor_phone,
            amount, 
            donation_type,
            message_type = 'thank_you',
            channel = 'email',
            member_id = null
        } = body;

        // Get church settings
        const settings = await base44.entities.ChurchSettings.list();
        const churchName = settings.length > 0 ? settings[0].church_name : 'Our Church';

        // Get active message templates - prioritize specific donation type matches
        let templates = await base44.entities.GivingMessage.filter({
            message_type: message_type,
            is_active: true
        });

        if (templates.length === 0) {
            console.log(`No active template for ${message_type}`);
            return Response.json({ 
                success: false, 
                message: 'No active message template found' 
            });
        }

        // Find best matching template based on donation type
        let template = null;
        const donationTypeMatch = templates.find(t => 
            t.donation_types && 
            t.donation_types.includes(donation_type)
        );
        const universalMatch = templates.find(t => 
            t.donation_types && 
            t.donation_types.includes('all')
        );
        
        // Priority: specific donation type > universal > any template
        template = donationTypeMatch || universalMatch || templates[0];
        
        console.log(`Using template for ${donation_type}: ${template.id}`);

        // Determine member status for personalization
        let memberStatus = 'valued supporter';
        if (member_id) {
            try {
                const members = await base44.entities.Member.filter({ id: member_id });
                if (members.length > 0) {
                    memberStatus = 'member';
                }
            } catch (err) {
                console.log('Could not determine member status');
            }
        }

        // Format donation type for display
        const formattedDonationType = (donation_type || 'offering')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

        // Personalize message
        let messageBody = template.message_body
            .replace(/{donor_name}/g, donor_name)
            .replace(/{amount}/g, `$${parseFloat(amount).toFixed(2)}`)
            .replace(/{date}/g, new Date().toLocaleDateString())
            .replace(/{church_name}/g, churchName)
            .replace(/{donation_type}/g, formattedDonationType)
            .replace(/{member_status}/g, memberStatus);

        let subject = template.subject || `Thank you for your ${formattedDonationType}!`;
        subject = subject
            .replace(/{donor_name}/g, donor_name)
            .replace(/{amount}/g, `$${parseFloat(amount).toFixed(2)}`)
            .replace(/{church_name}/g, churchName)
            .replace(/{donation_type}/g, formattedDonationType);

        const results = {
            email_sent: false,
            sms_sent: false,
            errors: []
        };

        // Send via email
        if (channel === 'email' || channel === 'both') {
            try {
                await base44.integrations.Core.SendEmail({
                    from_name: churchName,
                    to: donor_email,
                    subject: subject,
                    body: messageBody
                });

                results.email_sent = true;

                // Log the message
                await base44.entities.GivingMessageLog.create({
                    donation_id: donation_id,
                    donor_email: donor_email,
                    message_type: message_type,
                    channel: 'email',
                    message_body: messageBody,
                    sent_date: new Date().toISOString(),
                    status: 'sent'
                });
            } catch (error) {
                console.error('Email sending failed:', error);
                results.errors.push(`Email: ${error.message}`);
                
                // Log failed attempt
                await base44.entities.GivingMessageLog.create({
                    donation_id: donation_id,
                    donor_email: donor_email,
                    message_type: message_type,
                    channel: 'email',
                    message_body: messageBody,
                    sent_date: new Date().toISOString(),
                    status: 'failed',
                    error_message: error.message
                });
            }
        }

        // Send via SMS
        if ((channel === 'sms' || channel === 'both') && donor_phone) {
            try {
                const sinchSettings = settings.length > 0 ? settings[0] : null;
                
                if (!sinchSettings || !sinchSettings.sinch_configured) {
                    results.errors.push('SMS: Not configured');
                } else {
                    const smsResponse = await base44.functions.invoke('sendSinchSMS', {
                        to: donor_phone,
                        message: messageBody // sendSinchSMS will add disclaimer automatically
                    });

                    if (smsResponse.success) {
                        results.sms_sent = true;

                        // Log the message
                        await base44.entities.GivingMessageLog.create({
                            donation_id: donation_id,
                            donor_email: donor_email,
                            donor_phone: donor_phone,
                            message_type: message_type,
                            channel: 'sms',
                            message_body: messageBody,
                            sent_date: new Date().toISOString(),
                            status: 'sent'
                        });
                    } else {
                        throw new Error(smsResponse.error || 'SMS send failed');
                    }
                }
            } catch (error) {
                console.error('SMS sending failed:', error);
                results.errors.push(`SMS: ${error.message}`);
                
                // Log failed attempt
                await base44.entities.GivingMessageLog.create({
                    donation_id: donation_id,
                    donor_email: donor_email,
                    donor_phone: donor_phone,
                    message_type: message_type,
                    channel: 'sms',
                    message_body: messageBody,
                    sent_date: new Date().toISOString(),
                    status: 'failed',
                    error_message: error.message
                });
            }
        }

        return Response.json({
            success: results.email_sent || results.sms_sent,
            results: results
        });

    } catch (error) {
        console.error('Error in sendGivingMessage:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});