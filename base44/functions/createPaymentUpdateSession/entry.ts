import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stripeApiKey = Deno.env.get("STRIPE_API_KEY");
        if (!stripeApiKey) {
            return Response.json({ error: 'Stripe not configured' }, { status: 500 });
        }

        const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' });

        const { subscription_id } = await req.json();

        // Get subscription to find customer
        const subscription = await stripe.subscriptions.retrieve(subscription_id);

        // Create billing portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.customer,
            return_url: `${new URL(req.url).origin}/DonorPortal`,
        });

        return Response.json({
            success: true,
            portal_url: session.url
        });

    } catch (error) {
        console.error('Payment update error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});