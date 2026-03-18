import Stripe from 'npm:stripe@14.21.0';

// SIMPLEST POSSIBLE STRIPE TEST
Deno.serve(async (req) => {
    console.log('=== STRIPE TEST STARTED ===');
    
    try {
        const key = Deno.env.get("STRIPE_API_KEY");
        
        if (!key) {
            console.log('❌ No STRIPE_API_KEY');
            return Response.json({ 
                success: false,
                error: 'No Stripe key found' 
            });
        }
        
        console.log(`✓ Key found: ${key.substring(0, 15)}...`);
        
        const stripe = new Stripe(key);
        console.log('✓ Stripe initialized');
        
        // Test 1: List prices (fast)
        const prices = await stripe.prices.list({ limit: 1 });
        console.log(`✓ API works - found ${prices.data.length} prices`);
        
        // Test 2: Create actual session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Test Payment' },
                    unit_amount: 1000 // $10
                },
                quantity: 1
            }],
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel'
        });
        
        console.log(`✓ Session created: ${session.id}`);
        console.log(`✓ URL: ${session.url}`);
        
        return Response.json({ 
            success: true,
            message: 'Stripe is working!',
            session_id: session.id,
            checkout_url: session.url
        });
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        return Response.json({ 
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});