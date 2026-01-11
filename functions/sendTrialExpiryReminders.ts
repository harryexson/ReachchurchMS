import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This is a scheduled function, no user auth needed
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            status: 'trial'
        });

        console.log(`📋 Checking ${subscriptions.length} trial subscriptions`);

        const now = new Date();
        let remindersCreated = 0;

        for (const subscription of subscriptions) {
            if (!subscription.trial_end_date) continue;

            const trialEnd = new Date(subscription.trial_end_date);
            const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

            // Send reminders at 3 days and 1 day before expiry
            if (daysRemaining === 3 || daysRemaining === 1) {
                // Check if we already sent this reminder
                const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
                    recipient_email: subscription.church_admin_email,
                    related_entity_type: 'Subscription',
                    related_entity_id: subscription.id,
                    type: 'subscription'
                });

                const alreadyNotified = existingNotifications.some(n => {
                    const notifDate = new Date(n.created_date);
                    const hoursSince = (now - notifDate) / (1000 * 60 * 60);
                    return hoursSince < 24; // Don't send again if sent in last 24 hours
                });

                if (!alreadyNotified) {
                    await base44.asServiceRole.entities.Notification.create({
                        recipient_email: subscription.church_admin_email,
                        title: `Trial Expires in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`,
                        message: `Your ${subscription.subscription_tier} plan trial ends soon. Upgrade now to continue enjoying all features without interruption.`,
                        type: 'subscription',
                        priority: daysRemaining === 1 ? 'urgent' : 'high',
                        action_url: '/subscriptionplans',
                        action_label: 'Upgrade Now',
                        related_entity_type: 'Subscription',
                        related_entity_id: subscription.id
                    });

                    remindersCreated++;
                    console.log(`✅ Trial reminder sent to ${subscription.church_admin_email} (${daysRemaining} days)`);
                }
            }
        }

        return Response.json({ 
            success: true, 
            checked: subscriptions.length,
            reminders_created: remindersCreated 
        });
    } catch (error) {
        console.error('❌ Error sending trial reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});