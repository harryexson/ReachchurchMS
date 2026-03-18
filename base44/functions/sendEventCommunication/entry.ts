import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            communication_id, 
            event_id, 
            communication_type,
            channel,
            subject,
            message_body,
            target_audience 
        } = body;

        // Get event details
        const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
        const event = events[0];
        
        if (!event) {
            return Response.json({ error: 'Event not found' }, { status: 404 });
        }

        // Get registrations
        let registrations = await base44.asServiceRole.entities.EventRegistration.filter({
            event_id: event_id
        });

        // Filter by target audience
        switch (target_audience) {
            case 'confirmed_only':
                registrations = registrations.filter(r => r.checked_in);
                break;
            case 'pending_only':
                registrations = registrations.filter(r => !r.checked_in);
                break;
            // 'all_registered' - no filter needed
        }

        if (registrations.length === 0) {
            return Response.json({ 
                success: false,
                error: 'No recipients found',
                sent_count: 0
            });
        }

        // Format event details for placeholders
        const eventDate = event.start_datetime ? new Date(event.start_datetime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
        const eventTime = event.start_datetime ? new Date(event.start_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

        let sentCount = 0;
        let failedCount = 0;

        // Send to each recipient
        for (const registration of registrations) {
            try {
                // Replace placeholders
                let personalizedMessage = message_body
                    .replace(/{attendee_name}/g, registration.registrant_name)
                    .replace(/{event_title}/g, event.title)
                    .replace(/{event_date}/g, eventDate)
                    .replace(/{event_time}/g, eventTime)
                    .replace(/{event_location}/g, event.location || 'Church Campus')
                    .replace(/{registration_code}/g, registration.registration_code || '')
                    .replace(/{qr_code_link}/g, registration.qr_code_url || '');

                let personalizedSubject = subject
                    .replace(/{attendee_name}/g, registration.registrant_name)
                    .replace(/{event_title}/g, event.title)
                    .replace(/{event_date}/g, eventDate);

                // Send via email
                if (channel === 'email' || channel === 'both') {
                    try {
                        const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
                            to: registration.registrant_email,
                            from_name: 'Church Events',
                            subject: personalizedSubject,
                            body: personalizedMessage
                        });

                        // Log the send
                        await base44.asServiceRole.entities.EventCommunicationLog.create({
                            event_id: event_id,
                            communication_id: communication_id || null,
                            recipient_name: registration.registrant_name,
                            recipient_email: registration.registrant_email,
                            channel: 'email',
                            message_body: personalizedMessage,
                            status: 'sent',
                            sent_date: new Date().toISOString()
                        });

                        sentCount++;
                    } catch (emailError) {
                        console.error(`Email failed for ${registration.registrant_email}:`, emailError);
                        failedCount++;

                        await base44.asServiceRole.entities.EventCommunicationLog.create({
                            event_id: event_id,
                            communication_id: communication_id || null,
                            recipient_name: registration.registrant_name,
                            recipient_email: registration.registrant_email,
                            channel: 'email',
                            message_body: personalizedMessage,
                            status: 'failed',
                            sent_date: new Date().toISOString(),
                            error_message: emailError.message
                        });
                    }
                }

                // Send via SMS
                if ((channel === 'sms' || channel === 'both') && registration.registrant_phone) {
                    try {
                        const smsResult = await base44.asServiceRole.functions.invoke('sendSinchSMS', {
                            to: registration.registrant_phone,
                            message: personalizedMessage
                        });

                        if (smsResult.success) {
                            await base44.asServiceRole.entities.EventCommunicationLog.create({
                                event_id: event_id,
                                communication_id: communication_id || null,
                                recipient_name: registration.registrant_name,
                                recipient_email: registration.registrant_email,
                                recipient_phone: registration.registrant_phone,
                                channel: 'sms',
                                message_body: personalizedMessage,
                                status: 'sent',
                                sent_date: new Date().toISOString()
                            });

                            sentCount++;
                        } else {
                            failedCount++;
                        }
                    } catch (smsError) {
                        console.error(`SMS failed for ${registration.registrant_phone}:`, smsError);
                        failedCount++;
                    }
                }

            } catch (error) {
                console.error(`Failed to send to ${registration.registrant_email}:`, error);
                failedCount++;
            }
        }

        // Update communication record
        if (communication_id) {
            await base44.asServiceRole.entities.EventCommunication.update(communication_id, {
                status: 'sent',
                sent_date: new Date().toISOString(),
                sent_count: sentCount,
                failed_count: failedCount
            });
        }

        return Response.json({ 
            success: true,
            sent_count: sentCount,
            failed_count: failedCount,
            total_recipients: registrations.length
        });

    } catch (error) {
        console.error('Event communication error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});