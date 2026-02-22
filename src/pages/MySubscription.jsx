import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, 
    CreditCard, 
    Receipt, 
    Tag, 
    TrendingUp, 
    TrendingDown,
    CheckCircle,
    AlertCircle,
    Clock,
    DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';

export default function MySubscription() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [accountActions, setAccountActions] = useState([]);
    const [pricingPlans, setPricingPlans] = useState([]);
    const [updatingPayment, setUpdatingPayment] = useState(false);

    useEffect(() => {
        loadSubscriptionData();
    }, []);

    const loadSubscriptionData = async () => {
        try {
            setLoading(true);
            
            // Get current user
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            // Only admins have subscriptions
            if (currentUser.role !== 'admin') {
                setLoading(false);
                return;
            }

            // Load subscription
            const subs = await base44.entities.Subscription.filter({
                church_admin_email: currentUser.email
            });

            if (subs.length > 0) {
                setSubscription(subs[0]);

                // Load invoices for this customer
                if (subs[0].stripe_customer_id) {
                    const invs = await base44.entities.Invoice.filter({
                        customer_id: subs[0].stripe_customer_id
                    });
                    setInvoices(invs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
                }

                // Load account actions (discounts, etc.)
                const actions = await base44.entities.AccountAction.filter({
                    subscription_id: subs[0].id
                });
                setAccountActions(actions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
            }

            // Load available pricing plans
            const plans = await base44.entities.PricingPlan.filter({ is_active: true });
            setPricingPlans(plans.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePaymentMethod = async () => {
        try {
            setUpdatingPayment(true);
            
            const response = await base44.functions.invoke('createBillingPortalSession', {
                return_url: window.location.href
            });

            if (response.data?.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Error creating billing portal session:', error);
            alert('Failed to open billing portal. Please try again.');
        } finally {
            setUpdatingPayment(false);
        }
    };

    const handleChangePlan = async (planTier, billingCycle) => {
        if (!confirm(`Are you sure you want to change to ${planTier} (${billingCycle})? This will update your subscription immediately.`)) {
            return;
        }

        try {
            const plan = pricingPlans.find(p => p.plan_name === planTier);
            const priceId = billingCycle === 'annual' ? plan.stripe_annual_price_id : plan.stripe_monthly_price_id;

            const response = await base44.functions.invoke('createCheckoutSession', {
                priceId: priceId,
                planName: planTier,
                successUrl: window.location.href + '?success=true',
                cancelUrl: window.location.href,
                metadata: {
                    plan_tier: planTier,
                    billing_cycle: billingCycle,
                    church_name: subscription.church_name
                }
            });

            if (response.data?.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (error) {
            console.error('Error changing plan:', error);
            alert('Failed to change plan. Please try again.');
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            trial: { color: 'bg-blue-100 text-blue-800', icon: Clock },
            past_due: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
            cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
            suspended: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
        };
        const { color, icon: Icon } = config[status] || config.cancelled;
        return (
            <Badge className={color}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Alert>
                    <AlertDescription>
                        Subscription management is only available for church administrators.
                        Members are covered under their church's subscription.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>No Active Subscription</CardTitle>
                        <CardDescription>
                            You don't have an active subscription yet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.href = createPageUrl('SubscriptionPlans')}>
                            View Plans
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const hasDiscount = subscription.discount_percentage > 0;
    const originalPrice = subscription.monthly_price;
    const effectivePrice = subscription.effective_monthly_price || originalPrice;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Subscription</h1>
                <p className="text-gray-600 mt-1">Manage your subscription and billing</p>
            </div>

            {/* Current Plan Overview */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{subscription.church_name}</CardTitle>
                            <CardDescription className="mt-2">
                                {subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1)} Plan
                                {' • '}
                                {subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)} Billing
                            </CardDescription>
                        </div>
                        {getStatusBadge(subscription.status)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">Current Price</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                ${effectivePrice.toFixed(2)}
                                <span className="text-sm font-normal text-gray-500">/{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>
                            {hasDiscount && (
                                <div className="text-xs text-gray-500 line-through mt-1">
                                    Was ${originalPrice.toFixed(2)}
                                </div>
                            )}
                        </div>

                        {subscription.next_billing_date && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Next Billing Date</div>
                                <div className="text-lg font-semibold text-gray-900 mt-1">
                                    {format(new Date(subscription.next_billing_date), 'MMM dd, yyyy')}
                                </div>
                            </div>
                        )}

                        {subscription.trial_end_date && subscription.status === 'trial' && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm text-blue-600">Trial Ends</div>
                                <div className="text-lg font-semibold text-blue-900 mt-1">
                                    {format(new Date(subscription.trial_end_date), 'MMM dd, yyyy')}
                                </div>
                            </div>
                        )}
                    </div>

                    {hasDiscount && (
                        <Alert className="bg-green-50 border-green-200">
                            <Tag className="w-4 h-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                <strong>{subscription.discount_percentage}% Discount Applied</strong>
                                {subscription.discount_reason && (
                                    <span className="block text-sm mt-1">{subscription.discount_reason}</span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                        <Button onClick={handleUpdatePaymentMethod} disabled={updatingPayment}>
                            {updatingPayment ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Opening...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Update Payment Method
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for different sections */}
            <Tabs defaultValue="billing" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="billing">
                        <Receipt className="w-4 h-4 mr-2" />
                        Billing History
                    </TabsTrigger>
                    <TabsTrigger value="plans">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Change Plan
                    </TabsTrigger>
                    <TabsTrigger value="discounts">
                        <Tag className="w-4 h-4 mr-2" />
                        Discounts
                    </TabsTrigger>
                </TabsList>

                {/* Billing History Tab */}
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice History</CardTitle>
                            <CardDescription>View all your past invoices and payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {invoices.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No invoices yet
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice Date</TableHead>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell>
                                                    {format(new Date(invoice.created_date), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {invoice.invoice_number || 'N/A'}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    ${invoice.amount_due?.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        invoice.status === 'paid' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : invoice.status === 'open'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }>
                                                        {invoice.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Change Plan Tab */}
                <TabsContent value="plans">
                    <div className="space-y-4">
                        {pricingPlans.map((plan) => {
                            const isCurrent = plan.plan_name === subscription.subscription_tier;
                            const isUpgrade = ['starter', 'growth', 'premium'].indexOf(plan.plan_name) > 
                                            ['starter', 'growth', 'premium'].indexOf(subscription.subscription_tier);
                            
                            return (
                                <Card key={plan.id} className={isCurrent ? 'border-2 border-blue-500' : ''}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    {plan.display_name}
                                                    {isCurrent && (
                                                        <Badge className="bg-blue-100 text-blue-800">Current Plan</Badge>
                                                    )}
                                                </CardTitle>
                                                <CardDescription className="mt-2">
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        ${plan.monthly_price}
                                                    </span>
                                                    <span className="text-gray-600">/month</span>
                                                    {plan.annual_price && (
                                                        <span className="ml-4 text-sm">
                                                            or ${plan.annual_price}/year
                                                        </span>
                                                    )}
                                                </CardDescription>
                                            </div>
                                            {!isCurrent && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleChangePlan(plan.plan_name, 'monthly')}
                                                        variant={isUpgrade ? 'default' : 'outline'}
                                                    >
                                                        {isUpgrade ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                                                        Switch to Monthly
                                                    </Button>
                                                    {plan.annual_price && (
                                                        <Button
                                                            onClick={() => handleChangePlan(plan.plan_name, 'annual')}
                                                            variant={isUpgrade ? 'default' : 'outline'}
                                                        >
                                                            Switch to Annual
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                            <div>👥 {plan.features?.member_limit || 0} members</div>
                                            <div>📱 {plan.features?.sms_monthly_limit || 0} SMS/month</div>
                                            <div>📹 {plan.features?.video_max_participants || 0} video participants</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Discounts Tab */}
                <TabsContent value="discounts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Discount History</CardTitle>
                            <CardDescription>All discounts applied to your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {hasDiscount && (
                                <Alert className="mb-4 bg-green-50 border-green-200">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        <div className="font-semibold">Active Discount: {subscription.discount_percentage}% off</div>
                                        {subscription.discount_reason && (
                                            <div className="text-sm mt-1">{subscription.discount_reason}</div>
                                        )}
                                        <div className="text-sm mt-2">
                                            You're saving ${(originalPrice - effectivePrice).toFixed(2)} per {subscription.billing_cycle === 'monthly' ? 'month' : 'year'}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {accountActions.filter(a => a.action_type?.includes('discount')).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No discount history
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {accountActions
                                            .filter(a => a.action_type?.includes('discount'))
                                            .map((action) => (
                                                <TableRow key={action.id}>
                                                    <TableCell>
                                                        {format(new Date(action.created_date), 'MMM dd, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge>
                                                            {action.action_type.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-md">
                                                        {action.notes}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}