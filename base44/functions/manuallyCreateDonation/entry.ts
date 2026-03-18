import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { payment_intent_id } = await req.json();

        if (!payment_intent_id) {
            return Response.json({ error: 'Missing payment_intent_id' }, { status: 400 });
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
            apiVersion: '2024-12-18.acacia',
        });

        // Fetch the payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

        console.log('Payment Intent:', JSON.stringify(paymentIntent, null, 2));

        // Get the checkout session that created this payment intent
        const sessions = await stripe.checkout.sessions.list({
            payment_intent: payment_intent_id,
            limit: 1
        });

        if (sessions.data.length === 0) {
            return Response.json({ 
                error: 'No checkout session found',
                payment_intent: paymentIntent 
            }, { status: 404 });
        }

        const session = sessions.data[0];
        const metadata = session.metadata || {};

        console.log('Session Metadata:', JSON.stringify(metadata, null, 2));

        // Generate receipt number
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        const receiptNumber = `REC-${year}-${timestamp}`;

        const currency = metadata.currency || session.currency || 'USD';
        const isZeroDecimal = ['jpy', 'krw', 'clp', 'vnd', 'xaf', 'xof'].includes(currency.toLowerCase());
        const amount = isZeroDecimal ? session.amount_total : session.amount_total / 100;

        const churchAdminEmail = metadata.church_admin_email || user.email;

        const donationData = {
            church_admin_email: churchAdminEmail,
            receipt_number: receiptNumber,
            donor_name: metadata.donor_name || session.customer_details?.name || 'Anonymous',
            donor_email: metadata.donor_email || session.customer_details?.email,
            donor_phone: metadata.donor_phone || session.customer_details?.phone,
            donor_address: metadata.donor_address,
            amount: amount,
            currency: currency.toUpperCase(),
            donation_type: metadata.donation_type || 'offering',
            payment_method: 'credit_card',
            donation_date: new Date().toISOString().split('T')[0],
            tax_year: new Date().getFullYear(),
            tax_deductible: true,
            receipt_sent: false,
            recurring: metadata.recurring === 'true',
            recurring_frequency: metadata.recurring_frequency || null,
            stripe_subscription_id: session.subscription || null,
            subscription_status: session.subscription ? 'active' : null,
            member_id: metadata.member_id || null,
            notes: `Manually created from Payment Intent: ${payment_intent_id}, Session: ${session.id}`
        };

        console.log('Creating donation:', donationData);

        const donation = await base44.asServiceRole.entities.Donation.create(donationData);

        return Response.json({ 
            success: true, 
            donation,
            payment_intent: paymentIntent,
            session_metadata: metadata
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});