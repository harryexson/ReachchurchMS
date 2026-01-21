import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const { service_plan_id } = payload;

        // Get service plan
        const servicePlan = await base44.asServiceRole.entities.ServicePlan.filter({ 
            id: service_plan_id 
        }).then(r => r[0]);

        if (!servicePlan) {
            return Response.json({ error: 'Service plan not found' }, { status: 404 });
        }

        // Get service items
        const serviceItems = await base44.asServiceRole.entities.ServiceItem.filter({
            service_plan_id: service_plan_id
        });

        const sortedItems = serviceItems.sort((a, b) => a.order_index - b.order_index);

        // Get team positions
        const teamPositions = await base44.asServiceRole.entities.TeamPosition.filter({
            service_plan_id: service_plan_id
        });

        // Collect recipients
        const recipients = [
            { email: servicePlan.worship_leader_email, name: servicePlan.worship_leader },
            { email: servicePlan.preacher_email, name: servicePlan.preacher },
            ...teamPositions.map(p => ({ email: p.assigned_email, name: p.assigned_member }))
        ].filter(r => r.email);

        // Build service flow HTML
        let itemsHtml = '<ol>';
        for (const item of sortedItems) {
            itemsHtml += `
                <li style="margin-bottom: 10px;">
                    <strong>${item.title}</strong> (${item.duration_minutes} min)
                    ${item.song_key ? `<br><small>Key: ${item.song_key}</small>` : ''}
                    ${item.assigned_to ? `<br><small>Assigned: ${item.assigned_to}</small>` : ''}
                    ${item.notes ? `<br><em style="color: #856404; background: #fff3cd; padding: 5px; display: inline-block; margin-top: 5px;">Notes: ${item.notes}</em>` : ''}
                </li>
            `;
        }
        itemsHtml += '</ol>';

        // Build team list HTML
        let teamHtml = '<ul>';
        for (const position of teamPositions) {
            teamHtml += `<li>${position.position_name}: ${position.assigned_member || 'TBD'}</li>`;
        }
        teamHtml += '</ul>';

        // Send to each recipient
        for (const recipient of recipients) {
            await base44.integrations.Core.SendEmail({
                to: recipient.email,
                subject: `Service Plan: ${servicePlan.title}`,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                        <h1 style="color: #2563eb;">${servicePlan.title}</h1>
                        
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Date:</strong> ${new Date(servicePlan.service_date).toLocaleString()}</p>
                            ${servicePlan.theme ? `<p><strong>Theme:</strong> ${servicePlan.theme}</p>` : ''}
                            ${servicePlan.rehearsal_date ? `<p><strong>Rehearsal:</strong> ${new Date(servicePlan.rehearsal_date).toLocaleString()}</p>` : ''}
                            <p><strong>Total Duration:</strong> ${servicePlan.total_duration_minutes} minutes</p>
                        </div>

                        <h2 style="color: #1e40af; margin-top: 30px;">Service Flow</h2>
                        ${itemsHtml}

                        <h2 style="color: #1e40af; margin-top: 30px;">Team Assignments</h2>
                        ${teamHtml}

                        ${servicePlan.notes ? `
                            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
                                <h3 style="margin-top: 0;">Service Notes</h3>
                                <p>${servicePlan.notes}</p>
                            </div>
                        ` : ''}

                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                        
                        <p style="color: #64748b; font-size: 14px;">
                            Please review your assignment and prepare accordingly. If you have any questions, contact the worship leader or service coordinator.
                        </p>
                    </div>
                `
            });
        }

        return Response.json({
            success: true,
            recipients_count: recipients.length
        });

    } catch (error) {
        console.error('Error sending service plan:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});