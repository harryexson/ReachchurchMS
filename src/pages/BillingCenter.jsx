
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import { Subscription } from "@/entities/Subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, DollarSign, Calendar, AlertTriangle, CheckCircle, Loader2, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, isAfter } from "date-fns";

export default function BillingCenterPage() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthAndLoadData = async () => {
            try {
                const user = await User.me();
                // ULTRA-STRICT ACCESS CONTROL: Only actual platform developers can access
                const isPlatformDeveloper = user.role === 'admin' && 
                                          user.email && 
                                          (user.email.includes('@reachtech.dev') || 
                                           user.email.includes('@platformdev.com') ||
                                           user.developer_access === true);
                
                if (!isPlatformDeveloper) {
                    console.warn("SECURITY ALERT: Unauthorized access attempt to Billing Center by:", user.email, "Role:", user.role);
                    navigate(createPageUrl('Dashboard'));
                    return;
                }
                setIsAuthorized(true);
                loadSubscriptions();
            } catch (error) {
                console.error("Authorization check failed:", error);
                navigate(createPageUrl('Dashboard'));
            }
        };
        checkAuthAndLoadData();
    }, [navigate]);

    const loadSubscriptions = async () => {
        setIsLoading(true);
        const subscriptionsList = await Subscription.list("-created_date");
        setSubscriptions(subscriptionsList);
        setIsLoading(false);
    };

    const processPayment = async (subscriptionId, amount) => {
        setProcessingPayment(subscriptionId);
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update subscription status and next billing date
        const subscription = subscriptions.find(s => s.id === subscriptionId);
        // Ensure subscription is found before proceeding
        if (!subscription) {
            console.error("Subscription not found for payment processing:", subscriptionId);
            setProcessingPayment(null);
            alert("Payment failed: Subscription not found.");
            return;
        }

        const nextBillingDate = addDays(new Date(), subscription.billing_cycle === 'monthly' ? 30 : 365);
        
        await Subscription.update(subscriptionId, {
            status: "active",
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
            notes: `Payment of $${amount} processed on ${format(new Date(), 'MMMM d, yyyy')}`
        });

        await loadSubscriptions();
        setProcessingPayment(null);
        alert(`Payment of $${amount} processed successfully!`);
    };

    const overdueSubscriptions = subscriptions.filter(sub => 
        sub.status === 'past_due' && isAfter(new Date(), new Date(sub.next_billing_date))
    );

    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const trialSubscriptions = subscriptions.filter(sub => sub.status === 'trial');

    const totalMRR = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + (sub.monthly_price || 0), 0);
    
    if (!isAuthorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <CreditCard className="h-16 w-16 text-red-500" />
                    <h2 className="text-2xl font-bold text-slate-900">Billing Access Restricted</h2>
                    <p className="text-slate-600">Billing Center is exclusively for platform developers.</p>
                    <p className="text-sm text-slate-500">Churches manage their own billing through their dashboard.</p>
                    <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
                        Return to Church Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Platform Billing Center</h1>
                        <p className="text-slate-600 mt-1">Manage payments, subscriptions, and billing operations.</p>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium">Developer Tool</span>
                            <span className="text-slate-500">• Platform billing management</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Monthly Recurring Revenue</p>
                                    <p className="text-2xl font-bold text-slate-900">${totalMRR.toLocaleString()}</p>
                                </div>
                                <DollarSign className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Active Subscriptions</p>
                                    <p className="text-2xl font-bold text-slate-900">{activeSubscriptions.length}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Overdue Accounts</p>
                                    <p className="text-2xl font-bold text-slate-900">{overdueSubscriptions.length}</p>
                                </div>
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Trial Accounts</p>
                                    <p className="text-2xl font-bold text-slate-900">{trialSubscriptions.length}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="overdue" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overdue">Overdue Payments</TabsTrigger>
                        <TabsTrigger value="active">Active Subscriptions</TabsTrigger>
                        <TabsTrigger value="trials">Trial Accounts</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overdue">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    Overdue Payments - Action Required
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {overdueSubscriptions.map(subscription => (
                                        <Card key={subscription.id} className="border-red-200 bg-red-50">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2">
                                                        <h3 className="font-semibold text-lg">{subscription.church_name}</h3>
                                                        <p className="text-slate-600">{subscription.church_admin_email}</p>
                                                        <div className="flex items-center gap-4">
                                                            <Badge className="bg-red-100 text-red-800">
                                                                ${subscription.monthly_price} Overdue
                                                            </Badge>
                                                            <span className="text-sm text-slate-500">
                                                                Due: {format(new Date(subscription.next_billing_date), 'MMM d, yyyy')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Button 
                                                            onClick={() => processPayment(subscription.id, subscription.monthly_price)}
                                                            disabled={processingPayment === subscription.id}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            {processingPayment === subscription.id ? (
                                                                <>Processing...</>
                                                            ) : (
                                                                <>
                                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                                    Process Payment
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button variant="outline" size="sm">
                                                            Contact Church
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {overdueSubscriptions.length === 0 && (
                                        <div className="text-center py-12 text-slate-500">
                                            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                                            <p className="text-lg font-semibold">All Caught Up!</p>
                                            <p>No overdue payments at this time.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="active">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Active Subscriptions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {activeSubscriptions.map(subscription => (
                                        <div key={subscription.id} className="p-4 rounded-lg border border-green-200 bg-green-50">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-semibold">{subscription.church_name}</h3>
                                                    <p className="text-sm text-slate-600">{subscription.church_admin_email}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <Badge className="bg-green-100 text-green-800 capitalize">
                                                            {subscription.subscription_tier} Plan
                                                        </Badge>
                                                        <span className="text-sm text-slate-500">
                                                            ${subscription.monthly_price}/{subscription.billing_cycle}
                                                        </span>
                                                        <span className="text-sm text-slate-500">
                                                            Next billing: {format(new Date(subscription.next_billing_date), 'MMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="trials">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Trial Accounts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {trialSubscriptions.map(subscription => (
                                        <div key={subscription.id} className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-semibold">{subscription.church_name}</h3>
                                                    <p className="text-sm text-slate-600">{subscription.church_admin_email}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <Badge className="bg-blue-100 text-blue-800">
                                                            Trial Account
                                                        </Badge>
                                                        {subscription.trial_end_date && (
                                                            <span className="text-sm text-slate-500">
                                                                Ends: {format(new Date(subscription.trial_end_date), 'MMM d, yyyy')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button variant="outline">
                                                    Follow Up
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
