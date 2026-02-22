import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();

        // Verify admin access
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { subscription_id, discount_type, discount_value, duration, duration_months, reason } = body;

        console.log('Discount request:', JSON.stringify({ subscription_id, discount_type, discount_value, duration, duration_months, reason }, null, 2));

        if (!subscription_id || !discount_type || discount_value === undefined || !duration || !reason) {
            return Response.json({ 
                error: 'Missing required fields',
                received: { subscription_id, discount_type, discount_value, duration, reason }
            }, { status: 400 });
        }

        if (duration === 'repeating' && !duration_months) {
            return Response.json({ error: 'Duration months required for repeating discounts' }, { status: 400 });
        }

        // Get subscription
        let subscription;
        try {
            const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ id: subscription_id });
            if (subscriptions.length === 0) {
                return Response.json({ error: 'Subscription not found' }, { status: 404 });
            }
            subscription = subscriptions[0];
        } catch (err) {
            console.error('Error fetching subscription:', err);
            return Response.json({ 
                error: 'Failed to fetch subscription',
                details: err.message
            }, { status: 400 });
        }

        console.log('Subscription data:', JSON.stringify({
            id: subscription.id,
            church_name: subscription.church_name,
            status: subscription.status,
            stripe_subscription_id: subscription.stripe_subscription_id,
            stripe_customer_id: subscription.stripe_customer_id
        }, null, 2));

        // Allow discounts for active/trial subscriptions without Stripe ID
        // They'll get applied when they do eventually checkout
        if (!subscription.stripe_subscription_id && subscription.status !== 'active' && subscription.status !== 'trial') {
            return Response.json({ 
                error: 'Cannot apply discount',
                details: 'This subscription must be active or in trial status to receive discounts.',
                subscription_status: subscription.status
            }, { status: 400 });
        }

        // If no Stripe subscription yet, store discount for later application
        if (!subscription.stripe_subscription_id) {
            console.log('No Stripe subscription yet - storing discount for future checkout');
            
            // Update subscription with pending discount info
            await base44.asServiceRole.entities.Subscription.update(subscription_id, {
                notes: `${subscription.notes || ''}\n[${new Date().toISOString()}] PENDING DISCOUNT (to be applied at checkout): ${discount_type === 'percentage' ? `${discount_value}%` : `$${discount_value}`} off (${duration}). Reason: ${reason}. Applied by: ${user.email}`
            });

            // Log action
            await base44.asServiceRole.entities.AccountAction.create({
                subscription_id: subscription_id,
                church_name: subscription.church_name,
                action_type: 'discount_scheduled',
                performed_by: user.email,
                notes: `Scheduled ${discount_type === 'percentage' ? `${discount_value}%` : `$${discount_value}`} discount (${duration}) to be applied at checkout. Reason: ${reason}`,
                action_date: new Date().toISOString()
            });

            return Response.json({
                success: true,
                message: 'Discount scheduled for application at checkout',
                note: 'This discount will be automatically applied when the customer completes their first payment.'
            });
        }

        console.log('Applying discount to subscription:', subscription.church_name);

        // CRITICAL: Create a customer-specific discount, not a generic coupon
        // Use Stripe's subscription discount API to ensure discount is ONLY for this customer
        const discountParams = {
            coupon: {
                duration: duration,
                name: `Discount for ${subscription.church_name} - ${reason.substring(0, 50)}`,
                // CRITICAL: Use max_redemptions: 1 to prevent reuse across customers
                max_redemptions: 1,
            },
            metadata: {
                discount_reason: reason,
                discount_applied_by: user.email,
                discount_applied_date: new Date().toISOString(),
                subscription_id: subscription_id,
                church_admin_email: subscription.church_admin_email
            }
        };

        if (discount_type === 'percentage') {
            discountParams.coupon.percent_off = parseFloat(discount_value);
        } else {
            discountParams.coupon.amount_off = Math.round(parseFloat(discount_value) * 100);
            discountParams.coupon.currency = 'usd';
        }

        if (duration === 'repeating' && duration_months) {
            discountParams.coupon.duration_in_months = parseInt(duration_months);
        }

        console.log('Creating customer-specific discount:', JSON.stringify(discountParams, null, 2));

        // Create coupon with max_redemptions=1 to ensure it's customer-specific
        const couponId = `discount_${subscription_id.substring(0, 8)}_${Date.now()}`;
        let coupon;
        try {
            coupon = await stripe.coupons.create({
                id: couponId,
                ...discountParams.coupon
            });
            console.log('Customer-specific coupon created:', coupon.id);
        } catch (stripeError) {
            console.error('Stripe coupon creation error:', stripeError);
            return Response.json({ 
                error: 'Failed to create Stripe coupon',
                details: stripeError.message,
                code: stripeError.code
            }, { status: 400 });
        }

        // Apply coupon to THIS customer's Stripe subscription only
        try {
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                coupon: coupon.id,
                metadata: discountParams.metadata
            });
            console.log('Customer-specific discount applied to Stripe subscription');
        } catch (stripeError) {
            console.error('Stripe subscription update error:', stripeError);
            // Clean up the coupon if we couldn't apply it
            try {
                await stripe.coupons.del(coupon.id);
            } catch (cleanupError) {
                console.error('Failed to cleanup coupon:', cleanupError);
            }
            return Response.json({ 
                error: 'Failed to apply coupon to subscription',
                details: stripeError.message,
                code: stripeError.code
            }, { status: 400 });
        }

        // Calculate discounted prices
        const originalMonthly = subscription.monthly_price;
        const originalAnnual = subscription.annual_price;
        let effectiveMonthly = originalMonthly;
        let effectiveAnnual = originalAnnual;
        
        if (discount_type === 'percentage') {
            effectiveMonthly = originalMonthly * (1 - discount_value / 100);
            effectiveAnnual = originalAnnual * (1 - discount_value / 100);
        } else {
            // Fixed amount discount
            effectiveMonthly = Math.max(0, originalMonthly - discount_value);
            effectiveAnnual = Math.max(0, originalAnnual - (discount_value * 12));
        }
        
        console.log('Price calculation:', {
            original: { monthly: originalMonthly, annual: originalAnnual },
            effective: { monthly: effectiveMonthly, annual: effectiveAnnual },
            discount: { type: discount_type, value: discount_value }
        });
        
        // Update subscription entity with discount info AND updated prices
        await base44.asServiceRole.entities.Subscription.update(subscription_id, {
            discount_percentage: discount_type === 'percentage' ? discount_value : null,
            discount_reason: reason,
            effective_monthly_price: effectiveMonthly,
            effective_annual_price: effectiveAnnual,
            notes: `${subscription.notes || ''}\n[${new Date().toISOString()}] Discount applied by ${user.email}: ${discount_type === 'percentage' ? `${discount_value}%` : `$${discount_value}`} off (${duration}). Reason: ${reason}. New prices: $${effectiveMonthly}/mo, $${effectiveAnnual}/yr`
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
            details: error.raw?.message || error.stack,
            type: error.constructor.name
        }, { status: 500 });
    }
});