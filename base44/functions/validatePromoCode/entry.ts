import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { code, tier } = await req.json();

        if (!code) {
            return Response.json({ valid: false, message: 'Promo code is required' }, { status: 400 });
        }

        // Find the promo code
        const promoCodes = await base44.asServiceRole.entities.PromoCode.filter({
            code: code.toUpperCase().trim(),
            is_active: true
        });

        if (promoCodes.length === 0) {
            return Response.json({ 
                valid: false, 
                message: 'Invalid promo code' 
            });
        }

        const promoCode = promoCodes[0];
        const today = new Date().toISOString().split('T')[0];

        // Check if code has started
        if (promoCode.start_date && promoCode.start_date > today) {
            return Response.json({ 
                valid: false, 
                message: 'This promo code is not yet active' 
            });
        }

        // Check if code has expired
        if (promoCode.end_date && promoCode.end_date < today) {
            return Response.json({ 
                valid: false, 
                message: 'This promo code has expired' 
            });
        }

        // Check max uses
        if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
            return Response.json({ 
                valid: false, 
                message: 'This promo code has reached its usage limit' 
            });
        }

        // Check if code applies to this tier
        if (promoCode.applicable_tiers?.length > 0 && tier && !promoCode.applicable_tiers.includes(tier.toLowerCase())) {
            return Response.json({ 
                valid: false, 
                message: `This promo code does not apply to the ${tier} plan` 
            });
        }

        // Increment usage count
        await base44.asServiceRole.entities.PromoCode.update(promoCode.id, {
            current_uses: (promoCode.current_uses || 0) + 1
        });

        return Response.json({ 
            valid: true, 
            promoCode: {
                code: promoCode.code,
                code_type: promoCode.code_type,
                discount_value: promoCode.discount_value,
                trial_extension_days: promoCode.trial_extension_days,
                public_description: promoCode.public_description
            }
        });

    } catch (error) {
        console.error('Error validating promo code:', error);
        return Response.json({ 
            valid: false, 
            message: 'Error validating promo code' 
        }, { status: 500 });
    }
});