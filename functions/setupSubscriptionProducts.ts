import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== SETUP SUBSCRIPTION PRODUCTS =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify authentication (admin only)
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            console.error(`[${requestId}] ❌ Unauthorized - admin access required`);
            return Response.json({ 
                error: 'Unauthorized',
                message: 'Admin access required'
            }, { status: 403 });
        }
        
        console.log(`[${requestId}] Admin authenticated:`, user.email);
        
        const stripeApiKey = Deno.env.get("STRIPE_API_KEY");
        if (!stripeApiKey) {
            console.error(`[${requestId}] ❌ STRIPE_API_KEY not set`);
            return Response.json({ 
                error: 'Payment system not configured',
                message: 'Stripe API key is missing'
            }, { status: 500 });
        }

        const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' });
        
        // Define subscription tiers for REACH Church Connect
        const subscriptionTiers = [
            {
                name: 'REACH Starter',
                description: 'Perfect for small churches getting started with digital tools',
                metadata: {
                    tier: 'starter',
                    platform: 'reach_church_connect',
                    members_limit: '100',
                    features: 'basic_giving,member_management,events'
                },
                prices: [
                    { amount: 4900, interval: 'month', nickname: 'Starter Monthly' },
                    { amount: 52800, interval: 'year', nickname: 'Starter Annual' }
                ]
            },
            {
                name: 'REACH Growth',
                description: 'For growing churches ready to expand their digital presence',
                metadata: {
                    tier: 'growth',
                    platform: 'reach_church_connect',
                    members_limit: '500',
                    features: 'advanced_giving,full_crm,sms,analytics'
                },
                prices: [
                    { amount: 9900, interval: 'month', nickname: 'Growth Monthly' },
                    { amount: 106800, interval: 'year', nickname: 'Growth Annual' }
                ]
            },
            {
                name: 'REACH Premium',
                description: 'Enterprise solution for large churches with advanced needs',
                metadata: {
                    tier: 'premium',
                    platform: 'reach_church_connect',
                    members_limit: 'unlimited',
                    features: 'everything,multi_campus,advanced_automation,priority_support'
                },
                prices: [
                    { amount: 19900, interval: 'month', nickname: 'Premium Monthly' },
                    { amount: 214800, interval: 'year', nickname: 'Premium Annual' }
                ]
            }
        ];

        const results = [];

        // Get existing products
        const existingProducts = await stripe.products.list({ limit: 100 });
        
        for (const tier of subscriptionTiers) {
            console.log(`[${requestId}] Processing tier: ${tier.name}`);
            
            // Check if product exists
            let product = existingProducts.data.find(p => 
                p.name === tier.name && p.metadata.platform === 'reach_church_connect'
            );
            
            if (product) {
                console.log(`[${requestId}] Product already exists: ${product.id}`);
            } else {
                // Create product
                product = await stripe.products.create({
                    name: tier.name,
                    description: tier.description,
                    metadata: tier.metadata,
                    type: 'service'
                });
                console.log(`[${requestId}] ✅ Created product: ${product.id}`);
            }

            // Get existing prices for this product
            const existingPrices = await stripe.prices.list({
                product: product.id,
                limit: 100
            });

            const tierResult = {
                product_id: product.id,
                product_name: product.name,
                tier: tier.metadata.tier,
                prices: {}
            };

            // Create prices
            for (const priceConfig of tier.prices) {
                // Check if price already exists
                const existingPrice = existingPrices.data.find(p => 
                    p.unit_amount === priceConfig.amount &&
                    p.recurring?.interval === priceConfig.interval &&
                    p.active
                );

                if (existingPrice) {
                    console.log(`[${requestId}] Price already exists: ${existingPrice.id}`);
                    tierResult.prices[priceConfig.interval] = {
                        price_id: existingPrice.id,
                        amount: existingPrice.unit_amount,
                        interval: existingPrice.recurring.interval
                    };
                } else {
                    // Create new price
                    const price = await stripe.prices.create({
                        product: product.id,
                        unit_amount: priceConfig.amount,
                        currency: 'usd',
                        recurring: {
                            interval: priceConfig.interval
                        },
                        nickname: priceConfig.nickname,
                        metadata: tier.metadata
                    });
                    
                    console.log(`[${requestId}] ✅ Created price: ${price.id}`);
                    tierResult.prices[priceConfig.interval] = {
                        price_id: price.id,
                        amount: price.unit_amount,
                        interval: price.recurring.interval
                    };
                }
            }

            results.push(tierResult);
        }

        console.log(`[${requestId}] ✅ Setup complete`);
        console.log(`[${requestId}] Results:`, JSON.stringify(results, null, 2));
        
        return Response.json({ 
            success: true,
            message: 'Subscription products and prices created successfully',
            products: results,
            instructions: 'Copy the price IDs to your SubscriptionPlans page to enable subscriptions'
        });

    } catch (error) {
        console.error(`[${requestId}] ❌ Setup error:`, error);
        return Response.json({ 
            error: 'Failed to setup products',
            message: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});