import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { v4 as uuidv4 } from 'npm:uuid@9.0.0';

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
            visitor_id,
            sequence_step,
            template_name,
            channel = 'email',
            send_immediately = true
        } = body;

        // Get visitor info
        const visitor = await base44.entities.Visitor.get(visitor_id);
        if (!visitor) {
            return Response.json({ error: 'Visitor not found' }, { status: 404 });
        }

        // Get church settings
        const settings = await base44.entities.ChurchSettings.list();
        const churchName = settings.length > 0 ? settings[0].church_name : 'Our Church';
        const replyToEmail = settings.length > 0 ? settings[0].visitor_reply_email : null;

        // Get active message template
        const templates = await base44.entities.VisitorFollowUpTemplate.filter({
            sequence_step: sequence_step,
            is_active: true
        });

        if (templates.length === 0) {
            return Response.json({ 
                success: false, 
                error: `No active template found for step ${sequence_step}` 
            });
        }

        const template = templates[0];

        // Personalize message
        let messageBody = template.message_body
            .replace(/{visitor_name}/g, visitor.name)
            .replace(/{church_name}/g, churchName)
            .replace(/{visit_date}/g, new Date(visitor.visit_date).toLocaleDateString());

        let subject = template.email_subject || `Following up from ${churchName}`;
        subject = subject
            .replace(/{visitor_name}/g, visitor.name)
            .replace(/{church_name}/g, churchName);

        const results = {
            email_sent: false,
            sms_sent: false,
            errors: []
        };

        const tracking_token = uuidv4();

        // Send via email
        if (channel === 'email' || channel === 'both') {
            try {
                const emailParams = {
                    from_name: churchName,
                    to: visitor.email,
                    subject: subject,
                    body: messageBody
                };
                
                // Add Reply-To header if visitor_reply_email is configured
                if (replyToEmail) {
                    emailParams.reply_to = replyToEmail;
                }
                
                await base44.integrations.Core.SendEmail(emailParams);

                results.email_sent = true;

                // Log the follow-up
                await base44.entities.VisitorFollowUp.create({
                    visitor_id: visitor_id,
                    message_type: 'email',
                    sequence_step: sequence_step,
                    template_name: template_name || template.template_name,
                    subject: subject,
                    message_body: messageBody,
                    date_sent: new Date().toISOString(),
                    status: 'sent',
                    sent_by: user.email,
                    tracking_token: tracking_token
                });

                // Update visitor follow-up status
                const newStatus = `contacted_${sequence_step}`;
                await base44.entities.Visitor.update(visitor_id, {
                    follow_up_status: newStatus,
                    last_contact_date: new Date().toISOString(),
                    total_follow_ups: (visitor.total_follow_ups || 0) + 1
                });

            } catch (error) {
                console.error('Email sending failed:', error);
                results.errors.push(`Email: ${error.message}`);
                
                // Log failed attempt
                await base44.entities.VisitorFollowUp.create({
                    visitor_id: visitor_id,
                    message_type: 'email',
                    sequence_step: sequence_step,
                    template_name: template_name || template.template_name,
                    subject: subject,
                    message_body: messageBody,
                    date_sent: new Date().toISOString(),
                    status: 'failed',
                    sent_by: user.email
                });
            }
        }

        // Send via SMS
        if ((channel === 'sms' || channel === 'both') && visitor.phone) {
            try {
                // Check if SMS is configured
                const sinchSettings = settings.length > 0 ? settings[0] : null;
                
                if (!sinchSettings || !sinchSettings.sinch_configured) {
                    results.errors.push('SMS: Not configured');
                } else {
                    // Call sendSinchSMS function - it will add disclaimer automatically
                    const smsResponse = await base44.functions.invoke('sendSinchSMS', {
                        to: visitor.phone,
                        message: messageBody  // sendSinchSMS will add disclaimer
                    });

                    if (smsResponse.success) {
                        results.sms_sent = true;

                        // Log the follow-up
                        await base44.entities.VisitorFollowUp.create({
                            visitor_id: visitor_id,
                            message_type: 'sms',
                            sequence_step: sequence_step,
                            template_name: template_name || template.template_name,
                            message_body: messageBody,
                            date_sent: new Date().toISOString(),
                            status: 'sent',
                            sent_by: user.email,
                            tracking_token: tracking_token
                        });

                        // Update visitor follow-up status if not already updated by email
                        if (!results.email_sent) {
                            const newStatus = `contacted_${sequence_step}`;
                            await base44.entities.Visitor.update(visitor_id, {
                                follow_up_status: newStatus,
                                last_contact_date: new Date().toISOString(),
                                total_follow_ups: (visitor.total_follow_ups || 0) + 1
                            });
                        }
                    } else {
                        throw new Error(smsResponse.error || 'SMS send failed');
                    }
                }
            } catch (error) {
                console.error('SMS sending failed:', error);
                results.errors.push(`SMS: ${error.message}`);
                
                // Log failed attempt
                await base44.entities.VisitorFollowUp.create({
                    visitor_id: visitor_id,
                    message_type: 'sms',
                    sequence_step: sequence_step,
                    template_name: template_name || template.template_name,
                    message_body: messageBody,
                    date_sent: new Date().toISOString(),
                    status: 'failed',
                    sent_by: user.email
                });
            }
        }

        // Track engagement
        if (results.email_sent || results.sms_sent) {
            await base44.entities.VisitorEngagement.create({
                visitor_id: visitor_id,
                engagement_type: results.email_sent ? 'email_open' : 'sms_keyword',
                engagement_date: new Date().toISOString(),
                source: `follow_up_step_${sequence_step}`,
                follow_up_needed: false
            });
        }

        return Response.json({
            success: results.email_sent || results.sms_sent,
            results: results
        });

    } catch (error) {
        console.error('Error in sendVisitorFollowUp:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});