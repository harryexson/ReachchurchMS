import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== EVENT INVITATIONS =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { event_id, target_segments, message_type, custom_message } = await req.json();

        if (!event_id) {
            return Response.json({ error: 'Event ID required' }, { status: 400 });
        }

        // Get event details
        const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
        if (events.length === 0) {
            return Response.json({ error: 'Event not found' }, { status: 404 });
        }

        const event = events[0];
        console.log(`[${requestId}] Processing invitations for: ${event.title}`);

        // Build recipient list based on segments
        const recipients = new Set();

        // Add members if selected
        if (target_segments.includes('members')) {
            const members = await base44.asServiceRole.entities.Member.list();
            members.forEach(m => {
                if (m.email) recipients.add(m.email);
            });
        }

        // Add visitors if selected
        if (target_segments.includes('visitors')) {
            const visitors = await base44.asServiceRole.entities.Visitor.list();
            visitors.forEach(v => {
                if (v.email) recipients.add(v.email);
            });
        }

        // Add donors by segment
        if (target_segments.includes('recent_donors')) {
            const donations = await base44.asServiceRole.entities.Donation.list('-donation_date', 500);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            
            donations.forEach(d => {
                if (d.donor_email && new Date(d.donation_date) >= threeMonthsAgo) {
                    recipients.add(d.donor_email);
                }
            });
        }

        if (target_segments.includes('recurring_donors')) {
            const donations = await base44.asServiceRole.entities.Donation.filter({ recurring: true });
            donations.forEach(d => {
                if (d.donor_email) recipients.add(d.donor_email);
            });
        }

        // Add volunteers if selected
        if (target_segments.includes('volunteers')) {
            const volunteers = await base44.asServiceRole.entities.Volunteer.list();
            volunteers.forEach(v => {
                if (v.email) recipients.add(v.email);
            });
        }

        console.log(`[${requestId}] Found ${recipients.size} unique recipients`);

        // Get church settings
        const settings = await base44.asServiceRole.entities.ChurchSettings.list();
        const churchName = settings.length > 0 ? settings[0].church_name : 'Our Church';

        // Build message
        const eventDate = new Date(event.start_datetime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        let subject = '';
        let messageBody = '';

        if (message_type === 'invitation') {
            subject = `You're Invited: ${event.title}`;
            messageBody = custom_message || `You're invited to join us for ${event.title}!

Date & Time: ${eventDate}
Location: ${event.location || 'See event details'}

${event.description || ''}

We hope to see you there!

${churchName}`;
        } else if (message_type === 'reminder') {
            subject = `Reminder: ${event.title} is coming up!`;
            messageBody = custom_message || `This is a friendly reminder about ${event.title}.

Date & Time: ${eventDate}
Location: ${event.location || 'See event details'}

We're looking forward to seeing you!

${churchName}`;
        }

        let sentCount = 0;
        let failedCount = 0;

        // Send to each recipient
        for (const email of recipients) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    from_name: churchName,
                    to: email,
                    subject: subject,
                    body: messageBody
                });

                // Log communication
                await base44.asServiceRole.entities.EventCommunicationLog.create({
                    event_id: event_id,
                    communication_type: message_type,
                    recipient_email: email,
                    subject: subject,
                    message_body: messageBody,
                    sent_date: new Date().toISOString(),
                    status: 'sent'
                });

                sentCount++;
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`[${requestId}] Failed to send to ${email}:`, error.message);
                
                await base44.asServiceRole.entities.EventCommunicationLog.create({
                    event_id: event_id,
                    communication_type: message_type,
                    recipient_email: email,
                    subject: subject,
                    message_body: messageBody,
                    sent_date: new Date().toISOString(),
                    status: 'failed',
                    error_message: error.message
                });

                failedCount++;
            }
        }

        console.log(`[${requestId}] ✅ Invitations sent - Success: ${sentCount}, Failed: ${failedCount}`);

        return Response.json({
            success: true,
            sent: sentCount,
            failed: failedCount,
            total: recipients.size
        });

    } catch (error) {
        console.error(`[${requestId}] Error:`, error.message);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});