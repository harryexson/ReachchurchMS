import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const { group_type, group_id, message_subject, message_body, send_sms, sender_name } = payload;

        let recipients = [];

        // Determine recipients based on group type
        if (group_type === 'service_team') {
            const servicePlan = await base44.asServiceRole.entities.ServicePlan.filter({ 
                id: group_id 
            }).then(r => r[0]);
            
            if (servicePlan) {
                const teamPositions = await base44.asServiceRole.entities.TeamPosition.filter({
                    service_plan_id: group_id
                });
                
                recipients = [
                    { email: servicePlan.worship_leader_email, name: servicePlan.worship_leader },
                    { email: servicePlan.preacher_email, name: servicePlan.preacher },
                    ...teamPositions.map(p => ({ email: p.assigned_email, name: p.assigned_member, phone: p.assigned_phone }))
                ].filter(r => r.email);
            }
        } else if (group_type === 'member_group') {
            const assignments = await base44.asServiceRole.entities.MemberGroupAssignment.filter({
                group_id: group_id
            });
            
            for (const assignment of assignments) {
                const member = await base44.asServiceRole.entities.Member.filter({ 
                    id: assignment.member_id 
                }).then(r => r[0]);
                
                if (member) {
                    recipients.push({ 
                        email: member.email, 
                        name: `${member.first_name} ${member.last_name}`,
                        phone: member.phone
                    });
                }
            }
        } else if (group_type === 'all_members') {
            const members = await base44.asServiceRole.entities.Member.list();
            recipients = members.map(m => ({ 
                email: m.email, 
                name: `${m.first_name} ${m.last_name}`,
                phone: m.phone
            })).filter(r => r.email);
        } else if (group_type === 'volunteers') {
            const volunteers = await base44.asServiceRole.entities.Volunteer.filter({ status: 'active' });
            recipients = volunteers.map(v => ({ 
                email: v.email, 
                name: v.member_name,
                phone: v.phone
            })).filter(r => r.email);
        }

        // Send emails
        for (const recipient of recipients) {
            await base44.integrations.Core.SendEmail({
                to: recipient.email,
                from_name: sender_name || 'Church Admin',
                subject: message_subject,
                body: `
                    <div style="font-family: Arial, sans-serif;">
                        <p>Hello ${recipient.name},</p>
                        ${message_body}
                    </div>
                `
            });

            // Create in-app notification
            await base44.asServiceRole.entities.Notification.create({
                user_email: recipient.email,
                title: message_subject,
                message: message_body.replace(/<[^>]*>/g, '').substring(0, 200),
                type: 'announcement',
                read: false
            });
        }

        // Send SMS if requested (only to those with phone numbers)
        if (send_sms) {
            const smsRecipients = recipients.filter(r => r.phone);
            
            for (const recipient of smsRecipients) {
                try {
                    await base44.asServiceRole.functions.invoke('sendSinchSMS', {
                        to: recipient.phone,
                        message: `${message_subject}\n\n${message_body.replace(/<[^>]*>/g, '').substring(0, 300)}`
                    });
                } catch (error) {
                    console.warn(`SMS failed for ${recipient.phone}:`, error.message);
                }
            }
        }

        return Response.json({
            success: true,
            emails_sent: recipients.length,
            sms_sent: send_sms ? recipients.filter(r => r.phone).length : 0
        });

    } catch (error) {
        console.error('Error sending group message:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});