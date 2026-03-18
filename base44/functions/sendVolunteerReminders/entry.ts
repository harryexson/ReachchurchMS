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
            shift_id,
            hours_before = 24,
            send_method = 'both'
        } = body;

        // Get shift details
        const shift = await base44.entities.VolunteerShift.get(shift_id);
        if (!shift) {
            return Response.json({ error: 'Shift not found' }, { status: 404 });
        }

        // Get church settings
        const settings = await base44.entities.ChurchSettings.list();
        const churchName = settings.length > 0 ? settings[0].church_name : 'Our Church';

        // Get confirmed volunteers who haven't received reminder
        const invitations = await base44.entities.VolunteerInvitation.filter({
            shift_id: shift_id,
            response: 'confirmed',
            reminder_sent: false
        });

        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };

        for (const invitation of invitations) {
            try {
                const reminderEmailBody = `Hi ${invitation.volunteer_name},

This is a friendly reminder about your volunteer commitment:

📅 **Event:** ${shift.event_title}
🎯 **Your Role:** ${shift.role}
📆 **Date:** ${new Date(shift.shift_date).toLocaleDateString()}
⏰ **Time:** ${shift.shift_start_time} - ${shift.shift_end_time}
📍 **Location:** ${shift.campus || 'Main Campus'}

**Call Time:** Please arrive 15 minutes early

We're counting on you! If something comes up and you can't make it, please let us know ASAP so we can find a replacement.

Thank you for serving! 🙏

${shift.team_leader_name || churchName}
${shift.team_leader ? `\nContact: ${shift.team_leader}` : ''}`;

                const reminderSmsBody = `Reminder: You're serving as ${shift.role} tomorrow at ${shift.shift_start_time}. Please arrive 15 min early. Can't make it? Reply CANCEL. Thanks! - ${churchName}`;

                // Send reminder
                if (send_method === 'email' || send_method === 'both') {
                    try {
                        const { SendEmail } = await import('../integrations/Core');
                        await SendEmail({
                            from_name: shift.team_leader_name || churchName,
                            to: invitation.volunteer_email,
                            subject: `⏰ Reminder: You're serving tomorrow at ${shift.event_title}`,
                            body: reminderEmailBody
                        });
                    } catch (error) {
                        console.error('Email failed:', error);
                    }
                }

                if ((send_method === 'sms' || send_method === 'both') && invitation.volunteer_phone) {
                    try {
                        const { sendSinchSMS } = await import('./sendSinchSMS');
                        await sendSinchSMS({
                            to: invitation.volunteer_phone,
                            message: reminderSmsBody
                        });
                    } catch (error) {
                        console.error('SMS failed:', error);
                    }
                }

                // Mark reminder as sent
                await base44.entities.VolunteerInvitation.update(invitation.id, {
                    reminder_sent: true,
                    reminder_sent_date: new Date().toISOString()
                });

                results.sent++;

            } catch (error) {
                console.error(`Failed to remind ${invitation.volunteer_name}:`, error);
                results.failed++;
                results.errors.push(`${invitation.volunteer_name}: ${error.message}`);
            }
        }

        return Response.json({
            success: true,
            results: results
        });

    } catch (error) {
        console.error('Reminder error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});