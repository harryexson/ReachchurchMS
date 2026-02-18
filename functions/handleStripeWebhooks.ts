import Stripe from 'npm:stripe@17.5.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
    apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
    try {
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET not configured');
            return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the raw body as text
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            console.error('No Stripe signature header found');
            return new Response(JSON.stringify({ error: 'No signature' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify webhook signature
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('Webhook event received:', event.type);

        // Initialize Base44 client with service role (webhooks don't have user auth)
        const base44 = createClientFromRequest(req);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(base44, event.data.object);
                break;

            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(base44, event.data.object);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionChange(base44, event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(base44, event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(base44, event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(base44, event.data.object);
                break;

            case 'account.updated':
                await handleAccountUpdated(base44, event.data.object);
                break;

            case 'customer.updated':
                await handleCustomerUpdated(base44, event.data.object);
                break;

            case 'payment_method.attached':
                await handlePaymentMethodAttached(base44, event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
            }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook handler error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

async function handleCheckoutCompleted(base44, session) {
    console.log('Processing checkout.session.completed:', session.id);

    try {
        const metadata = session.metadata || {};
        
        // Determine if this is a donation or subscription
        if (metadata.donation_type) {
            // This is a donation
            await createDonationRecord(base44, session);
        } else if (session.mode === 'subscription') {
            // This is a subscription (for the platform itself)
            await createOrUpdateSubscription(base44, session);
        }

        // Send receipt email if it's a one-time donation
        if (metadata.donation_type && session.mode === 'payment') {
            await sendDonationReceipt(base44, session);
        }

    } catch (error) {
        console.error('Error handling checkout completed:', error);
        throw error;
    }
}

async function createDonationRecord(base44, session) {
    const metadata = session.metadata || {};
    
    // Generate unique receipt number
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const receiptNumber = `REC-${year}-${timestamp}`;
    
    const currency = metadata.currency || session.currency || 'USD';
    const isZeroDecimal = ['jpy', 'krw', 'clp', 'vnd', 'xaf', 'xof'].includes(currency.toLowerCase());
    const amount = isZeroDecimal ? session.amount_total : session.amount_total / 100;

    // CRITICAL: Get church_admin_email for proper data isolation
    const churchAdminEmail = metadata.church_admin_email;
    
    if (!churchAdminEmail) {
        console.error('❌ CRITICAL: No church_admin_email in donation metadata. Data isolation broken!');
        throw new Error('Missing church_admin_email - cannot create donation without proper church association');
    }

    const donationData = {
        church_admin_email: churchAdminEmail,
        receipt_number: receiptNumber,
        donor_name: metadata.donor_name || session.customer_details?.name || 'Anonymous',
        donor_email: metadata.donor_email || session.customer_details?.email,
        donor_phone: metadata.donor_phone || session.customer_details?.phone,
        donor_address: metadata.donor_address,
        amount: amount,
        currency: currency.toUpperCase(),
        donation_type: metadata.donation_type || 'offering',
        payment_method: 'credit_card',
        donation_date: new Date().toISOString().split('T')[0],
        tax_year: new Date().getFullYear(),
        tax_deductible: true,
        receipt_sent: false,
        recurring: metadata.recurring === 'true',
        recurring_frequency: metadata.recurring_frequency || null,
        stripe_subscription_id: session.subscription || null,
        subscription_status: session.subscription ? 'active' : null,
        member_id: metadata.member_id || null,
        notes: `Stripe Checkout: ${session.id}`
    };

    console.log('Creating donation record:', donationData);

    const donation = await base44.asServiceRole.entities.Donation.create(donationData);
    
    console.log('Donation record created:', donation.id);
    
    return donation;
}

async function createOrUpdateSubscription(base44, session) {
    console.log('🔔 Creating/updating subscription from checkout');
    
    const metadata = session.metadata || {};
    const customerEmail = metadata.user_email || metadata.church_admin_email || session.customer_details?.email;

    if (!customerEmail) {
        console.error('❌ No customer email found for subscription');
        return;
    }

    console.log('📧 Customer email:', customerEmail);
    console.log('📋 Session metadata:', JSON.stringify(metadata, null, 2));

    if (!session.subscription) {
        console.error('❌ No subscription ID in session');
        return;
    }

    // Fetch full subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    console.log('💳 Stripe subscription:', {
        id: subscription.id,
        status: subscription.status,
        trial_end: subscription.trial_end,
        current_period_end: subscription.current_period_end
    });

    // Check if subscription already exists
    const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
        church_admin_email: customerEmail
    });

    console.log(`🔍 Found ${existingSubscriptions.length} existing subscription(s)`);

    // CRITICAL: Ensure user role is set to admin for church subscription signup
    if (existingSubscriptions.length === 0) {
        try {
            console.log('👤 Setting user role to admin for:', customerEmail);
            await base44.asServiceRole.functions.invoke('setAdminRoleOnSubscription', {
                email: customerEmail
            });
            console.log('✅ User role updated to admin');
        } catch (error) {
            console.error('⚠️ Warning: Could not update user role:', error.message);
            // Note: Still proceed with subscription creation even if role update fails
        }
    }

    // Get pricing plan from database to ensure sync with back office
    let pricingPlan;
    try {
        const pricingPlans = await base44.asServiceRole.entities.PricingPlan.filter({
            plan_name: metadata.plan_tier || 'starter',
            is_active: true
        });
        if (pricingPlans.length > 0) {
            pricingPlan = pricingPlans[0];
            console.log('📋 Using pricing plan from database:', pricingPlan.plan_name);
        }
    } catch (error) {
        console.warn('⚠️ Could not load pricing plan from database:', error.message);
    }

    // Fallback tier map if database pricing not available
    const tierMap = {
        'starter': { member_limit: 150, sms: 0, mms: 0, video: 0, monthly_price: 49, annual_price: 470 },
        'growth': { member_limit: 750, sms: 1000, mms: 10, video: 25, monthly_price: 119, annual_price: 1140 },
        'premium': { member_limit: 999999, sms: 999999, mms: 999999, video: 200, monthly_price: 249, annual_price: 2390 }
    };

    const tier = metadata.plan_tier || 'starter';
    const limits = pricingPlan?.features || tierMap[tier];
    
    // Get pricing from database plan or fallback
    const monthlyPrice = pricingPlan?.monthly_price || tierMap[tier]?.monthly_price || 0;
    const annualPrice = pricingPlan?.annual_price || tierMap[tier]?.annual_price || 0;

    // Map Stripe status to our status enum
    let dbStatus = 'active';
    if (subscription.status === 'trialing') {
        dbStatus = 'trial';
    } else if (subscription.status === 'active') {
        dbStatus = 'active';
    } else if (subscription.status === 'past_due') {
        dbStatus = 'past_due';
    } else if (subscription.status === 'canceled' || subscription.status === 'cancelled') {
        dbStatus = 'cancelled';
    }

    console.log(`📊 Computed status: ${dbStatus} (Stripe: ${subscription.status})`);

    // Apply promo code discount if present
    let finalMonthlyPrice = monthlyPrice;
    let finalAnnualPrice = annualPrice;
    let appliedPromoCode = null;

    if (metadata.promo_code) {
        try {
            const promoCodes = await base44.asServiceRole.entities.PromoCode.filter({
                code: metadata.promo_code
            });
            
            if (promoCodes.length > 0) {
                const promo = promoCodes[0];
                appliedPromoCode = promo.code;
                
                if (promo.code_type === 'percentage') {
                    finalMonthlyPrice = monthlyPrice * (1 - promo.discount_value / 100);
                    finalAnnualPrice = annualPrice * (1 - promo.discount_value / 100);
                } else if (promo.code_type === 'fixed_amount') {
                    finalMonthlyPrice = Math.max(0, monthlyPrice - promo.discount_value);
                    finalAnnualPrice = Math.max(0, annualPrice - (promo.discount_value * 12));
                }
                
                console.log(`💰 Applied promo code ${promo.code}: $${monthlyPrice} → $${finalMonthlyPrice}`);
            }
        } catch (error) {
            console.warn('⚠️ Could not apply promo code:', error.message);
        }
    }

    const subscriptionData = {
        church_admin_email: customerEmail,
        church_name: metadata.church_name || customerEmail.split('@')[0],
        subscription_tier: tier,
        billing_cycle: metadata.billing_cycle || 'monthly',
        monthly_price: finalMonthlyPrice,
        annual_price: finalAnnualPrice,
        status: dbStatus,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer,
        trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString().split('T')[0] : null,
        next_billing_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0] : null,
        notes: appliedPromoCode ? `Applied promo code: ${appliedPromoCode}` : null,
        features: {
            member_limit: limits.member_limit || 150,
            sms_enabled: limits.sms_enabled !== undefined ? limits.sms_enabled : tier !== 'starter',
            sms_monthly_limit: limits.sms_monthly_limit || limits.sms || 0,
            sms_used_this_month: 0,
            mms_enabled: limits.mms_enabled !== undefined ? limits.mms_enabled : tier !== 'starter',
            mms_monthly_limit: limits.mms_monthly_limit || limits.mms || 0,
            mms_used_this_month: 0,
            video_enabled: limits.video_enabled !== undefined ? limits.video_enabled : tier !== 'starter',
            video_max_participants: limits.video_max_participants || limits.video || 0,
            breakout_rooms_enabled: limits.breakout_rooms_enabled !== undefined ? limits.breakout_rooms_enabled : tier === 'premium',
            recording_enabled: limits.recording_enabled !== undefined ? limits.recording_enabled : tier === 'premium',
            kids_checkin_enabled: limits.kids_checkin_enabled !== undefined ? limits.kids_checkin_enabled : tier !== 'starter',
            label_printing_enabled: limits.label_printing_enabled !== undefined ? limits.label_printing_enabled : tier !== 'starter',
            kiosk_giving_enabled: limits.kiosk_giving_enabled !== undefined ? limits.kiosk_giving_enabled : tier !== 'starter',
            coffee_shop_enabled: limits.coffee_shop_enabled !== undefined ? limits.coffee_shop_enabled : tier !== 'starter',
            bookstore_enabled: limits.bookstore_enabled !== undefined ? limits.bookstore_enabled : tier !== 'starter',
            inventory_management_enabled: limits.inventory_management_enabled !== undefined ? limits.inventory_management_enabled : tier !== 'starter',
            loyalty_program_enabled: limits.loyalty_program_enabled !== undefined ? limits.loyalty_program_enabled : tier !== 'starter',
            automated_workflows_enabled: limits.automated_workflows_enabled !== undefined ? limits.automated_workflows_enabled : tier !== 'starter',
            visitor_followup_enabled: limits.visitor_followup_enabled !== undefined ? limits.visitor_followup_enabled : tier !== 'starter',
            giving_thankyou_enabled: limits.giving_thankyou_enabled !== undefined ? limits.giving_thankyou_enabled : tier !== 'starter',
            tax_statements_enabled: limits.tax_statements_enabled !== undefined ? limits.tax_statements_enabled : tier !== 'starter',
            advanced_analytics_enabled: limits.advanced_analytics_enabled !== undefined ? limits.advanced_analytics_enabled : tier === 'premium',
            financial_management_enabled: limits.financial_management_enabled !== undefined ? limits.financial_management_enabled : tier !== 'starter',
            budget_tracking_enabled: limits.budget_tracking_enabled !== undefined ? limits.budget_tracking_enabled : tier !== 'starter',
            expense_tracking_enabled: limits.expense_tracking_enabled !== undefined ? limits.expense_tracking_enabled : tier !== 'starter',
            people_engagement_enabled: limits.people_engagement_enabled !== undefined ? limits.people_engagement_enabled : tier !== 'starter',
            theme_customization_enabled: limits.theme_customization_enabled !== undefined ? limits.theme_customization_enabled : tier !== 'starter',
            display_management_enabled: limits.display_management_enabled !== undefined ? limits.display_management_enabled : tier !== 'starter',
            device_management_enabled: limits.device_management_enabled !== undefined ? limits.device_management_enabled : tier !== 'starter',
            multi_campus: limits.multi_campus !== undefined ? limits.multi_campus : tier === 'premium',
            white_label: limits.white_label !== undefined ? limits.white_label : tier === 'premium',
            api_access: limits.api_access !== undefined ? limits.api_access : tier === 'premium',
            custom_domain: limits.custom_domain !== undefined ? limits.custom_domain : tier === 'premium',
            advanced_permissions: limits.advanced_permissions !== undefined ? limits.advanced_permissions : tier === 'premium',
            donor_development_tools: limits.donor_development_tools !== undefined ? limits.donor_development_tools : tier === 'premium',
            predictive_analytics: limits.predictive_analytics !== undefined ? limits.predictive_analytics : tier === 'premium',
            priority_support: limits.priority_support !== undefined ? limits.priority_support : tier !== 'starter',
            phone_support: limits.phone_support !== undefined ? limits.phone_support : tier === 'premium',
            dedicated_account_manager: limits.dedicated_account_manager !== undefined ? limits.dedicated_account_manager : tier === 'premium'
        }
    };

    console.log('💾 Subscription data:', JSON.stringify(subscriptionData, null, 2));

    if (existingSubscriptions.length > 0) {
        console.log('🔄 Updating existing subscription:', existingSubscriptions[0].id);
        await base44.asServiceRole.entities.Subscription.update(
            existingSubscriptions[0].id,
            subscriptionData
        );
        console.log('✅ Subscription updated successfully');
    } else {
        console.log('➕ Creating new subscription');
        const created = await base44.asServiceRole.entities.Subscription.create(subscriptionData);
        console.log('✅ Subscription created successfully:', created.id);
    }
}

async function handlePaymentSucceeded(base44, paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);
    
    // Check if this payment is associated with a donation
    const metadata = paymentIntent.metadata || {};
    
    if (metadata.donation_id) {
        // Update donation record
        await base44.asServiceRole.entities.Donation.update(metadata.donation_id, {
            receipt_sent: true,
            notes: `Payment confirmed: ${paymentIntent.id}`
        });
    }
}

async function handleSubscriptionChange(base44, subscription) {
    console.log('🔔 Subscription changed:', subscription.id);

    try {
        console.log('📊 Stripe subscription status:', subscription.status);
        console.log('📅 Trial end:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'No trial');
        
        // Find subscription by Stripe subscription ID
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: subscription.id
        });

        if (subscriptions.length === 0) {
            console.log('⚠️ No matching subscription found in database');
            return;
        }

        console.log('🔍 Found subscription:', subscriptions[0].id);

        // Map Stripe status to our status enum
        let dbStatus = 'active';
        if (subscription.status === 'trialing') {
            dbStatus = 'trial';
        } else if (subscription.status === 'active') {
            dbStatus = 'active';
        } else if (subscription.status === 'past_due') {
            dbStatus = 'past_due';
        } else if (subscription.status === 'canceled' || subscription.status === 'cancelled') {
            dbStatus = 'cancelled';
        }

        const updateData = {
            status: dbStatus,
            trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString().split('T')[0] : subscriptions[0].trial_end_date,
            next_billing_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0] : null
        };

        console.log('💾 Updating with:', JSON.stringify(updateData, null, 2));

        await base44.asServiceRole.entities.Subscription.update(
            subscriptions[0].id,
            updateData
        );

        console.log('✅ Subscription updated in database');
    } catch (error) {
        console.error('❌ Error updating subscription:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function handleSubscriptionDeleted(base44, subscription) {
    console.log('Subscription deleted:', subscription.id);

    try {
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: subscription.id
        });

        if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(
                subscriptions[0].id,
                {
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                }
            );
            console.log('Subscription marked as cancelled');
        }
    } catch (error) {
        console.error('Error handling subscription deletion:', error);
    }
}

async function handleInvoicePaymentSucceeded(base44, invoice) {
    console.log('Invoice payment succeeded:', invoice.id);

    // For recurring donations, create a new donation record
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const metadata = subscription.metadata || {};

        if (metadata.donation_type) {
            // This is a recurring donation - create new donation record
            await createDonationRecord(base44, {
                amount_total: invoice.amount_paid,
                customer_details: {
                    email: invoice.customer_email,
                    name: metadata.donor_name
                },
                metadata: metadata,
                subscription: invoice.subscription,
                id: invoice.id,
                mode: 'subscription'
            });

            // Send receipt for recurring donation
            await sendDonationReceipt(base44, {
                customer_details: {
                    email: invoice.customer_email,
                    name: metadata.donor_name
                },
                amount_total: invoice.amount_paid,
                metadata: metadata
            });
        }
    }
}

async function handleInvoicePaymentFailed(base44, invoice) {
    console.log('Invoice payment failed:', invoice.id);

    // Update subscription status or send notification
    if (invoice.subscription) {
        try {
            const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
                stripe_subscription_id: invoice.subscription
            });

            if (subscriptions.length > 0) {
                await base44.asServiceRole.entities.Subscription.update(
                    subscriptions[0].id,
                    {
                        status: 'past_due',
                        notes: `Payment failed: ${invoice.id}`
                    }
                );
            }
        } catch (error) {
            console.error('Error updating subscription after payment failure:', error);
        }
    }
}

async function sendDonationReceipt(base44, session) {
    try {
        const metadata = session.metadata || {};
        const email = metadata.donor_email || session.customer_details?.email;

        if (!email) {
            console.log('No email address for receipt');
            return;
        }

        // Find the donation record
        const donations = await base44.asServiceRole.entities.Donation.filter({
            donor_email: email
        });

        if (donations.length === 0) {
            console.log('No donation record found');
            return;
        }

        // Get the most recent donation
        const donation = donations.sort((a, b) => 
            new Date(b.created_date) - new Date(a.created_date)
        )[0];

        // Call the sendDonationReceipt function with PDF generation
        await base44.asServiceRole.functions.invoke('sendDonationReceipt', {
            donation_id: donation.id,
            donation_data: donation
        });

        console.log('Receipt sent with PDF to:', email);
    } catch (error) {
        console.error('Error sending receipt:', error);
    }
}

async function handleAccountUpdated(base44, account) {
    console.log('Stripe account updated:', account.id);

    try {
        // Find settings with this account ID
        const settings = await base44.asServiceRole.entities.ChurchSettings.filter({
            stripe_account_id: account.id
        });

        if (settings.length > 0) {
            const updateData = {
                bank_account_connected: account.charges_enabled && account.payouts_enabled,
                payouts_enabled: account.payouts_enabled
            };

            await base44.asServiceRole.entities.ChurchSettings.update(
                settings[0].id,
                updateData
            );

            console.log('Church settings updated for account:', account.id);
        }
    } catch (error) {
        console.error('Error updating account settings:', error);
    }
}

async function handleCustomerUpdated(base44, customer) {
    console.log('💳 Customer updated:', customer.id);

    try {
        // Find subscription by Stripe customer ID
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            stripe_customer_id: customer.id
        });

        if (subscriptions.length > 0) {
            const subscription = subscriptions[0];
            
            // Get payment method details if available
            let paymentMethodInfo = null;
            if (customer.invoice_settings?.default_payment_method) {
                try {
                    const paymentMethod = await stripe.paymentMethods.retrieve(
                        customer.invoice_settings.default_payment_method
                    );
                    
                    paymentMethodInfo = {
                        type: paymentMethod.type,
                        last4: paymentMethod.card?.last4 || null,
                        brand: paymentMethod.card?.brand || null,
                        exp_month: paymentMethod.card?.exp_month || null,
                        exp_year: paymentMethod.card?.exp_year || null
                    };
                } catch (err) {
                    console.warn('Could not retrieve payment method:', err.message);
                }
            }

            // Log payment method update to AccountAction for back office tracking
            await base44.asServiceRole.entities.AccountAction.create({
                church_name: subscription.church_name,
                action_type: 'payment_method_updated',
                action_description: paymentMethodInfo 
                    ? `Payment method updated to ${paymentMethodInfo.brand} ending in ${paymentMethodInfo.last4}`
                    : 'Payment method updated',
                performed_by: 'system',
                metadata: {
                    customer_id: customer.id,
                    subscription_id: subscription.stripe_subscription_id,
                    payment_method: paymentMethodInfo
                }
            });

            console.log('✅ Payment method update logged for back office');
        }
    } catch (error) {
        console.error('Error handling customer update:', error);
    }
}

async function handlePaymentMethodAttached(base44, paymentMethod) {
    console.log('💳 Payment method attached:', paymentMethod.id);

    try {
        // Find subscription by customer ID
        if (!paymentMethod.customer) {
            console.log('No customer associated with payment method');
            return;
        }

        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            stripe_customer_id: paymentMethod.customer
        });

        if (subscriptions.length > 0) {
            const subscription = subscriptions[0];
            
            const paymentMethodInfo = {
                type: paymentMethod.type,
                last4: paymentMethod.card?.last4 || null,
                brand: paymentMethod.card?.brand || null,
                exp_month: paymentMethod.card?.exp_month || null,
                exp_year: paymentMethod.card?.exp_year || null
            };

            // Log to AccountAction for back office
            await base44.asServiceRole.entities.AccountAction.create({
                church_name: subscription.church_name,
                action_type: 'payment_method_added',
                action_description: `New payment method added: ${paymentMethodInfo.brand} ending in ${paymentMethodInfo.last4}`,
                performed_by: 'customer',
                metadata: {
                    payment_method_id: paymentMethod.id,
                    customer_id: paymentMethod.customer,
                    payment_method: paymentMethodInfo
                }
            });

            console.log('✅ Payment method addition logged for back office');
        }
    } catch (error) {
        console.error('Error handling payment method attachment:', error);
    }
}