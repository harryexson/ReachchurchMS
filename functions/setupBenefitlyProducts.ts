import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== SETUP BENEFITLY PRODUCTS =====`);
    
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
        
        // Define Benefitly tiers
        const benefitlyTiers = [
            {
                name: 'Leadership Team Only',
                description: 'Leadership team access to assessments, dashboards, and 30/90-day programs',
                metadata: {
                    tier: 'leadership',
                    platform: 'benefitly'
                },
                prices: [
                    { amount: 50000, interval: 'month', nickname: 'Monthly' }
                ]
            },
            {
                name: 'Full Organization',
                description: 'Full organization access including leadership and employee training programs',
                metadata: {
                    tier: 'organization',
                    platform: 'benefitly'
                },
                prices: [
                    { amount: 75000, interval: 'month', nickname: 'Monthly' }
                ]
            },
            {
                name: 'Legacy Executive',
                description: 'Executive C-Level access for long-term institutional implementation',
                metadata: {
                    tier: 'executive',
                    platform: 'benefitly'
                },
                prices: [
                    { amount: 100000, interval: 'month', nickname: 'Monthly' }
                ]
            }
        ];

        const results = [];

        // Check if products already exist
        const existingProducts = await stripe.products.list({ limit: 100 });
        
        for (const tier of benefitlyTiers) {
            console.log(`[${requestId}] Processing tier: ${tier.name}`);
            
            // Check if product exists
            let product = existingProducts.data.find(p => 
                p.name === tier.name && p.metadata.platform === 'benefitly'
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
                prices: []
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
                    tierResult.prices.push({
                        price_id: existingPrice.id,
                        amount: existingPrice.unit_amount,
                        interval: existingPrice.recurring.interval,
                        nickname: existingPrice.nickname
                    });
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
                    tierResult.prices.push({
                        price_id: price.id,
                        amount: price.unit_amount,
                        interval: price.recurring.interval,
                        nickname: price.nickname
                    });
                }
            }

            results.push(tierResult);
        }

        console.log(`[${requestId}] ✅ Setup complete`);
        
        return Response.json({ 
            success: true,
            message: 'Benefitly products and prices created successfully',
            products: results
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