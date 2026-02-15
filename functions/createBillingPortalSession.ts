import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's subscription
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            church_admin_email: user.email
        });

        if (subscriptions.length === 0 || !subscriptions[0].stripe_customer_id) {
            return Response.json({ 
                error: 'No subscription found',
                message: 'You need an active subscription to manage payment methods'
            }, { status: 404 });
        }

        const subscription = subscriptions[0];

        // Create Stripe billing portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${Deno.env.get('BASE44_APP_URL')}/settings`,
        });

        return Response.json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error('Billing portal error:', error);
        return Response.json({ 
            error: error.message || 'Failed to create billing portal session',
            details: error.stack
        }, { status: 500 });
    }
});