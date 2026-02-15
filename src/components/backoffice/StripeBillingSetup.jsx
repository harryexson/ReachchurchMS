import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, CheckCircle, Loader2, ExternalLink } from "lucide-react";

export default function StripeBillingSetup({ subscription, onUpdate }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [checkoutUrl, setCheckoutUrl] = useState(null);

    const hasStripeConnection = subscription.stripe_customer_id && subscription.stripe_subscription_id;

    const createCheckoutSession = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Fetch Stripe price IDs from PricingPlan entity
            const pricingPlans = await base44.entities.PricingPlan.filter({
                tier: subscription.subscription_tier
            });

            if (pricingPlans.length === 0) {
                throw new Error(`No pricing plan found for tier: ${subscription.subscription_tier}`);
            }

            const plan = pricingPlans[0];
            const priceId = subscription.billing_cycle === 'monthly' 
                ? plan.stripe_price_id_monthly 
                : plan.stripe_price_id_annual;
            
            if (!priceId) {
                throw new Error(`No Stripe price ID configured for ${subscription.subscription_tier} - ${subscription.billing_cycle}. Please configure pricing in the Back Office.`);
            }

            const host = window.location.origin;
            const successUrl = `${host}/BackOffice?stripe_setup=success&subscription_id=${subscription.id}`;
            const cancelUrl = `${host}/BackOffice?stripe_setup=cancelled`;

            const response = await base44.functions.invoke('createCheckoutSession', {
                priceId,
                planName: `${subscription.subscription_tier} - ${subscription.billing_cycle}`,
                successUrl,
                cancelUrl,
                metadata: {
                    subscription_id: subscription.id,
                    church_name: subscription.church_name,
                    church_admin_email: subscription.church_admin_email,
                    plan_tier: subscription.subscription_tier,
                    billing_cycle: subscription.billing_cycle,
                    existing_subscription: 'true'
                }
            });

            if (response.data?.checkout_url) {
                setCheckoutUrl(response.data.checkout_url);
            } else {
                throw new Error('Failed to create checkout session');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.message || 'Failed to create checkout session');
        } finally {
            setIsProcessing(false);
        }
    };

    const openStripeCheckout = () => {
        if (checkoutUrl) {
            window.open(checkoutUrl, '_blank');
        }
    };

    if (hasStripeConnection) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-5 h-5" />
                        Stripe Billing Active
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-green-700">
                        <p><strong>Customer ID:</strong> {subscription.stripe_customer_id}</p>
                        <p><strong>Subscription ID:</strong> {subscription.stripe_subscription_id}</p>
                        <p className="mt-4 text-green-600">✓ Automatic billing is configured</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="w-5 h-5" />
                    Stripe Billing Not Connected
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                        This subscription exists in the database but is not connected to Stripe for automatic billing.
                        Set up billing to enable automatic payments.
                    </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Church:</strong> {subscription.church_name}</p>
                    <p><strong>Admin Email:</strong> {subscription.church_admin_email}</p>
                    <p><strong>Tier:</strong> {subscription.subscription_tier}</p>
                    <p><strong>Billing:</strong> {subscription.billing_cycle}</p>
                    <p><strong>Price:</strong> ${subscription.billing_cycle === 'monthly' ? subscription.monthly_price : subscription.annual_price}/{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}</p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!checkoutUrl ? (
                    <Button 
                        onClick={createCheckoutSession}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Checkout...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Set Up Stripe Billing
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="space-y-3">
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <AlertDescription className="text-green-700">
                                Checkout session created! Click the button below to complete billing setup.
                            </AlertDescription>
                        </Alert>
                        <Button 
                            onClick={openStripeCheckout}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Stripe Checkout
                        </Button>
                        <p className="text-xs text-slate-500 text-center">
                            The church admin will enter payment details and the subscription will be automatically connected.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}