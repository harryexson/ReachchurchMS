import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

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

        const stripe = new Stripe(stripeApiKey, {
            apiVersion: '2024-12-18.acacia'
        });
        const body = await req.json();
        const { church_name, return_url, refresh_url } = body;

        // Create a connected account for the church
        const account = await stripe.accounts.create({
            type: 'standard',
            country: 'US',
            business_type: 'non_profit',
            metadata: {
                church_name: church_name,
                admin_email: user.email,
                admin_id: user.id
            }
        });

        // Create an account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            return_url: return_url,
            refresh_url: refresh_url,
            type: 'account_onboarding',
        });

        // Save the Stripe account ID to church settings
        const settings = await base44.entities.ChurchSettings.list();
        if (settings.length > 0) {
            await base44.entities.ChurchSettings.update(settings[0].id, {
                stripe_account_id: account.id,
                bank_account_connected: false, // Will be updated via webhook
                payouts_enabled: false
            });
        } else {
            await base44.entities.ChurchSettings.create({
                church_name: church_name,
                stripe_account_id: account.id,
                bank_account_connected: false,
                payouts_enabled: false
            });
        }

        return Response.json({
            account_id: account.id,
            onboarding_url: accountLink.url
        });

    } catch (error) {
        console.error('Stripe Connect error:', error);
        return Response.json({ 
            error: 'Failed to create connect account',
            details: error.message 
        }, { status: 500 });
    }
});