import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Configurable reminder days
        const reminderDays = [7, 3, 1];
        const today = new Date();
        const remindersSent = [];

        // Get active subscriptions
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            status: 'active'
        });

        console.log(`Checking ${subscriptions.length} active subscriptions for renewal reminders`);

        for (const subscription of subscriptions) {
            if (!subscription.next_billing_date || !subscription.church_admin_email) {
                continue;
            }

            const billingDate = new Date(subscription.next_billing_date);
            const daysUntilRenewal = Math.ceil((billingDate - today) / (1000 * 60 * 60 * 24));

            // Check if we need to send reminder for any configured day
            if (reminderDays.includes(daysUntilRenewal)) {
                // Check if reminder already sent for this day
                const lastReminder = subscription.last_renewal_reminder_sent;
                const reminderKey = `${daysUntilRenewal}d_${subscription.next_billing_date}`;
                
                if (lastReminder !== reminderKey) {
                    // Calculate renewal amount
                    const amount = subscription.billing_cycle === 'annually' 
                        ? subscription.annual_price 
                        : subscription.monthly_price;

                    // Send email
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: subscription.church_admin_email,
                        from_name: 'REACH Church Connect',
                        subject: `Subscription Renewal Reminder - ${daysUntilRenewal} ${daysUntilRenewal === 1 ? 'day' : 'days'} remaining`,
                        body: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #2563eb;">Subscription Renewal Reminder</h2>
                                
                                <p>Hi ${subscription.church_name},</p>
                                
                                <p>This is a friendly reminder that your <strong>${subscription.subscription_tier}</strong> plan subscription will renew in <strong>${daysUntilRenewal} ${daysUntilRenewal === 1 ? 'day' : 'days'}</strong>.</p>
                                
                                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <h3 style="margin-top: 0; color: #1f2937;">Renewal Details</h3>
                                    <p style="margin: 8px 0;"><strong>Renewal Date:</strong> ${new Date(subscription.next_billing_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <p style="margin: 8px 0;"><strong>Amount to be charged:</strong> $${amount.toFixed(2)}</p>
                                    <p style="margin: 8px 0;"><strong>Billing Cycle:</strong> ${subscription.billing_cycle}</p>
                                    <p style="margin: 8px 0;"><strong>Plan:</strong> ${subscription.subscription_tier}</p>
                                </div>
                                
                                <p>Your payment method on file will be charged automatically on the renewal date.</p>
                                
                                <div style="margin: 30px 0;">
                                    <a href="${Deno.env.get('BASE44_APP_URL')}/settings" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Subscription</a>
                                </div>
                                
                                <p style="color: #6b7280; font-size: 14px;">If you have any questions or need to make changes to your subscription, please contact our support team or manage your subscription through the link above.</p>
                                
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                                
                                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                                    REACH Church Connect - Empowering Churches to Connect and Grow<br>
                                    This is an automated reminder. Please do not reply to this email.
                                </p>
                            </div>
                        `
                    });

                    // Update subscription with reminder sent info
                    await base44.asServiceRole.entities.Subscription.update(subscription.id, {
                        last_renewal_reminder_sent: reminderKey
                    });

                    remindersSent.push({
                        church: subscription.church_name,
                        days_until: daysUntilRenewal,
                        renewal_date: subscription.next_billing_date
                    });

                    console.log(`Sent ${daysUntilRenewal}-day reminder to ${subscription.church_name}`);
                }
            }
        }

        return Response.json({
            success: true,
            reminders_sent: remindersSent.length,
            details: remindersSent
        });

    } catch (error) {
        console.error('Send renewal reminders error:', error);
        return Response.json({ 
            error: error.message || 'Failed to send reminders',
            details: error.stack
        }, { status: 500 });
    }
});