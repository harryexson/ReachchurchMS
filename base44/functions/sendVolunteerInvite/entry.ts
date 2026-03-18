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
            volunteer_ids = [],
            ministry_filter = null,
            campus_filter = null,
            send_method = 'email' // 'email', 'sms', 'both'
        } = body;

        // Get shift details
        const shift = await base44.entities.VolunteerShift.get(shift_id);
        if (!shift) {
            return Response.json({ error: 'Shift not found' }, { status: 404 });
        }

        // Get church settings
        const settings = await base44.entities.ChurchSettings.list();
        const churchName = settings.length > 0 ? settings[0].church_name : 'Our Church';

        // Get volunteers to invite
        let volunteers = [];
        if (volunteer_ids.length > 0) {
            // Specific volunteers
            for (const id of volunteer_ids) {
                const vol = await base44.entities.Volunteer.get(id);
                if (vol) volunteers.push(vol);
            }
        } else {
            // Filter by ministry/campus
            const filters = { status: 'active' };
            if (ministry_filter) filters.ministry = ministry_filter;
            volunteers = await base44.entities.Volunteer.filter(filters);
        }

        const results = {
            invited: 0,
            failed: 0,
            errors: []
        };

        for (const volunteer of volunteers) {
            try {
                // Check if already invited
                const existing = await base44.entities.VolunteerInvitation.filter({
                    shift_id: shift_id,
                    volunteer_id: volunteer.id
                });

                if (existing.length > 0) {
                    console.log(`${volunteer.member_name} already invited`);
                    continue;
                }

                // Create invitation record
                const invitation = await base44.entities.VolunteerInvitation.create({
                    shift_id: shift_id,
                    volunteer_id: volunteer.id,
                    volunteer_name: volunteer.member_name,
                    volunteer_email: volunteer.email,
                    volunteer_phone: volunteer.phone,
                    event_title: shift.event_title,
                    role: shift.role,
                    shift_date: shift.shift_date,
                    shift_time: `${shift.shift_start_time} - ${shift.shift_end_time}`,
                    invited_date: new Date().toISOString(),
                    invited_by: user.email,
                    response: 'pending'
                });

                // Generate confirmation link
                const confirmUrl = `${Deno.env.get('APP_URL') || 'https://preview--church-connect-5900d129.base44.app'}/volunteer-confirm?invitation=${invitation.id}&response=confirmed`;
                const declineUrl = `${Deno.env.get('APP_URL') || 'https://preview--church-connect-5900d129.base44.app'}/volunteer-confirm?invitation=${invitation.id}&response=declined`;

                // Prepare message
                const emailBody = `Hi ${volunteer.member_name},

We need your help! 🙏

**Event:** ${shift.event_title}
**Role:** ${shift.role}
**Date:** ${new Date(shift.shift_date).toLocaleDateString()}
**Time:** ${shift.shift_start_time} - ${shift.shift_end_time}
${shift.special_requirements ? `\n**Requirements:** ${shift.special_requirements}` : ''}

Can you serve with us?

👍 Confirm: ${confirmUrl}
👎 Decline: ${declineUrl}

Thank you for your heart to serve!

${shift.team_leader_name || churchName}`;

                const smsBody = `Hi ${volunteer.member_name.split(' ')[0]}! Can you serve as ${shift.role} on ${new Date(shift.shift_date).toLocaleDateString()} at ${shift.shift_start_time}? Reply YES to confirm or NO to decline. - ${churchName}`;

                // Send invitation
                if (send_method === 'email' || send_method === 'both') {
                    try {
                        const { SendEmail } = await import('../integrations/Core');
                        await SendEmail({
                            from_name: shift.team_leader_name || churchName,
                            to: volunteer.email,
                            subject: `🙋 Volunteer Opportunity: ${shift.role} needed for ${shift.event_title}`,
                            body: emailBody
                        });
                    } catch (error) {
                        console.error('Email failed:', error);
                    }
                }

                if ((send_method === 'sms' || send_method === 'both') && volunteer.phone) {
                    try {
                        const { sendSinchSMS } = await import('./sendSinchSMS');
                        await sendSinchSMS({
                            to: volunteer.phone,
                            message: smsBody
                        });
                    } catch (error) {
                        console.error('SMS failed:', error);
                    }
                }

                results.invited++;

            } catch (error) {
                console.error(`Failed to invite ${volunteer.member_name}:`, error);
                results.failed++;
                results.errors.push(`${volunteer.member_name}: ${error.message}`);
            }
        }

        return Response.json({
            success: true,
            results: results
        });

    } catch (error) {
        console.error('Invite error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});