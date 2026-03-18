import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { amount, description, customer_email, customer_name, metadata = {}, success_url, cancel_url } = body;

        if (!amount || !description || !customer_email || !success_url || !cancel_url) {
            return Response.json({ error: 'Missing required fields: amount, description, customer_email, success_url, cancel_url' }, { status: 400 });
        }

        const stripeApiKey = Deno.env.get("STRIPE_API_KEY");
        if (!stripeApiKey) {
            return Response.json({ error: 'Payment system not configured' }, { status: 500 });
        }

        const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: customer_email,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: description,
                        metadata: { customer_name: customer_name || customer_email }
                    },
                    unit_amount: Math.round(amount * 100) // convert to cents
                },
                quantity: 1
            }],
            success_url: success_url,
            cancel_url: cancel_url,
            metadata: {
                customer_name: customer_name || '',
                customer_email: customer_email,
                ...metadata
            }
        });

        return Response.json({ checkout_url: session.url, session_id: session.id });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});