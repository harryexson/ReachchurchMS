import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { subscription_id, coupon_code } = body;

        if (!subscription_id || !coupon_code) {
            return Response.json({ 
                error: 'Missing required fields: subscription_id, coupon_code' 
            }, { status: 400 });
        }

        // Get subscription
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            id: subscription_id
        });

        if (subscriptions.length === 0) {
            return Response.json({ error: 'Subscription not found' }, { status: 404 });
        }

        const subscription = subscriptions[0];

        if (!subscription.stripe_subscription_id) {
            return Response.json({ 
                error: 'No Stripe subscription found. Please set up Stripe billing first.'
            }, { status: 400 });
        }

        // Validate coupon
        const validateResponse = await base44.functions.invoke('validateCoupon', {
            coupon_code,
            plan_tier: subscription.subscription_tier,
            subscription_id
        });

        if (!validateResponse.data?.valid) {
            return Response.json({ 
                error: validateResponse.data?.message || 'Invalid coupon'
            }, { status: 400 });
        }

        const coupon = validateResponse.data.coupon;

        // Get or create Stripe coupon
        const stripeCouponId = `COUPON_${coupon.id.substring(0, 8)}`;
        let stripeCoupon;

        try {
            stripeCoupon = await stripe.coupons.retrieve(stripeCouponId);
        } catch (e) {
            // Create new Stripe coupon
            const couponParams = {
                id: stripeCouponId,
                name: coupon.code,
                duration: coupon.duration_type === 'repeating' ? 'repeating' : coupon.duration_type === 'forever' ? 'forever' : 'once'
            };

            if (coupon.discount_type === 'percentage') {
                couponParams.percent_off = coupon.discount_value;
            } else {
                couponParams.amount_off = Math.round(coupon.discount_value * 100);
                couponParams.currency = 'usd';
            }

            if (coupon.duration_type === 'repeating' && coupon.duration_months) {
                couponParams.duration_in_months = coupon.duration_months;
            }

            stripeCoupon = await stripe.coupons.create(couponParams);
        }

        // Apply coupon to Stripe subscription
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            coupon: stripeCoupon.id
        });

        // Update coupon usage count
        await base44.asServiceRole.entities.Coupon.update(coupon.id, {
            redeemed_count: (coupon.redeemed_count || 0) + 1
        });

        // Log coupon usage
        await base44.asServiceRole.entities.CouponUsage.create({
            coupon_id: coupon.id,
            subscription_id: subscription.id,
            used_by_email: user.email,
            used_date: new Date().toISOString()
        });

        return Response.json({ 
            success: true,
            message: `Coupon '${coupon.code}' applied successfully`,
            discount: {
                type: coupon.discount_type,
                value: coupon.discount_value
            }
        });

    } catch (error) {
        console.error('Apply coupon error:', error);
        return Response.json({ 
            error: error.message || 'Failed to apply coupon'
        }, { status: 500 });
    }
});