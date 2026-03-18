import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get active templates with auto-send enabled
        const templates = await base44.asServiceRole.entities.ServicePlanNotificationTemplate.filter({
            auto_send_enabled: true
        });

        if (templates.length === 0) {
            return Response.json({ 
                message: 'No auto-send templates enabled',
                sent_count: 0
            });
        }

        // Get all unpublished or not-yet-sent service plans
        const allServicePlans = await base44.asServiceRole.entities.ServicePlan.list();
        
        let sentCount = 0;
        const now = new Date();

        for (const template of templates) {
            const daysBeforeMs = template.auto_send_days_before * 24 * 60 * 60 * 1000;

            for (const servicePlan of allServicePlans) {
                const serviceDate = new Date(servicePlan.service_date);
                const timeDiff = serviceDate - now;
                const daysUntilService = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));

                // Check if it's time to send (within +/- 12 hours of the target)
                const shouldSend = daysUntilService === template.auto_send_days_before;
                
                // Check if already sent (you might want to add a sent_notifications field to ServicePlan)
                const alreadySent = servicePlan.auto_notifications_sent || false;

                if (shouldSend && !alreadySent) {
                    // Send the service plan
                    await base44.functions.invoke('sendServicePlan', {
                        service_plan_id: servicePlan.id,
                        template_id: template.id
                    });

                    // Mark as sent
                    await base44.asServiceRole.entities.ServicePlan.update(servicePlan.id, {
                        auto_notifications_sent: true,
                        last_notification_date: new Date().toISOString()
                    });

                    sentCount++;
                }
            }
        }

        return Response.json({
            success: true,
            sent_count: sentCount,
            message: `Automatically sent ${sentCount} service plan notification(s)`
        });

    } catch (error) {
        console.error('Error in auto-send service plans:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});