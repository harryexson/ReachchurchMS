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

        const { subscription_id, action } = await req.json();

        if (!subscription_id || !action) {
            return Response.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Verify subscription belongs to user
        const donations = await base44.entities.Donation.filter({
            stripe_subscription_id: subscription_id,
            donor_email: user.email
        });

        if (donations.length === 0) {
            return Response.json({ error: 'Subscription not found' }, { status: 404 });
        }

        let result;

        switch (action) {
            case 'pause':
                result = await stripe.subscriptions.update(subscription_id, {
                    pause_collection: {
                        behavior: 'mark_uncollectible'
                    }
                });

                // Update database
                await base44.entities.Donation.update(donations[0].id, {
                    subscription_status: 'paused'
                });
                break;

            case 'resume':
                result = await stripe.subscriptions.update(subscription_id, {
                    pause_collection: null
                });

                await base44.entities.Donation.update(donations[0].id, {
                    subscription_status: 'active'
                });
                break;

            case 'cancel':
                result = await stripe.subscriptions.cancel(subscription_id);

                await base44.entities.Donation.update(donations[0].id, {
                    subscription_status: 'cancelled'
                });
                break;

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        return Response.json({
            success: true,
            subscription: result
        });

    } catch (error) {
        console.error('Subscription management error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});