import Stripe from 'npm:stripe@17.5.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
    apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
    try {
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET not configured');
            return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the raw body as text
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            console.error('No Stripe signature header found');
            return new Response(JSON.stringify({ error: 'No signature' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify webhook signature
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('Webhook event received:', event.type);

        // Initialize Base44 client with service role (webhooks don't have user auth)
        const base44 = createClientFromRequest(req);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(base44, event.data.object);
                break;

            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(base44, event.data.object);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionChange(base44, event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(base44, event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(base44, event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(base44, event.data.object);
                break;

            case 'account.updated':
                await handleAccountUpdated(base44, event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
            }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook handler error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

async function handleCheckoutCompleted(base44, session) {
    console.log('Processing checkout.session.completed:', session.id);

    try {
        const metadata = session.metadata || {};
        
        // Determine if this is a donation or subscription
        if (metadata.donation_type) {
            // This is a donation
            await createDonationRecord(base44, session);
        } else if (session.mode === 'subscription') {
            // This is a subscription (for the platform itself)
            await createOrUpdateSubscription(base44, session);
        }

        // Send receipt email if it's a one-time donation
        if (metadata.donation_type && session.mode === 'payment') {
            await sendDonationReceipt(base44, session);
        }

    } catch (error) {
        console.error('Error handling checkout completed:', error);
        throw error;
    }
}

async function createDonationRecord(base44, session) {
    const metadata = session.metadata || {};
    
    // Generate unique receipt number
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const receiptNumber = `REC-${year}-${timestamp}`;
    
    const donationData = {
        receipt_number: receiptNumber,
        donor_name: metadata.donor_name || session.customer_details?.name || 'Anonymous',
        donor_email: metadata.donor_email || session.customer_details?.email,
        donor_phone: metadata.donor_phone || session.customer_details?.phone,
        donor_address: metadata.donor_address,
        amount: session.amount_total / 100, // Convert from cents
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
        notes: `Stripe Checkout: ${session.id}`
    };

    console.log('Creating donation record:', donationData);

    const donation = await base44.asServiceRole.entities.Donation.create(donationData);
    
    console.log('Donation record created:', donation.id);
    
    return donation;
}

async function createOrUpdateSubscription(base44, session) {
    const metadata = session.metadata || {};
    const customerEmail = metadata.customer_email || session.customer_details?.email;

    if (!customerEmail) {
        console.error('No customer email found for subscription');
        return;
    }

    // Check if subscription already exists
    const existingSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
        church_admin_email: customerEmail
    });

    const subscriptionData = {
        church_admin_email: customerEmail,
        church_name: metadata.church_name || '',
        subscription_tier: metadata.subscription_tier || 'starter',
        status: 'active',
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };

    if (existingSubscriptions.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(
            existingSubscriptions[0].id,
            subscriptionData
        );
        console.log('Subscription updated:', existingSubscriptions[0].id);
    } else {
        await base44.asServiceRole.entities.Subscription.create(subscriptionData);
        console.log('New subscription created for:', customerEmail);
    }
}

async function handlePaymentSucceeded(base44, paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);
    
    // Check if this payment is associated with a donation
    const metadata = paymentIntent.metadata || {};
    
    if (metadata.donation_id) {
        // Update donation record
        await base44.asServiceRole.entities.Donation.update(metadata.donation_id, {
            receipt_sent: true,
            notes: `Payment confirmed: ${paymentIntent.id}`
        });
    }
}

async function handleSubscriptionChange(base44, subscription) {
    console.log('Subscription changed:', subscription.id);

    try {
        // Find subscription by Stripe subscription ID
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: subscription.id
        });

        if (subscriptions.length === 0) {
            console.log('No matching subscription found in database');
            return;
        }

        const updateData = {
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        if (subscription.trial_end) {
            updateData.trial_end_date = new Date(subscription.trial_end * 1000).toISOString();
        }

        await base44.asServiceRole.entities.Subscription.update(
            subscriptions[0].id,
            updateData
        );

        console.log('Subscription updated in database');
    } catch (error) {
        console.error('Error updating subscription:', error);
    }
}

async function handleSubscriptionDeleted(base44, subscription) {
    console.log('Subscription deleted:', subscription.id);

    try {
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: subscription.id
        });

        if (subscriptions.length > 0) {
            await base44.asServiceRole.entities.Subscription.update(
                subscriptions[0].id,
                {
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                }
            );
            console.log('Subscription marked as cancelled');
        }
    } catch (error) {
        console.error('Error handling subscription deletion:', error);
    }
}

async function handleInvoicePaymentSucceeded(base44, invoice) {
    console.log('Invoice payment succeeded:', invoice.id);

    // For recurring donations, create a new donation record
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const metadata = subscription.metadata || {};

        if (metadata.donation_type) {
            // This is a recurring donation - create new donation record
            await createDonationRecord(base44, {
                amount_total: invoice.amount_paid,
                customer_details: {
                    email: invoice.customer_email,
                    name: metadata.donor_name
                },
                metadata: metadata,
                subscription: invoice.subscription,
                id: invoice.id,
                mode: 'subscription'
            });

            // Send receipt for recurring donation
            await sendDonationReceipt(base44, {
                customer_details: {
                    email: invoice.customer_email,
                    name: metadata.donor_name
                },
                amount_total: invoice.amount_paid,
                metadata: metadata
            });
        }
    }
}

async function handleInvoicePaymentFailed(base44, invoice) {
    console.log('Invoice payment failed:', invoice.id);

    // Update subscription status or send notification
    if (invoice.subscription) {
        try {
            const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
                stripe_subscription_id: invoice.subscription
            });

            if (subscriptions.length > 0) {
                await base44.asServiceRole.entities.Subscription.update(
                    subscriptions[0].id,
                    {
                        status: 'past_due',
                        notes: `Payment failed: ${invoice.id}`
                    }
                );
            }
        } catch (error) {
            console.error('Error updating subscription after payment failure:', error);
        }
    }
}

async function sendDonationReceipt(base44, session) {
    try {
        const metadata = session.metadata || {};
        const email = metadata.donor_email || session.customer_details?.email;

        if (!email) {
            console.log('No email address for receipt');
            return;
        }

        // Find the donation record
        const donations = await base44.asServiceRole.entities.Donation.filter({
            donor_email: email
        });

        if (donations.length === 0) {
            console.log('No donation record found');
            return;
        }

        // Get the most recent donation
        const donation = donations.sort((a, b) => 
            new Date(b.created_date) - new Date(a.created_date)
        )[0];

        // Call the sendDonationReceipt function with PDF generation
        await base44.asServiceRole.functions.invoke('sendDonationReceipt', {
            donation_id: donation.id,
            donation_data: donation
        });

        console.log('Receipt sent with PDF to:', email);
    } catch (error) {
        console.error('Error sending receipt:', error);
    }
}

async function handleAccountUpdated(base44, account) {
    console.log('Stripe account updated:', account.id);

    try {
        // Find settings with this account ID
        const settings = await base44.asServiceRole.entities.ChurchSettings.filter({
            stripe_account_id: account.id
        });

        if (settings.length > 0) {
            const updateData = {
                bank_account_connected: account.charges_enabled && account.payouts_enabled,
                payouts_enabled: account.payouts_enabled
            };

            await base44.asServiceRole.entities.ChurchSettings.update(
                settings[0].id,
                updateData
            );

            console.log('Church settings updated for account:', account.id);
        }
    } catch (error) {
        console.error('Error updating account settings:', error);
    }
}