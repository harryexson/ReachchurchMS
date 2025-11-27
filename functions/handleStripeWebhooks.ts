import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== STRIPE WEBHOOK RECEIVED =====`);
    
    try {
        const stripeApiKey = Deno.env.get("STRIPE_API_KEY");
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        
        if (!stripeApiKey) {
            console.error(`[${requestId}] ❌ STRIPE_API_KEY not configured`);
            return Response.json({ error: 'Stripe not configured' }, { status: 500 });
        }

        const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' });
        
        // Verify webhook signature
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        let event;
        
        if (webhookSecret && signature) {
            try {
                event = await stripe.webhooks.constructEventAsync(
                    body,
                    signature,
                    webhookSecret
                );
                console.log(`[${requestId}] ✅ Webhook signature verified`);
            } catch (err) {
                console.error(`[${requestId}] ❌ Webhook signature verification failed:`, err.message);
                return Response.json({ error: 'Invalid signature' }, { status: 400 });
            }
        } else {
            try {
                event = JSON.parse(body);
                console.log(`[${requestId}] ⚠️ Processing without signature verification (webhook secret not set)`);
            } catch (err) {
                console.error(`[${requestId}] ❌ Invalid JSON:`, err.message);
                return Response.json({ error: 'Invalid JSON' }, { status: 400 });
            }
        }

        console.log(`[${requestId}] Event type: ${event.type}`);
        console.log(`[${requestId}] Event ID: ${event.id}`);

        const base44 = createClientFromRequest(req);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                console.log(`[${requestId}] ========================================`);
                console.log(`[${requestId}] CHECKOUT SESSION COMPLETED`);
                console.log(`[${requestId}] ========================================`);
                console.log(`[${requestId}] Session ID: ${session.id}`);
                console.log(`[${requestId}] Customer: ${session.customer}`);
                console.log(`[${requestId}] Customer Email: ${session.customer_email}`);
                console.log(`[${requestId}] Subscription: ${session.subscription}`);
                console.log(`[${requestId}] Mode: ${session.mode}`);
                console.log(`[${requestId}] Payment Status: ${session.payment_status}`);
                console.log(`[${requestId}] Metadata:`, JSON.stringify(session.metadata, null, 2));

                if (session.mode === 'subscription') {
                    // Get subscription details
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    console.log(`[${requestId}] Retrieved subscription:`, subscription.id);
                    
                    const priceId = subscription.items.data[0].price.id;
                    const planMetadata = session.metadata || {};
                    
                    console.log(`[${requestId}] Price ID: ${priceId}`);
                    console.log(`[${requestId}] Plan tier from metadata: ${planMetadata.plan_tier}`);

                    // Determine plan tier from price ID or metadata
                    let planTier = planMetadata.plan_tier || 'starter';
                    
                    // Map price IDs to tiers (CRITICAL: Must match your Stripe prices)
                    const priceTierMap = {
                        'price_1SJZAh2RRvcnNd9T1v2apKKR': 'growth',      // Growth monthly
                        'price_1SJVPm2RRvcnNd9TkGCeYZ1l': 'premium'      // Premium monthly
                    };
                    
                    if (priceTierMap[priceId]) {
                        planTier = priceTierMap[priceId];
                        console.log(`[${requestId}] ✅ Tier determined from price ID: ${planTier}`);
                    } else {
                        console.log(`[${requestId}] ⚠️ Price ID not in map, using metadata tier: ${planTier}`);
                    }

                    // Get email - try multiple sources
                    const customerEmail = planMetadata.church_admin_email || 
                                         session.customer_email || 
                                         session.customer_details?.email;
                    
                    console.log(`[${requestId}] Customer email resolved to: ${customerEmail}`);

                    if (!customerEmail) {
                        console.error(`[${requestId}] ❌ No customer email found!`);
                        return Response.json({ 
                            error: 'No customer email found',
                            session_id: session.id 
                        }, { status: 400 });
                    }

                    // Calculate features based on tier
                    const features = getFeaturesByTier(planTier);
                    console.log(`[${requestId}] Features for ${planTier}:`, JSON.stringify(features, null, 2));

                    // Check for existing subscriptions with this email
                    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                        church_admin_email: customerEmail
                    });

                    console.log(`[${requestId}] Found ${existingSubs.length} existing subscription(s) for ${customerEmail}`);

                    if (existingSubs.length > 0) {
                        // Update ALL existing subscriptions for this email to avoid conflicts
                        for (const existingSub of existingSubs) {
                            console.log(`[${requestId}] Updating subscription: ${existingSub.id}`);
                            await base44.asServiceRole.entities.Subscription.update(existingSub.id, {
                                subscription_tier: planTier,
                                status: 'active',
                                stripe_subscription_id: subscription.id,
                                stripe_customer_id: session.customer,
                                next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
                                features: features,
                                trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
                            });
                        }
                        console.log(`[${requestId}] ✅ Updated ${existingSubs.length} subscription record(s) to ${planTier} plan`);
                    } else {
                        // Create new subscription
                        console.log(`[${requestId}] Creating new subscription for ${customerEmail}`);
                        const newSub = await base44.asServiceRole.entities.Subscription.create({
                            church_name: planMetadata.church_name || 'Church',
                            church_admin_email: customerEmail,
                            subscription_tier: planTier,
                            status: 'active',
                            stripe_subscription_id: subscription.id,
                            stripe_customer_id: session.customer,
                            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
                            features: features,
                            trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
                        });
                        console.log(`[${requestId}] ✅ New subscription created: ${newSub.id} with ${planTier} plan`);
                    }

                    // CRITICAL: Update the user's role to admin when they subscribe
                    try {
                        console.log(`[${requestId}] Updating user role to admin for: ${customerEmail}`);
                        const users = await base44.asServiceRole.entities.User.filter({
                            email: customerEmail
                        });
                        
                        if (users.length > 0) {
                            const user = users[0];
                            if (user.role !== 'admin') {
                                await base44.asServiceRole.entities.User.update(user.id, {
                                    role: 'admin'
                                });
                                console.log(`[${requestId}] ✅ User ${customerEmail} role updated to admin`);
                            } else {
                                console.log(`[${requestId}] ℹ️ User ${customerEmail} is already admin`);
                            }
                        } else {
                            console.log(`[${requestId}] ⚠️ User not found for email: ${customerEmail}`);
                        }
                    } catch (userError) {
                        console.error(`[${requestId}] ⚠️ Failed to update user role:`, userError.message);
                    }

                    console.log(`[${requestId}] ========================================`);
                    console.log(`[${requestId}] SUBSCRIPTION PROCESSING COMPLETE`);
                    console.log(`[${requestId}] Email: ${customerEmail}`);
                    console.log(`[${requestId}] Tier: ${planTier}`);
                    console.log(`[${requestId}] Status: active`);
                    console.log(`[${requestId}] ========================================`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                console.log(`[${requestId}] ========================================`);
                console.log(`[${requestId}] SUBSCRIPTION UPDATED`);
                console.log(`[${requestId}] ========================================`);
                console.log(`[${requestId}] Subscription ID: ${subscription.id}`);
                console.log(`[${requestId}] Status: ${subscription.status}`);
                console.log(`[${requestId}] Items:`, JSON.stringify(subscription.items.data, null, 2));

                const priceId = subscription.items.data[0].price.id;
                console.log(`[${requestId}] New price ID: ${priceId}`);

                // Determine new plan tier
                let planTier = 'starter';
                const priceTierMap = {
                    'price_1SJZAh2RRvcnNd9T1v2apKKR': 'growth',
                    'price_1SJVPm2RRvcnNd9TkGCeYZ1l': 'premium'
                };
                
                if (priceTierMap[priceId]) {
                    planTier = priceTierMap[priceId];
                }

                console.log(`[${requestId}] New plan tier: ${planTier}`);

                // Get new features
                const features = getFeaturesByTier(planTier);

                // Find and update subscription
                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (existingSubs.length > 0) {
                    for (const sub of existingSubs) {
                        console.log(`[${requestId}] Updating subscription record: ${sub.id}`);
                        await base44.asServiceRole.entities.Subscription.update(sub.id, {
                            subscription_tier: planTier,
                            status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status,
                            features: features,
                            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
                        });
                    }
                    console.log(`[${requestId}] ✅ Subscription upgraded to ${planTier} plan with new features`);
                } else {
                    console.error(`[${requestId}] ❌ No subscription found for Stripe ID: ${subscription.id}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                console.log(`[${requestId}] Subscription cancelled: ${subscription.id}`);

                const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                    stripe_subscription_id: subscription.id
                });

                if (existingSubs.length > 0) {
                    for (const sub of existingSubs) {
                        await base44.asServiceRole.entities.Subscription.update(sub.id, {
                            status: 'cancelled'
                        });
                    }
                    console.log(`[${requestId}] ✅ Subscription marked as cancelled`);
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                console.log(`[${requestId}] Payment succeeded for invoice: ${invoice.id}`);
                
                if (invoice.subscription) {
                    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                        stripe_subscription_id: invoice.subscription
                    });

                    if (existingSubs.length > 0) {
                        for (const sub of existingSubs) {
                            await base44.asServiceRole.entities.Subscription.update(sub.id, {
                                status: 'active'
                            });
                        }
                        console.log(`[${requestId}] ✅ Subscription status updated to active`);
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                console.log(`[${requestId}] Payment failed for invoice: ${invoice.id}`);
                
                if (invoice.subscription) {
                    const existingSubs = await base44.asServiceRole.entities.Subscription.filter({
                        stripe_subscription_id: invoice.subscription
                    });

                    if (existingSubs.length > 0) {
                        for (const sub of existingSubs) {
                            await base44.asServiceRole.entities.Subscription.update(sub.id, {
                                status: 'past_due'
                            });
                        }
                        console.log(`[${requestId}] ✅ Subscription marked as past_due`);
                    }
                }
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log(`[${requestId}] ========================================`);
                console.log(`[${requestId}] PAYMENT SUCCEEDED - DONATION`);
                console.log(`[${requestId}] ========================================`);
                console.log(`[${requestId}] Payment Intent ID: ${paymentIntent.id}`);
                console.log(`[${requestId}] Amount: ${paymentIntent.amount / 100}`);
                console.log(`[${requestId}] Metadata:`, JSON.stringify(paymentIntent.metadata, null, 2));

                if (paymentIntent.metadata && paymentIntent.metadata.donation_type) {
                    // This is a one-time donation payment
                    const donationData = {
                        donor_name: paymentIntent.metadata.donor_name,
                        donor_email: paymentIntent.metadata.donor_email,
                        donor_phone: paymentIntent.metadata.donor_phone || '',
                        donor_address: paymentIntent.metadata.donor_address || '',
                        amount: paymentIntent.amount / 100,
                        donation_type: paymentIntent.metadata.donation_type,
                        payment_method: 'credit_card',
                        donation_date: new Date().toISOString().split('T')[0],
                        tax_year: new Date().getFullYear(),
                        tax_deductible: true,
                        receipt_sent: false,
                        included_in_statement: false,
                        recurring: false,
                        member_id: paymentIntent.metadata.member_id !== 'null' ? paymentIntent.metadata.member_id : null,
                        visitor_id: paymentIntent.metadata.visitor_id || null
                    };

                    console.log(`[${requestId}] Creating donation record:`, donationData);

                    const newDonation = await base44.asServiceRole.entities.Donation.create(donationData);
                    
                    console.log(`[${requestId}] ✅ Donation record created successfully`);
                    console.log(`[${requestId}] Donor: ${donationData.donor_name} (${donationData.donor_email})`);
                    console.log(`[${requestId}] Amount: $${donationData.amount}`);
                    console.log(`[${requestId}] Type: ${donationData.donation_type}`);

                    // Send automated thank you email
                    try {
                        console.log(`[${requestId}] Sending automated thank you email...`);
                        await base44.asServiceRole.functions.invoke('sendGivingMessage', {
                            donation_id: newDonation.id,
                            donor_name: donationData.donor_name,
                            donor_email: donationData.donor_email,
                            donor_phone: donationData.donor_phone,
                            amount: donationData.amount,
                            donation_type: donationData.donation_type,
                            message_type: 'thank_you',
                            channel: 'email',
                            member_id: donationData.member_id
                        });
                        console.log(`[${requestId}] ✅ Thank you email sent`);
                    } catch (emailError) {
                        console.error(`[${requestId}] ⚠️ Failed to send thank you email:`, emailError.message);
                    }

                    // Send donation receipt
                    try {
                        // Check if auto-send is enabled
                        const settingsList = await base44.asServiceRole.entities.ChurchSettings.list();
                        const settings = settingsList[0];
                        
                        if (!settings || settings.auto_send_receipts !== false) {
                            console.log(`[${requestId}] Sending donation receipt...`);
                            await base44.asServiceRole.functions.invoke('sendDonationReceipt', {
                                donation_id: newDonation.id,
                                donation_data: donationData
                            });
                            console.log(`[${requestId}] ✅ Donation receipt sent`);
                        }
                    } catch (receiptError) {
                        console.error(`[${requestId}] ⚠️ Failed to send receipt:`, receiptError.message);
                    }
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object;
                console.log(`[${requestId}] ========================================`);
                console.log(`[${requestId}] INVOICE PAID - RECURRING DONATION`);
                console.log(`[${requestId}] ========================================`);
                
                if (invoice.subscription && invoice.lines.data[0].metadata?.donation_type) {
                    const lineItem = invoice.lines.data[0];
                    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                    
                    // Create donation record for recurring payment
                    const donationData = {
                        donor_name: subscription.metadata.donor_name || lineItem.metadata.donor_name,
                        donor_email: subscription.metadata.donor_email || lineItem.metadata.donor_email,
                        donor_phone: subscription.metadata.donor_phone || '',
                        donor_address: subscription.metadata.donor_address || '',
                        amount: invoice.amount_paid / 100,
                        donation_type: subscription.metadata.donation_type || lineItem.metadata.donation_type,
                        payment_method: 'credit_card',
                        donation_date: new Date().toISOString().split('T')[0],
                        tax_year: new Date().getFullYear(),
                        tax_deductible: true,
                        receipt_sent: false,
                        included_in_statement: false,
                        recurring: true,
                        recurring_frequency: subscription.metadata.recurring_frequency,
                        stripe_subscription_id: subscription.id,
                        subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
                        member_id: subscription.metadata.member_id !== 'null' ? subscription.metadata.member_id : null
                    };

                    const newDonation = await base44.asServiceRole.entities.Donation.create(donationData);
                    
                    console.log(`[${requestId}] ✅ Recurring donation record created`);

                    // Send automated thank you email for recurring donations
                    try {
                        console.log(`[${requestId}] Sending recurring donation thank you email...`);
                        await base44.asServiceRole.functions.invoke('sendGivingMessage', {
                            donation_id: newDonation.id,
                            donor_name: donationData.donor_name,
                            donor_email: donationData.donor_email,
                            donor_phone: donationData.donor_phone,
                            amount: donationData.amount,
                            donation_type: donationData.donation_type,
                            message_type: 'recurring_thanks',
                            channel: 'email',
                            member_id: donationData.member_id
                        });
                        console.log(`[${requestId}] ✅ Recurring thank you email sent`);
                    } catch (emailError) {
                        console.error(`[${requestId}] ⚠️ Failed to send recurring thank you email:`, emailError.message);
                    }

                    // Send donation receipt for recurring donation
                    try {
                        const settingsList = await base44.asServiceRole.entities.ChurchSettings.list();
                        const settings = settingsList[0];
                        
                        if (!settings || settings.auto_send_receipts !== false) {
                            console.log(`[${requestId}] Sending recurring donation receipt...`);
                            await base44.asServiceRole.functions.invoke('sendDonationReceipt', {
                                donation_id: newDonation.id,
                                donation_data: donationData
                            });
                            console.log(`[${requestId}] ✅ Recurring donation receipt sent`);
                        }
                    } catch (receiptError) {
                        console.error(`[${requestId}] ⚠️ Failed to send recurring receipt:`, receiptError.message);
                    }
                }
                break;
            }

            default:
                console.log(`[${requestId}] ℹ️ Unhandled event type: ${event.type}`);
        }

        console.log(`[${requestId}] ===== WEBHOOK PROCESSED SUCCESSFULLY =====`);
        return Response.json({ received: true, event_type: event.type });

    } catch (error) {
        console.error(`[${requestId}] ===== WEBHOOK ERROR =====`);
        console.error(`[${requestId}] Error:`, error.message);
        console.error(`[${requestId}] Stack:`, error.stack);
        return Response.json({ 
            error: 'Webhook processing failed',
            message: error.message 
        }, { status: 500 });
    }
});

// Helper function to get features by tier
function getFeaturesByTier(tier) {
    const FEATURES = {
        starter: {
            member_limit: 100,
            sms_enabled: false,
            sms_monthly_limit: 0,
            sms_used_this_month: 0,
            mms_enabled: false,
            mms_monthly_limit: 0,
            mms_used_this_month: 0,
            video_enabled: false,
            video_max_participants: 0,
            breakout_rooms_enabled: false,
            recording_enabled: false,
            kids_checkin_enabled: false,
            kiosk_giving_enabled: false,
            coffee_shop_enabled: false,
            bookstore_enabled: false,
            automated_workflows_enabled: false,
            visitor_followup_enabled: false,
            giving_thankyou_enabled: false,
            tax_statements_enabled: false,
            advanced_analytics_enabled: false,
            financial_management_enabled: false,
            multi_campus: false,
            white_label: false,
            api_access: false,
            custom_branding_enabled: false,
            priority_support: false,
            dedicated_account_manager: false
        },
        growth: {
            member_limit: 500,
            sms_enabled: true,
            sms_monthly_limit: 1000,
            sms_used_this_month: 0,
            mms_enabled: true,
            mms_monthly_limit: 10,
            mms_used_this_month: 0,
            video_enabled: true,
            video_max_participants: 25,
            breakout_rooms_enabled: false,
            recording_enabled: false,
            kids_checkin_enabled: true,
            kiosk_giving_enabled: true,
            coffee_shop_enabled: true,
            bookstore_enabled: true,
            automated_workflows_enabled: true,
            visitor_followup_enabled: true,
            giving_thankyou_enabled: true,
            tax_statements_enabled: true,
            advanced_analytics_enabled: true,
            financial_management_enabled: true,
            multi_campus: false,
            white_label: false,
            api_access: false,
            custom_branding_enabled: true,
            priority_support: true,
            dedicated_account_manager: false
        },
        premium: {
            member_limit: 999999,
            sms_enabled: true,
            sms_monthly_limit: 999999,
            sms_used_this_month: 0,
            mms_enabled: true,
            mms_monthly_limit: 999999,
            mms_used_this_month: 0,
            video_enabled: true,
            video_max_participants: 200,
            breakout_rooms_enabled: true,
            recording_enabled: true,
            kids_checkin_enabled: true,
            kiosk_giving_enabled: true,
            coffee_shop_enabled: true,
            bookstore_enabled: true,
            automated_workflows_enabled: true,
            visitor_followup_enabled: true,
            giving_thankyou_enabled: true,
            tax_statements_enabled: true,
            advanced_analytics_enabled: true,
            financial_management_enabled: true,
            multi_campus: true,
            white_label: true,
            api_access: true,
            custom_branding_enabled: true,
            priority_support: true,
            dedicated_account_manager: true
        }
    };

    return FEATURES[tier] || FEATURES.starter;
}