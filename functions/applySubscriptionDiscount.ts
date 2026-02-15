import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Verify admin access
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { subscription_id, discount_type, discount_value, duration, duration_months, reason } = await req.json();

        if (!subscription_id || !discount_type || !discount_value || !duration || !reason) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get subscription
        const subscription = await base44.asServiceRole.entities.Subscription.get(subscription_id);
        if (!subscription) {
            return Response.json({ error: 'Subscription not found' }, { status: 404 });
        }

        if (!subscription.stripe_subscription_id) {
            return Response.json({ error: 'No Stripe subscription found' }, { status: 400 });
        }

        console.log('Applying discount to subscription:', subscription.church_name);

        // Create coupon in Stripe
        const couponId = `custom_${subscription_id}_${Date.now()}`;
        let couponParams;

        if (discount_type === 'percentage') {
            couponParams = {
                percent_off: discount_value,
                duration: duration,
                name: `Custom discount for ${subscription.church_name}`,
            };
        } else {
            couponParams = {
                amount_off: Math.round(discount_value * 100), // Convert to cents
                currency: 'usd',
                duration: duration,
                name: `Custom discount for ${subscription.church_name}`,
            };
        }

        if (duration === 'repeating' && duration_months) {
            couponParams.duration_in_months = duration_months;
        }

        const coupon = await stripe.coupons.create({
            id: couponId,
            ...couponParams
        });

        console.log('Coupon created:', coupon.id);

        // Apply coupon to Stripe subscription
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            coupon: coupon.id,
            metadata: {
                discount_reason: reason,
                discount_applied_by: user.email,
                discount_applied_date: new Date().toISOString()
            }
        });

        console.log('Discount applied to Stripe subscription');

        // Update subscription entity with discount info
        await base44.asServiceRole.entities.Subscription.update(subscription_id, {
            notes: `${subscription.notes || ''}\n[${new Date().toISOString()}] Discount applied by ${user.email}: ${discount_type === 'percentage' ? `${discount_value}%` : `$${discount_value}`} off (${duration}). Reason: ${reason}`
        });

        // Log action
        await base44.asServiceRole.entities.AccountAction.create({
            subscription_id: subscription_id,
            church_name: subscription.church_name,
            action_type: 'discount_applied',
            performed_by: user.email,
            notes: `Applied ${discount_type === 'percentage' ? `${discount_value}%` : `$${discount_value}`} discount (${duration}). Reason: ${reason}`,
            action_date: new Date().toISOString()
        });

        return Response.json({
            success: true,
            coupon_id: coupon.id,
            message: 'Discount applied successfully'
        });

    } catch (error) {
        console.error('Apply discount error:', error);
        return Response.json({ 
            error: error.message || 'Failed to apply discount',
            details: error.raw?.message || error.message
        }, { status: 500 });
    }
});