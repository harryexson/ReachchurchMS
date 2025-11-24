import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Heart, Loader2, Calendar, DollarSign, CreditCard, 
    Pause, Play, XCircle, Edit, CheckCircle, Info
} from "lucide-react";
import { format } from "date-fns";

export default function DonorPortal() {
    const [currentUser, setCurrentUser] = useState(null);
    const [recurringDonations, setRecurringDonations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const allDonations = await base44.entities.Donation.filter({ 
                donor_email: user.email,
                recurring: true
            });

            const activeRecurring = allDonations.filter(d => 
                d.stripe_subscription_id && d.subscription_status === 'active'
            );

            // Get unique subscriptions
            const subscriptionMap = {};
            activeRecurring.forEach(d => {
                if (!subscriptionMap[d.stripe_subscription_id]) {
                    subscriptionMap[d.stripe_subscription_id] = d;
                }
            });

            setRecurringDonations(Object.values(subscriptionMap));
        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setIsLoading(false);
    };

    const handlePauseSubscription = async (subscription) => {
        if (!confirm("Pause this recurring donation? You can resume it later.")) return;

        setProcessingAction(subscription.stripe_subscription_id);
        try {
            await base44.functions.invoke('manageRecurringDonation', {
                subscription_id: subscription.stripe_subscription_id,
                action: 'pause'
            });

            alert("Subscription paused successfully!");
            loadData();
        } catch (error) {
            console.error("Failed to pause:", error);
            alert("Failed to pause subscription. Please try again.");
        }
        setProcessingAction(null);
    };

    const handleResumeSubscription = async (subscription) => {
        setProcessingAction(subscription.stripe_subscription_id);
        try {
            await base44.functions.invoke('manageRecurringDonation', {
                subscription_id: subscription.stripe_subscription_id,
                action: 'resume'
            });

            alert("Subscription resumed successfully!");
            loadData();
        } catch (error) {
            console.error("Failed to resume:", error);
            alert("Failed to resume subscription. Please try again.");
        }
        setProcessingAction(null);
    };

    const handleCancelSubscription = async (subscription) => {
        if (!confirm("Cancel this recurring donation? This cannot be undone.")) return;

        setProcessingAction(subscription.stripe_subscription_id);
        try {
            await base44.functions.invoke('manageRecurringDonation', {
                subscription_id: subscription.stripe_subscription_id,
                action: 'cancel'
            });

            alert("Subscription cancelled successfully.");
            loadData();
        } catch (error) {
            console.error("Failed to cancel:", error);
            alert("Failed to cancel subscription. Please try again.");
        }
        setProcessingAction(null);
    };

    const handleUpdatePaymentMethod = async (subscription) => {
        setProcessingAction(subscription.stripe_subscription_id);
        try {
            const response = await base44.functions.invoke('createPaymentUpdateSession', {
                subscription_id: subscription.stripe_subscription_id
            });

            if (response.data?.portal_url) {
                window.location.href = response.data.portal_url;
            }
        } catch (error) {
            console.error("Failed to update payment:", error);
            alert("Failed to open payment update portal. Please try again.");
        }
        setProcessingAction(null);
    };

    const frequencyLabels = {
        weekly: 'Weekly',
        monthly: 'Monthly',
        annually: 'Annually'
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Heart className="w-8 h-8 text-red-500" />
                        Manage Recurring Donations
                    </h1>
                    <p className="text-slate-600 mt-1">
                        View and manage your recurring gifts
                    </p>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="w-5 h-5 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <p className="font-semibold mb-1">Thank you for your faithful giving!</p>
                        <p className="text-sm">You can pause, resume, or update your recurring donations at any time.</p>
                    </AlertDescription>
                </Alert>

                {recurringDonations.length === 0 ? (
                    <Card className="shadow-lg">
                        <CardContent className="p-12 text-center">
                            <Heart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-600 mb-2">No active recurring donations</p>
                            <p className="text-sm text-slate-500 mb-4">
                                Set up a recurring donation to support our ministry regularly
                            </p>
                            <Button 
                                onClick={() => window.location.href = '/PublicGiving'}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Heart className="w-4 h-4 mr-2" />
                                Start Recurring Giving
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {recurringDonations.map(donation => (
                            <Card key={donation.id} className="shadow-lg hover:shadow-xl transition-all">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">
                                                ${donation.amount.toFixed(2)} {frequencyLabels[donation.recurring_frequency]}
                                            </CardTitle>
                                            <p className="text-sm text-slate-600 mt-1 capitalize">
                                                {donation.donation_type.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                        <Badge className={
                                            donation.subscription_status === 'active' 
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }>
                                            {donation.subscription_status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Started: {format(new Date(donation.donation_date), 'MMM d, yyyy')}</span>
                                        </div>
                                        {donation.next_donation_date && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>Next: {format(new Date(donation.next_donation_date), 'MMM d, yyyy')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                                        <Button
                                            onClick={() => handleUpdatePaymentMethod(donation)}
                                            disabled={processingAction === donation.stripe_subscription_id}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Update Payment
                                        </Button>

                                        {donation.subscription_status === 'active' ? (
                                            <Button
                                                onClick={() => handlePauseSubscription(donation)}
                                                disabled={processingAction === donation.stripe_subscription_id}
                                                variant="outline"
                                                size="sm"
                                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                            >
                                                {processingAction === donation.stripe_subscription_id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Pause className="w-4 h-4 mr-2" />
                                                )}
                                                Pause
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleResumeSubscription(donation)}
                                                disabled={processingAction === donation.stripe_subscription_id}
                                                variant="outline"
                                                size="sm"
                                                className="text-green-600 border-green-300 hover:bg-green-50"
                                            >
                                                {processingAction === donation.stripe_subscription_id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Play className="w-4 h-4 mr-2" />
                                                )}
                                                Resume
                                            </Button>
                                        )}

                                        <Button
                                            onClick={() => handleCancelSubscription(donation)}
                                            disabled={processingAction === donation.stripe_subscription_id}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                        >
                                            {processingAction === donation.stripe_subscription_id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}