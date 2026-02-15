import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { coupon_code, plan_tier, subscription_id } = body;

        if (!coupon_code) {
            return Response.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        // Find coupon by code
        const coupons = await base44.entities.Coupon.filter({
            code: coupon_code.toUpperCase()
        });

        if (coupons.length === 0) {
            return Response.json({ 
                valid: false,
                message: 'Coupon code not found'
            });
        }

        const coupon = coupons[0];
        const now = new Date();

        // Check if coupon is active
        if (coupon.status === 'inactive' || coupon.status === 'expired') {
            return Response.json({ 
                valid: false,
                message: `Coupon is ${coupon.status}`
            });
        }

        // Check expiry date
        if (coupon.expiry_date) {
            const expiryDate = new Date(coupon.expiry_date);
            if (now > expiryDate) {
                return Response.json({ 
                    valid: false,
                    message: 'Coupon has expired'
                });
            }
        }

        // Check start date
        if (coupon.start_date) {
            const startDate = new Date(coupon.start_date);
            if (now < startDate) {
                return Response.json({ 
                    valid: false,
                    message: 'Coupon is not yet active'
                });
            }
        }

        // Check redemption limit
        if (coupon.max_redemptions && coupon.redeemed_count >= coupon.max_redemptions) {
            return Response.json({ 
                valid: false,
                message: 'Coupon redemption limit reached'
            });
        }

        // Check applicable tiers
        if (!coupon.applicable_tiers.includes('all') && plan_tier && !coupon.applicable_tiers.includes(plan_tier)) {
            return Response.json({ 
                valid: false,
                message: `Coupon not applicable to ${plan_tier} plan`
            });
        }

        // Check customer usage limit
        if (coupon.max_redemptions_per_customer > 0 && subscription_id) {
            const usageRecords = await base44.entities.CouponUsage.filter({
                coupon_id: coupon.id,
                subscription_id: subscription_id
            });
            
            if (usageRecords.length >= coupon.max_redemptions_per_customer) {
                return Response.json({ 
                    valid: false,
                    message: 'You have already used this coupon the maximum number of times'
                });
            }
        }

        // Coupon is valid
        return Response.json({ 
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                duration_type: coupon.duration_type,
                duration_months: coupon.duration_months,
                description: coupon.description
            }
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return Response.json({ 
            error: error.message || 'Failed to validate coupon'
        }, { status: 500 });
    }
});