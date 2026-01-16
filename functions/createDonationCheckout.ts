import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] ===== DONATION CHECKOUT REQUEST =====`);
    
    try {
        const base44 = createClientFromRequest(req);
        
        const stripeApiKey = Deno.env.get("STRIPE_API_KEY");
        if (!stripeApiKey) {
            console.error(`[${requestId}] ❌ STRIPE_API_KEY not set`);
            return Response.json({ 
                error: 'Payment system not configured',
                message: 'Stripe API key is missing. Please contact support.'
            }, { status: 500 });
        }

        console.log(`[${requestId}] ✅ Stripe API key found`);

        const stripe = new Stripe(stripeApiKey, { 
            apiVersion: '2024-12-18.acacia'
        });

        // Get church settings to check for Stripe Connect account
        let stripeAccountId = null;
        try {
            const settings = await base44.asServiceRole.entities.ChurchSettings.list();
            if (settings.length > 0 && settings[0].stripe_account_id) {
                stripeAccountId = settings[0].stripe_account_id;
                console.log(`[${requestId}] ✅ Using Stripe Connect account: ${stripeAccountId}`);
            }
        } catch (err) {
            console.log(`[${requestId}] ⚠️ Could not load church settings:`, err.message);
        }
        const body = await req.json();

        console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));

        const { 
            amount,
            currency = 'USD',
            donation_type,
            donor_name,
            donor_email,
            donor_phone,
            donor_address,
            recurring,
            recurring_frequency,
            success_url,
            successUrl, 
            cancel_url,
            cancelUrl, 
            metadata = {} 
        } = body;

        // Support both naming conventions
        const finalSuccessUrl = success_url || successUrl;
        const finalCancelUrl = cancel_url || cancelUrl;

        // Validation
        if (!amount || amount <= 0) {
            console.error(`[${requestId}] ❌ Invalid amount: ${amount}`);
            return Response.json({
                error: 'Invalid amount',
                message: 'Donation amount must be greater than 0'
            }, { status: 400 });
        }

        if (!donor_email) {
            console.error(`[${requestId}] ❌ Missing donor email`);
            return Response.json({
                error: 'Missing donor email',
                message: 'Email is required for receipt'
            }, { status: 400 });
        }

        if (!finalSuccessUrl || !finalCancelUrl) {
            console.error(`[${requestId}] ❌ Missing success/cancel URLs`);
            return Response.json({
                error: 'Missing required URLs',
                message: 'Success and cancel URLs are required'
            }, { status: 400 });
        }

        console.log(`[${requestId}] Creating checkout for ${amount} ${currency}`);
        console.log(`[${requestId}] Donor: ${donor_name} (${donor_email})`);
        console.log(`[${requestId}] Success URL: ${finalSuccessUrl}`);
        console.log(`[${requestId}] Cancel URL: ${finalCancelUrl}`);

        // CRITICAL FIX: Ensure URLs are absolute and not in iframe context
        const cleanSuccessUrl = finalSuccessUrl.replace(/&?success=true/, '').split('?')[0] + '?success=true';
        const cleanCancelUrl = finalCancelUrl.replace(/&?cancelled=true/, '').split('?')[0] + '?cancelled=true';

        console.log(`[${requestId}] Cleaned Success URL: ${cleanSuccessUrl}`);
        console.log(`[${requestId}] Cleaned Cancel URL: ${cleanCancelUrl}`);

        // Determine mode and line items based on recurring
        const isRecurring = recurring === true || recurring === 'true';
        const mode = isRecurring ? 'subscription' : 'payment';

        // Normalize currency
        const currencyLower = (currency || 'USD').toLowerCase();

        // Handle zero-decimal currencies (JPY, KRW, etc.)
        const zeroDecimalCurrencies = ['jpy', 'krw', 'clp', 'vnd', 'xaf', 'xof'];
        const isZeroDecimal = zeroDecimalCurrencies.includes(currencyLower);
        const amountInCents = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);

        console.log(`[${requestId}] Currency: ${currency}, Amount: ${amount}, In Cents: ${amountInCents}`);

        let lineItems;
        if (isRecurring) {
            // For recurring donations, create subscription price
            const intervalMap = {
                'weekly': { interval: 'week', interval_count: 1 },
                'monthly': { interval: 'month', interval_count: 1 },
                'annually': { interval: 'year', interval_count: 1 }
            };

            const recurringInterval = intervalMap[recurring_frequency] || { interval: 'month', interval_count: 1 };

            lineItems = [{
                price_data: {
                    currency: currencyLower,
                    product_data: {
                        name: `${donation_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Donation`,
                        description: `Recurring ${recurring_frequency} donation from ${donor_name}`
                    },
                    unit_amount: amountInCents,
                    recurring: recurringInterval
                },
                quantity: 1
            }];
        } else {
            // One-time payment
            lineItems = [{
                price_data: {
                    currency: currencyLower,
                    product_data: {
                        name: `${donation_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Donation`,
                        description: `Donation from ${donor_name}`
                    },
                    unit_amount: amountInCents
                },
                quantity: 1
            }];
        }

        console.log(`[${requestId}] Mode: ${mode}, Recurring: ${isRecurring}`);

        // Detect language from metadata or browser
        const language = metadata.language || 'en';
        const localeMap = {
            'en': 'en',
            'es': 'es',
            'fr': 'fr',
            'ja': 'ja',
            'zh': 'zh'
        };

        // Create Stripe checkout session
        const sessionConfig = {
            payment_method_types: ['card', 'us_bank_account'],
            mode: mode,
            line_items: lineItems,
            customer_email: donor_email,
            success_url: cleanSuccessUrl,
            cancel_url: cleanCancelUrl,
            locale: localeMap[language] || 'auto',
            metadata: {
                donation_type: donation_type,
                donor_name: donor_name,
                donor_email: donor_email,
                donor_phone: donor_phone || '',
                donor_address: donor_address || '',
                recurring: isRecurring ? 'true' : 'false',
                recurring_frequency: recurring_frequency || '',
                currency: currency || 'USD',
                ...metadata
                },
            ui_mode: 'hosted',
            submit_type: 'donate'
        };

        // Add Stripe Connect parameters if account is connected
        if (stripeAccountId) {
            if (!isRecurring) {
                // One-time payment with Connect
                sessionConfig.payment_intent_data = {
                    metadata: {
                        donation_type: donation_type,
                        donor_name: donor_name,
                        donor_email: donor_email,
                        donor_phone: donor_phone || '',
                        donor_address: donor_address || '',
                        currency: currency || 'USD'
                    },
                    application_fee_amount: isZeroDecimal 
                        ? Math.round(amount * 0.029) + 30
                        : Math.round(amount * 100 * 0.029) + 30,
                    transfer_data: {
                        destination: stripeAccountId
                    }
                };
                console.log(`[${requestId}] ✅ One-time payment with Connect transfer to: ${stripeAccountId}`);
            } else {
                // Recurring payment with Connect
                sessionConfig.subscription_data = {
                    metadata: {
                        donation_type: donation_type,
                        donor_name: donor_name,
                        donor_email: donor_email,
                        donor_phone: donor_phone || '',
                        donor_address: donor_address || ''
                    },
                    application_fee_percent: 2.9
                };
                sessionConfig.on_behalf_of = stripeAccountId;
                sessionConfig.transfer_data = {
                    destination: stripeAccountId
                };
                console.log(`[${requestId}] ✅ Subscription with Connect transfer to: ${stripeAccountId}`);
            }
        } else {
            // No Connect account - standard payment
            if (!isRecurring) {
                sessionConfig.payment_intent_data = {
                    metadata: {
                        donation_type: donation_type,
                        donor_name: donor_name,
                        donor_email: donor_email,
                        donor_phone: donor_phone || '',
                        donor_address: donor_address || '',
                        currency: currency || 'USD'
                    }
                };
            } else {
                sessionConfig.subscription_data = {
                    metadata: {
                        donation_type: donation_type,
                        donor_name: donor_name,
                        donor_email: donor_email,
                        donor_phone: donor_phone || '',
                        donor_address: donor_address || '',
                        currency: currency || 'USD'
                    }
                };
            }
            console.log(`[${requestId}] ⚠️ No Connect account - using platform Stripe account`);
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        console.log(`[${requestId}] ✅ Session created:`, session.id);
        console.log(`[${requestId}] Checkout URL:`, session.url);

        return Response.json({ 
            success: true,
            url: session.url,
            checkout_url: session.url,
            session_id: session.id
        });

    } catch (error) {
        console.error(`[${requestId}] ❌ Donation checkout error:`, error);
        console.error(`[${requestId}] Error stack:`, error.stack);
        
        // Handle specific Stripe errors
        if (error.type === 'StripeInvalidRequestError') {
            return Response.json({ 
                error: 'Invalid request',
                message: error.message,
                details: 'Please check your Stripe configuration'
            }, { status: 400 });
        }

        if (error.type === 'StripeAuthenticationError') {
            return Response.json({ 
                error: 'Authentication failed',
                message: 'Invalid Stripe API key',
                details: 'Please verify your Stripe credentials in Settings'
            }, { status: 401 });
        }

        return Response.json({ 
            error: 'Failed to create checkout',
            message: error.message || 'An unexpected error occurred',
            details: error.toString()
        }, { status: 500 });
    }
});