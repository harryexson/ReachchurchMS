import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== CHECKOUT SESSION REQUEST =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication
        const user = await base44.auth.me();
        if (!user) {
            console.error(`[${requestId}] ❌ Unauthorized`);
            return Response.json({ 
                error: 'Unauthorized',
                message: 'Please sign in to continue'
            }, { status: 401 });
        }
        
        console.log(`[${requestId}] User authenticated:`, user.email);
        
        const stripeApiKey = Deno.env.get("STRIPE_API_KEY");
        if (!stripeApiKey) {
            console.error(`[${requestId}] ❌ STRIPE_API_KEY not set`);
            return Response.json({ 
                error: 'Payment system not configured',
                message: 'Stripe API key is missing'
            }, { status: 500 });
        }

        const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' });
        const body = await req.json();
        
        console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));
        
        const { 
            priceId,
            planName, 
            successUrl, 
            cancelUrl, 
            metadata = {},
            isAddon = false,
            addonId = null,
            promoCode = null
        } = body;

        if (!successUrl || !cancelUrl) {
            console.error(`[${requestId}] Missing required URLs`);
            return Response.json({
                error: 'Missing required fields',
                message: 'Success URL and Cancel URL are required'
            }, { status: 400 });
        }

        if (!priceId) {
            console.error(`[${requestId}] No priceId provided. Attempting to fetch from PricingPlan entity...`);
            
            // Try to fetch pricing plan if not provided
            if (metadata.plan_tier) {
                try {
                    const pricingPlans = await base44.entities.PricingPlan.filter({
                        plan_name: metadata.plan_tier
                    });
                    
                    if (pricingPlans.length === 0) {
                        console.error(`[${requestId}] No pricing plan found for tier: ${metadata.plan_tier}`);
                        return Response.json({
                            error: 'Invalid request',
                            message: `No pricing plan found for the tier ${metadata.plan_tier}. Please ensure the pricing plan is set up in the Back Office.`
                        }, { status: 400 });
                    }
                    
                    const plan = pricingPlans[0];
                    const fetchedPriceId = metadata.billing_cycle === 'annual' 
                        ? plan.stripe_annual_price_id 
                        : plan.stripe_monthly_price_id;
                    
                    if (!fetchedPriceId) {
                        console.error(`[${requestId}] No Stripe price ID for ${metadata.plan_tier} - ${metadata.billing_cycle}`);
                        return Response.json({
                            error: 'Invalid request',
                            message: `No Stripe price ID configured for ${metadata.plan_tier} - ${metadata.billing_cycle}. Please run setupSubscriptionProducts.`
                        }, { status: 400 });
                    }
                    
                    console.log(`[${requestId}] Using fetched price ID: ${fetchedPriceId}`);
                    // Continue with fetched priceId
                    body.priceId = fetchedPriceId;
                } catch (err) {
                    console.error(`[${requestId}] Error fetching pricing plan:`, err.message);
                    return Response.json({
                        error: 'Invalid request',
                        message: 'A valid Stripe price ID is required'
                    }, { status: 400 });
                }
            } else {
                return Response.json({
                    error: 'Invalid request',
                    message: 'A valid Stripe price ID is required'
                }, { status: 400 });
            }
        }

        console.log(`[${requestId}] Creating checkout with price: ${priceId}`);
        
        // Check for existing subscription with discount
        let existingDiscount = null;
        try {
            const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
                church_admin_email: user.email
            });
            
            if (existingSubscriptions.length > 0) {
                const existingSub = existingSubscriptions[0];
                if (existingSub.discount_percentage || existingSub.effective_monthly_price < existingSub.monthly_price) {
                    existingDiscount = existingSub;
                    console.log(`[${requestId}] Found existing subscription discount:`, {
                        percentage: existingSub.discount_percentage,
                        reason: existingSub.discount_reason
                    });
                }
            }
        } catch (err) {
            console.log(`[${requestId}] No existing subscription found:`, err.message);
        }
        
        // Validate promo code if provided
        let promoCodeData = null;
        if (promoCode) {
            const validateResponse = await base44.functions.invoke('validatePromoCode', {
                code: promoCode,
                tier: metadata.plan_tier
            });
            
            if (validateResponse.data?.valid) {
                promoCodeData = validateResponse.data.promoCode;
                console.log(`[${requestId}] Valid promo code applied:`, promoCodeData.code);
            } else {
                console.log(`[${requestId}] Invalid promo code:`, validateResponse.data?.message);
            }
        }
        
        // Get or create Stripe customer
        let customer;
        const customers = await stripe.customers.list({
            email: user.email,
            limit: 1
        });
        
        if (customers.data.length > 0) {
            customer = customers.data[0];
            console.log(`[${requestId}] Found existing customer:`, customer.id);
        } else {
            customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name || user.email,
                metadata: {
                    base44_user_id: user.id,
                    church_name: metadata.church_name || ''
                }
            });
            console.log(`[${requestId}] Created new customer:`, customer.id);
        }
        
        // Build session parameters
        const sessionParams = {
            customer: customer.id,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                plan_name: planName || 'subscription',
                user_email: user.email,
                user_id: user.id,
                promo_code: promoCodeData?.code || null,
                ...metadata
            },
            subscription_data: isAddon ? {
                metadata: {
                    user_email: user.email,
                    user_id: user.id,
                    addon_id: addonId,
                    is_addon: 'true',
                    promo_code: promoCodeData?.code || null,
                    ...metadata
                }
            } : {
                trial_period_days: promoCodeData?.code_type === 'free_trial_extension' 
                    ? 14 + (promoCodeData.trial_extension_days || 0)
                    : 14,
                metadata: {
                    user_email: user.email,
                    user_id: user.id,
                    plan_name: planName || 'subscription',
                    promo_code: promoCodeData?.code || null,
                    ...metadata
                }
            }
        };

        // Apply discount - prioritize existing subscription discount over promo code
        if (existingDiscount && existingDiscount.discount_percentage) {
            console.log(`[${requestId}] Applying existing subscription discount: ${existingDiscount.discount_percentage}%`);
            const discountCouponId = await createSubscriptionDiscountCoupon(stripe, existingDiscount, requestId);
            if (discountCouponId) {
                sessionParams.discounts = [{ coupon: discountCouponId }];
            }
        } else if (promoCodeData && (promoCodeData.code_type === 'percentage' || promoCodeData.code_type === 'fixed_amount')) {
            sessionParams.discounts = [{
                coupon: await createStripeCoupon(stripe, promoCodeData)
            }];
        } else {
            // Only allow manual promo code entry if no programmatic discount is applied
            sessionParams.allow_promotion_codes = true;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        
        console.log(`[${requestId}] ✅ Session created with 14-day trial:`, session.id);

        console.log(`[${requestId}] ✅ Session created:`, session.id);
        return Response.json({ 
            checkout_url: session.url,
            session_id: session.id
        });

    } catch (error) {
        console.error(`[${requestId}] ❌ Checkout error:`, error);
        return Response.json({ 
            error: 'Failed to create checkout session',
            message: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});

async function createSubscriptionDiscountCoupon(stripe, subscription, requestId) {
    try {
        const couponId = `SUB_DISCOUNT_${subscription.id.substring(0, 8)}`;
        
        try {
            const existingCoupon = await stripe.coupons.retrieve(couponId);
            console.log(`[${requestId}] Using existing subscription discount coupon:`, couponId);
            return existingCoupon.id;
        } catch (e) {
            // Coupon doesn't exist, create it
        }

        const couponParams = {
            id: couponId,
            name: `Subscription discount for ${subscription.church_name}`,
            duration: 'forever',
            percent_off: subscription.discount_percentage
        };

        const coupon = await stripe.coupons.create(couponParams);
        console.log(`[${requestId}] Created subscription discount coupon:`, coupon.id);
        return coupon.id;
    } catch (error) {
        console.error(`[${requestId}] Error creating subscription discount coupon:`, error);
        return null;
    }
}

async function createStripeCoupon(stripe, promoCodeData) {
    try {
        // Check if coupon already exists
        const couponId = `PROMO_${promoCodeData.code}`;
        
        try {
            const existingCoupon = await stripe.coupons.retrieve(couponId);
            return existingCoupon.id;
        } catch (e) {
            // Coupon doesn't exist, create it
        }

        const couponParams = {
            id: couponId,
            name: promoCodeData.public_description || promoCodeData.code,
            duration: 'forever'
        };

        if (promoCodeData.code_type === 'percentage') {
            couponParams.percent_off = promoCodeData.discount_value;
        } else if (promoCodeData.code_type === 'fixed_amount') {
            couponParams.amount_off = Math.round(promoCodeData.discount_value * 100);
            couponParams.currency = 'usd';
        }

        const coupon = await stripe.coupons.create(couponParams);
        return coupon.id;
    } catch (error) {
        console.error('Error creating Stripe coupon:', error);
        return null;
    }
}