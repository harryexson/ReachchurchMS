import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.21.0';

/**
 * Manual subscription sync tool
 * Forces a subscription refresh from Stripe to fix mismatches
 */

Deno.serve(async (req) => {
    console.log('===== MANUAL SUBSCRIPTION SYNC =====');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stripeApiKey = Deno.env.get("STRIPE_API_KEY");
        if (!stripeApiKey) {
            return Response.json({ error: 'Stripe not configured' }, { status: 500 });
        }

        const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' });

        console.log('User requesting sync:', user.email);

        // Get user's subscription records
        const emailsToCheck = [user.email, user.donor_email, user.church_admin_email].filter(Boolean);
        console.log('Checking emails:', emailsToCheck);

        const allSubs = await base44.asServiceRole.entities.Subscription.list();
        const userSubs = allSubs.filter(s => emailsToCheck.includes(s.church_admin_email));

        console.log(`Found ${userSubs.length} subscription record(s) in database`);

        if (userSubs.length === 0) {
            return Response.json({
                success: false,
                error: 'No subscription records found',
                message: 'You need to complete the checkout process first',
                emails_checked: emailsToCheck
            });
        }

        const syncResults = [];

        // Sync each subscription with Stripe
        for (const sub of userSubs) {
            console.log(`Syncing subscription: ${sub.id}`);
            console.log(`Stripe subscription ID: ${sub.stripe_subscription_id}`);
            console.log(`Current tier: ${sub.subscription_tier}`);
            console.log(`Current status: ${sub.status}`);

            if (!sub.stripe_subscription_id) {
                syncResults.push({
                    subscription_id: sub.id,
                    status: 'skipped',
                    message: 'No Stripe subscription ID'
                });
                continue;
            }

            try {
                // Fetch latest from Stripe
                const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
                console.log('Retrieved from Stripe:', stripeSubscription.id);
                console.log('Stripe status:', stripeSubscription.status);
                console.log('Stripe price:', stripeSubscription.items.data[0].price.id);

                const priceId = stripeSubscription.items.data[0].price.id;
                
                // Map price ID to tier
                const priceTierMap = {
                    'price_1SJZAh2RRvcnNd9T1v2apKKR': 'growth',
                    'price_1SJVPm2RRvcnNd9TkGCeYZ1l': 'premium'
                };

                const correctTier = priceTierMap[priceId] || 'starter';
                console.log('Correct tier based on Stripe:', correctTier);

                // Get features for this tier
                const correctFeatures = getFeaturesByTier(correctTier);

                // Determine status
                const correctStatus = (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing') ? 'active' : stripeSubscription.status;

                // Check if update is needed
                const needsUpdate = 
                    sub.subscription_tier !== correctTier ||
                    sub.status !== correctStatus ||
                    JSON.stringify(sub.features) !== JSON.stringify(correctFeatures);

                if (needsUpdate) {
                    console.log('⚠️ Subscription needs update!');
                    console.log('Current tier:', sub.subscription_tier, '→ Correct tier:', correctTier);
                    console.log('Current status:', sub.status, '→ Correct status:', correctStatus);

                    // Update the subscription
                    await base44.asServiceRole.entities.Subscription.update(sub.id, {
                        subscription_tier: correctTier,
                        status: correctStatus,
                        features: correctFeatures,
                        next_billing_date: new Date(stripeSubscription.current_period_end * 1000).toISOString()
                    });

                    syncResults.push({
                        subscription_id: sub.id,
                        status: 'updated',
                        message: `Updated from ${sub.subscription_tier} to ${correctTier}`,
                        old_tier: sub.subscription_tier,
                        new_tier: correctTier,
                        old_status: sub.status,
                        new_status: correctStatus
                    });

                    console.log('✅ Subscription updated successfully');
                } else {
                    syncResults.push({
                        subscription_id: sub.id,
                        status: 'up_to_date',
                        message: 'Already in sync',
                        tier: correctTier
                    });
                    console.log('✅ Subscription already in sync');
                }

            } catch (stripeError) {
                console.error('Stripe API error:', stripeError);
                syncResults.push({
                    subscription_id: sub.id,
                    status: 'error',
                    message: stripeError.message
                });
            }
        }

        return Response.json({
            success: true,
            message: 'Subscription sync completed',
            user_email: user.email,
            subscriptions_checked: userSubs.length,
            results: syncResults
        });

    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});

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