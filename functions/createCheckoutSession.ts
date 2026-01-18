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
            addonId = null
        } = body;

        if (!successUrl || !cancelUrl) {
            console.error(`[${requestId}] Missing required URLs`);
            return Response.json({
                error: 'Missing required fields',
                message: 'Success URL and Cancel URL are required'
            }, { status: 400 });
        }

        if (!priceId) {
            console.error(`[${requestId}] No priceId provided`);
            return Response.json({
                error: 'Invalid request',
                message: 'A valid Stripe price ID is required'
            }, { status: 400 });
        }

        console.log(`[${requestId}] Creating checkout with price: ${priceId}`);
        
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
        
        const session = await stripe.checkout.sessions.create({
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
                ...metadata
            },
            subscription_data: isAddon ? {
                metadata: {
                    user_email: user.email,
                    user_id: user.id,
                    addon_id: addonId,
                    is_addon: 'true',
                    ...metadata
                }
            } : {
                trial_period_days: 14,
                metadata: {
                    user_email: user.email,
                    user_id: user.id,
                    plan_name: planName || 'subscription',
                    ...metadata
                }
            }
        });
        
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