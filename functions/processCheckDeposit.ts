import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"), {
    apiVersion: '2024-11-20.acacia',
});

/**
 * FUTURE: Process check deposit via Stripe Treasury
 * 
 * Requirements:
 * 1. Stripe Connect account with Treasury enabled
 * 2. Connected bank account
 * 3. Check processing API access
 * 
 * This function is a placeholder for when the church upgrades to automatic check processing.
 * Current implementation: Records check for manual deposit
 * Future implementation: Processes check electronically via Stripe Treasury
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            check_front_image, 
            check_back_image,
            amount,
            donor_name,
            check_number,
            routing_number,
            account_number 
        } = await req.json();

        // Current implementation: Record keeping only
        const result = {
            status: 'recorded',
            message: 'Check recorded for manual deposit',
            requires_manual_deposit: true,
            next_steps: [
                'Take the physical check to your bank',
                'Or use your bank\'s mobile deposit app',
                'Check will appear in your account in 1-3 business days'
            ]
        };

        // FUTURE: Stripe Treasury integration
        // Uncomment when church upgrades to automatic processing
        /*
        const settings = await base44.entities.ChurchSettings.list();
        const stripeAccountId = settings[0]?.stripe_account_id;
        
        if (!stripeAccountId) {
            return Response.json({ 
                error: 'Stripe Connect account not configured',
                upgrade_url: 'mailto:sales@churchconnectms.com?subject=Enable Check Processing'
            }, { status: 400 });
        }

        // Process check via Stripe Treasury
        const checkDeposit = await stripe.treasury.receivedDebits.create({
            financial_account: stripeAccountId,
            network: 'ach',
            amount: Math.round(amount * 100),
            currency: 'usd',
            description: `Check #${check_number} from ${donor_name}`,
            initiating_payment_method_details: {
                type: 'us_bank_account',
                us_bank_account: {
                    routing_number,
                    account_number,
                }
            }
        }, {
            stripeAccount: stripeAccountId
        });

        result = {
            status: 'processing',
            message: 'Check submitted for electronic processing',
            stripe_debit_id: checkDeposit.id,
            estimated_arrival: '1-2 business days',
            requires_manual_deposit: false
        };
        */

        return Response.json(result);

    } catch (error) {
        console.error('Check processing error:', error);
        return Response.json({ 
            error: error.message,
            fallback: 'Please manually deposit the check at your bank'
        }, { status: 500 });
    }
});