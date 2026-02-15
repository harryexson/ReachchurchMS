import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, ExternalLink, Link as LinkIcon } from "lucide-react";

export default function StripeConnectSetup({ churchSettings }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const hasStripeConnect = churchSettings?.stripe_account_id;
    const payoutsEnabled = churchSettings?.payouts_enabled;

    const initiateStripeConnect = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            const host = window.location.origin;
            const returnUrl = `${host}/BackOffice?stripe_connect=success`;
            const refreshUrl = `${host}/BackOffice?stripe_connect=refresh`;

            console.log('📤 Calling createStripeConnectAccount function...');
            console.log('Return URL:', returnUrl);
            console.log('Refresh URL:', refreshUrl);

            const response = await base44.functions.invoke('createStripeConnectAccount', {
                church_name: churchSettings.church_name,
                return_url: returnUrl,
                refresh_url: refreshUrl
            });

            console.log('Response:', response);

            if (response.data?.onboarding_url) {
                console.log('✅ Onboarding URL received, redirecting...');
                // Redirect to Stripe onboarding
                window.location.href = response.data.onboarding_url;
            } else {
                throw new Error(response.data?.error || 'Failed to generate onboarding URL');
            }
        } catch (err) {
            console.error('Stripe Connect error:', err);
            setError(err.message || 'Failed to initiate Stripe Connect');
        } finally {
            setIsProcessing(false);
        }
    };

    if (hasStripeConnect && payoutsEnabled) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-5 h-5" />
                        Stripe Connect Active
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-green-700">
                        <p><strong>Connected Account:</strong> {churchSettings.stripe_account_id}</p>
                        <p><strong>Payouts Enabled:</strong> ✓ Yes</p>
                        <p className="mt-4 text-green-600">Stripe Connect is fully set up and ready for payouts.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (hasStripeConnect && !payoutsEnabled) {
        return (
            <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                        <AlertCircle className="w-5 h-5" />
                        Stripe Connect Pending
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                            Stripe Connect account is created but onboarding is not complete. 
                            Complete the onboarding to enable payouts.
                        </AlertDescription>
                    </Alert>
                    <Button 
                        onClick={initiateStripeConnect}
                        disabled={isProcessing}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Redirecting to Stripe...
                            </>
                        ) : (
                            <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Complete Stripe Onboarding
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                    <LinkIcon className="w-5 h-5" />
                    Connect Stripe
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                        Connect your church's Stripe account to enable donations and automatic payouts.
                    </AlertDescription>
                </Alert>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <p className="text-sm text-blue-700">
                    You'll be redirected to Stripe to complete your church's account setup. This takes about 5-10 minutes.
                </p>

                <Button 
                    onClick={initiateStripeConnect}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirecting to Stripe...
                        </>
                    ) : (
                        <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect Stripe
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}