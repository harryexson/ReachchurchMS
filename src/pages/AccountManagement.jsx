import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "../components/subscription/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    CreditCard, Calendar, DollarSign, Check, Crown, TrendingUp, 
    AlertCircle, RefreshCw, Shield, Zap, Globe, ExternalLink 
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function AccountManagementPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [churchSettings, setChurchSettings] = useState(null);
    const [customDomain, setCustomDomain] = useState("");
    const [userLoading, setUserLoading] = useState(true);

    // CRITICAL: Call all hooks before any conditional returns
    const { 
        subscription, 
        features, 
        loading: subscriptionLoading, 
        getPlanName, 
        getPlanPrice,
        isTrialActive,
        refresh,
        lastRefresh
    } = useSubscription();

    useEffect(() => {
        const loadData = async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
                
                if (user && user.role === 'admin') {
                    // CRITICAL: Filter by created_by to ensure data isolation between churches
                    const settings = await base44.entities.ChurchSettings.filter({
                        created_by: user.email
                    });
                    if (settings.length > 0) {
                        setChurchSettings(settings[0]);
                        setCustomDomain(settings[0].custom_domain || "");
                    }
                }
            } catch (error) {
                console.error('Error loading user:', error);
            } finally {
                setUserLoading(false);
            }
        };
        loadData();
    }, []);

    const handleRefreshSubscription = async () => {
        setIsRefreshing(true);
        try {
            await refresh();
            alert('Subscription refreshed! Your new features are now available.');
        } catch (error) {
            console.error('Refresh error:', error);
            alert('Failed to refresh subscription. Please try again.');
        }
        setIsRefreshing(false);
    };

    const planIcons = {
        starter: Shield,
        growth: TrendingUp,
        premium: Crown
    };

    const PlanIcon = subscription ? planIcons[subscription.subscription_tier] : Shield;

    if (userLoading || subscriptionLoading) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                        <p className="text-slate-600">Loading your account...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Only admins can access this page
    if (currentUser && currentUser.role !== 'admin') {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <Alert className="border-yellow-200 bg-yellow-50 mt-8">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-900">
                            Account management is only available to administrators. Please contact your church administrator for subscription information.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Account Management</h1>
                    <p className="text-slate-600 mt-1">Manage your subscription and billing</p>
                </div>

                {/* Refresh Alert */}
                {subscription && (
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="flex items-center justify-between">
                            <span className="text-sm text-blue-900">
                                Last updated: {new Date(lastRefresh).toLocaleTimeString()}
                            </span>
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={handleRefreshSubscription}
                                disabled={isRefreshing}
                                className="ml-4"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Current Plan */}
                <Card className="shadow-xl border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                {PlanIcon && <PlanIcon className="w-6 h-6" />}
                                Current Plan: {getPlanName()}
                            </span>
                            {isTrialActive() && (
                                <Badge className="bg-yellow-400 text-yellow-900">
                                    Trial Active
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {subscription ? (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Status</span>
                                    <Badge className={
                                        subscription.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : subscription.status === 'trial'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                    }>
                                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Plan Tier</span>
                                    <span className="font-semibold text-slate-900">{getPlanName()}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Monthly Price</span>
                                    <span className="font-semibold text-slate-900">${getPlanPrice()}</span>
                                </div>

                                {subscription.next_billing_date && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Next Billing Date</span>
                                        <span className="font-semibold text-slate-900">
                                            {new Date(subscription.next_billing_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}

                                {isTrialActive() && subscription.trial_end_date && (
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-sm text-yellow-800">
                                            Your trial ends on {new Date(subscription.trial_end_date).toLocaleDateString()}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="pt-4 space-y-2">
                                    <Link to={createPageUrl('SubscriptionPlans')}>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                            <Zap className="w-4 h-4 mr-2" />
                                            Upgrade Plan
                                        </Button>
                                    </Link>
                                    
                                    <Button 
                                        variant="outline" 
                                        className="w-full"
                                        onClick={handleRefreshSubscription}
                                        disabled={isRefreshing}
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        {isRefreshing ? 'Refreshing...' : 'Sync Subscription'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-600 mb-4">You don't have an active subscription</p>
                                <Link to={createPageUrl('SubscriptionPlans')}>
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        View Plans
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Feature Access */}
                {features && (
                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle>Your Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FeatureItem 
                                    enabled={features.sms_enabled} 
                                    label="SMS Messaging"
                                    details={features.sms_enabled ? `${features.sms_monthly_limit === 999999 ? 'Unlimited' : features.sms_monthly_limit + '/month'}` : null}
                                />
                                <FeatureItem 
                                    enabled={features.mms_enabled} 
                                    label="MMS Campaigns"
                                    details={features.mms_enabled ? `${features.mms_monthly_limit === 999999 ? 'Unlimited' : features.mms_monthly_limit + '/month'}` : null}
                                />
                                <FeatureItem 
                                    enabled={features.video_enabled} 
                                    label="Video Meetings"
                                    details={features.video_enabled ? `Up to ${features.video_max_participants} participants` : null}
                                />
                                <FeatureItem enabled={features.kids_checkin_enabled} label="Kids Check-In" />
                                <FeatureItem enabled={features.kiosk_giving_enabled} label="Kiosk Giving" />
                                <FeatureItem enabled={features.coffee_shop_enabled} label="Coffee Shop" />
                                <FeatureItem enabled={features.bookstore_enabled} label="Bookstore" />
                                <FeatureItem enabled={features.financial_management_enabled} label="Financial Management" />
                                <FeatureItem enabled={features.visitor_followup_enabled} label="Visitor Follow-Up" />
                                <FeatureItem enabled={features.automated_workflows_enabled} label="Automated Workflows" />
                                <FeatureItem enabled={features.advanced_analytics_enabled} label="Advanced Analytics" />
                                <FeatureItem enabled={features.priority_support} label="Priority Support" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Custom Domain */}
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Custom Domain
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {features?.custom_domain ? (
                            <>
                                <p className="text-sm text-slate-600">
                                    Publish your church app on your own custom domain
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="church.example.com"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                    />
                                    <Button 
                                        onClick={async () => {
                                            if (churchSettings) {
                                                await base44.entities.ChurchSettings.update(churchSettings.id, {
                                                    custom_domain: customDomain
                                                });
                                                alert('Custom domain saved! Contact support to complete DNS setup.');
                                            }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Save
                                    </Button>
                                </div>
                                {customDomain && (
                                    <Alert className="bg-blue-50 border-blue-200">
                                        <AlertCircle className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-sm text-blue-900">
                                            <p className="font-semibold mb-2">Next Steps:</p>
                                            <ol className="list-decimal list-inside space-y-1">
                                                <li>Add a CNAME record pointing to: <code className="bg-blue-100 px-1 py-0.5 rounded">app.reachconnect.com</code></li>
                                                <li>Contact support to verify and activate your domain</li>
                                                <li>Your app will be available at: <code className="bg-blue-100 px-1 py-0.5 rounded">{customDomain}</code></li>
                                            </ol>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                                <Globe className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                <p className="text-slate-600 mb-4">Custom domain is available on Premium plans</p>
                                <Link to={createPageUrl('SubscriptionPlans')}>
                                    <Button className="bg-purple-600 hover:bg-purple-700">
                                        <Crown className="w-4 h-4 mr-2" />
                                        Upgrade to Premium
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upgrade Prompt */}
                {subscription && subscription.subscription_tier !== 'premium' && (
                    <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl">
                        <CardContent className="p-6">
                            <h3 className="text-2xl font-bold mb-2">Ready for More?</h3>
                            <p className="mb-4 text-purple-100">
                                Upgrade to unlock unlimited features and premium support.
                            </p>
                            <Link to={createPageUrl('SubscriptionPlans')}>
                                <Button className="bg-white text-purple-600 hover:bg-purple-50">
                                    <Crown className="w-4 h-4 mr-2" />
                                    Explore Premium Plans
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function FeatureItem({ enabled, label, details }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
            {enabled ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
                <AlertCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />
            )}
            <div className="flex-1">
                <span className={enabled ? 'text-slate-900' : 'text-slate-400'}>
                    {label}
                </span>
                {details && (
                    <p className="text-xs text-slate-500">{details}</p>
                )}
            </div>
        </div>
    );
}