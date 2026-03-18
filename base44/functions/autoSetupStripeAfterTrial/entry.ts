import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== AUTO SETUP STRIPE AFTER TRIAL =====`);
    
    try {
        const base44 = createClientFromRequest(req);

        // Service role to check all subscriptions
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({});
        console.log(`[${requestId}] Found ${subscriptions.length} subscriptions to check`);

        const now = new Date();
        let processedCount = 0;
        let notifiedCount = 0;

        for (const subscription of subscriptions) {
            // Skip if already has Stripe connected
            if (subscription.stripe_customer_id) {
                console.log(`[${requestId}] Subscription ${subscription.id} already has Stripe - skipping`);
                continue;
            }

            // Skip if not in trial status
            if (subscription.status !== 'trial') {
                console.log(`[${requestId}] Subscription ${subscription.id} not in trial (status: ${subscription.status}) - skipping`);
                continue;
            }

            // Check if trial is ending soon (within 3 days)
            if (subscription.trial_end_date) {
                const trialEnd = new Date(subscription.trial_end_date);
                const daysUntilEnd = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

                console.log(`[${requestId}] Subscription ${subscription.id} - Days until trial end: ${daysUntilEnd}`);

                if (daysUntilEnd <= 3 && daysUntilEnd >= 0) {
                    // Send reminder email to set up billing
                    console.log(`[${requestId}] Sending Stripe setup reminder to ${subscription.church_admin_email}`);
                    
                    try {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: subscription.church_admin_email,
                            subject: `⚠️ Your REACH Connect Trial Ends in ${daysUntilEnd} Days - Set Up Billing Now`,
                            body: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #2563eb;">Your Trial is Ending Soon</h2>
                                    <p>Hi ${subscription.church_name},</p>
                                    <p>Your REACH Church Connect trial will end in <strong>${daysUntilEnd} day(s)</strong>.</p>
                                    <p>To continue using REACH without interruption, please set up your billing information:</p>
                                    <ol>
                                        <li>Log in to your dashboard</li>
                                        <li>Go to Settings → Billing</li>
                                        <li>Click "Set Up Stripe Billing"</li>
                                    </ol>
                                    <p><strong>Current Plan:</strong> ${subscription.subscription_tier} - $${subscription.monthly_price}/month</p>
                                    <p>If you don't set up billing before your trial ends, your access will be suspended until payment is configured.</p>
                                    <p>All your data will be safely stored and ready when you return.</p>
                                    <p>Questions? Reply to this email or contact us at support@reachconnect.app</p>
                                    <p>Best regards,<br>The REACH Connect Team</p>
                                </div>
                            `
                        });
                        
                        notifiedCount++;
                    } catch (emailError) {
                        console.error(`[${requestId}] Failed to send email to ${subscription.church_admin_email}:`, emailError);
                    }
                }

                // If trial has expired, suspend the subscription
                if (daysUntilEnd < 0) {
                    console.log(`[${requestId}] Trial expired for ${subscription.church_name} - suspending`);
                    
                    await base44.asServiceRole.entities.Subscription.update(subscription.id, {
                        status: 'suspended',
                        notes: `${subscription.notes || ''}\nAuto-suspended on ${now.toISOString()} - Trial expired without Stripe setup`
                    });

                    // Send suspension email
                    try {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: subscription.church_admin_email,
                            subject: `🔒 Your REACH Connect Trial Has Ended - Set Up Billing to Continue`,
                            body: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #dc2626;">Your Trial Has Ended</h2>
                                    <p>Hi ${subscription.church_name},</p>
                                    <p>Your REACH Church Connect trial period has ended. Your account has been temporarily suspended.</p>
                                    <p><strong>Don't worry - all your data is safe!</strong> Your members, events, donations, and settings are securely stored.</p>
                                    <h3>To reactivate your account:</h3>
                                    <ol>
                                        <li>Go to <a href="https://reachchurchms.com/subscriptionplans">https://reachchurchms.com/subscriptionplans</a></li>
                                        <li>Select your plan (${subscription.subscription_tier} - $${subscription.monthly_price}/month)</li>
                                        <li>Complete the checkout process</li>
                                        <li>You'll be immediately redirected to your dashboard with full access restored</li>
                                    </ol>
                                    <p>Questions? We're here to help at support@reachconnect.app</p>
                                    <p>Best regards,<br>The REACH Connect Team</p>
                                </div>
                            `
                        });
                    } catch (emailError) {
                        console.error(`[${requestId}] Failed to send suspension email:`, emailError);
                    }

                    processedCount++;
                }
            }
        }

        console.log(`[${requestId}] ✅ Processed ${processedCount} expired trials, sent ${notifiedCount} reminders`);
        
        return Response.json({ 
            success: true,
            processed: processedCount,
            notified: notifiedCount,
            message: `Checked ${subscriptions.length} subscriptions, processed ${processedCount} expired trials, sent ${notifiedCount} reminders`
        });

    } catch (error) {
        console.error(`[${requestId}] ❌ Error:`, error);
        return Response.json({ 
            error: 'Failed to process subscriptions',
            message: error.message
        }, { status: 500 });
    }
});