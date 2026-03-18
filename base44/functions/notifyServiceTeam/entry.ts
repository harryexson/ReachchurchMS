import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const { event, data } = payload;

        // Only send notifications when service plan is published
        if (event.type !== 'update' || !data.published) {
            return Response.json({ message: 'No notification needed', skipped: true });
        }

        // Get all team positions for this service
        const teamPositions = await base44.asServiceRole.entities.TeamPosition.filter({
            service_plan_id: data.id
        });

        // Collect all team member emails
        const teamEmails = [
            data.worship_leader_email,
            data.preacher_email,
            ...teamPositions.filter(p => p.assigned_email).map(p => p.assigned_email)
        ].filter(Boolean);

        // Send notifications to each team member
        for (const email of teamEmails) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: email,
                title: `Service Assignment: ${data.title}`,
                message: `You've been assigned to ${data.title} on ${new Date(data.service_date).toLocaleDateString()}. Check your role and prepare accordingly.`,
                type: 'service_assignment',
                link: `/ServicePlanDetail?id=${data.id}`,
                read: false
            });

            // Send email notification
            await base44.integrations.Core.SendEmail({
                to: email,
                subject: `Service Assignment: ${data.title}`,
                body: `
                    <h2>You've Been Assigned to a Service</h2>
                    <p><strong>${data.title}</strong></p>
                    <p>Date: ${new Date(data.service_date).toLocaleString()}</p>
                    ${data.rehearsal_date ? `<p>Rehearsal: ${new Date(data.rehearsal_date).toLocaleString()}</p>` : ''}
                    ${data.theme ? `<p>Theme: ${data.theme}</p>` : ''}
                    <p>Please log in to view your full assignment details.</p>
                `
            });
        }

        console.log(`✅ Notifications sent to ${teamEmails.length} team members`);

        return Response.json({
            success: true,
            notified: teamEmails.length
        });

    } catch (error) {
        console.error('Error sending service notifications:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});