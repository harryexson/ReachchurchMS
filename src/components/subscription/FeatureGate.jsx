import React from 'react';
import { useSubscription } from './useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, TrendingUp, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function FeatureGate({ 
    children, 
    feature, 
    featureName, 
    requiredPlan,
    showUpgradeCard = true 
}) {
    const { hasFeature, loading, getPlanName, requiresPlanUpgrade } = useSubscription();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    const canAccess = hasFeature(feature);

    if (canAccess) {
        return <>{children}</>;
    }

    if (!showUpgradeCard) {
        return null;
    }

    const neededPlan = requiresPlanUpgrade(feature);
    const currentPlan = getPlanName();

    const planDetails = {
        growth: {
            price: 129,
            name: 'Growth',
            color: 'from-blue-600 to-indigo-600',
            bgColor: 'from-blue-50 to-indigo-50',
            icon: TrendingUp
        },
        premium: {
            price: 249,
            name: 'Premium',
            color: 'from-purple-600 to-pink-600',
            bgColor: 'from-purple-50 to-pink-50',
            icon: Crown
        }
    };

    const plan = planDetails[neededPlan] || planDetails.growth;
    const Icon = plan.icon;

    return (
        <div className={`min-h-screen bg-gradient-to-br ${plan.bgColor} p-6 flex items-center justify-center`}>
            <Card className="max-w-3xl w-full shadow-2xl border-2">
                <CardHeader className={`bg-gradient-to-r ${plan.color} text-white py-8`}>
                    <div className="flex items-center justify-center mb-4">
                        <Lock className="w-16 h-16" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-center">
                        {featureName} is a {plan.name} Feature
                    </CardTitle>
                    <p className="text-center text-white/90 mt-2">
                        Upgrade to unlock this powerful feature for your church
                    </p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="text-center">
                        <Badge className={`bg-gradient-to-r ${plan.color} text-white px-4 py-2 text-lg`}>
                            <Icon className="w-5 h-5 mr-2" />
                            {plan.name} Plan - ${plan.price}/month
                        </Badge>
                        <p className="text-slate-600 mt-4">
                            You're currently on the <strong>{currentPlan}</strong> plan.
                        </p>
                    </div>

                    <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-slate-900 mb-4 text-lg">
                            🎯 What you'll get with {plan.name}:
                        </h3>
                        <div className="space-y-3">
                            {neededPlan === 'growth' && (
                                <>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">SMS Text Messaging (1,000/month)</p>
                                            <p className="text-sm text-slate-600">Send automated texts to your congregation</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">MMS Multimedia Campaigns (10/month)</p>
                                            <p className="text-sm text-slate-600">Send beautiful visual announcements</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Video Meetings (25 participants)</p>
                                            <p className="text-sm text-slate-600">Host virtual Bible studies and meetings</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Kids Check-In System</p>
                                            <p className="text-sm text-slate-600">Secure check-in/out with parent notifications</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Coffee Shop & Bookstore Kiosks</p>
                                            <p className="text-sm text-slate-600">Generate revenue with in-church sales</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Automated Visitor Follow-Up</p>
                                            <p className="text-sm text-slate-600">Never miss following up with visitors</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {neededPlan === 'premium' && (
                                <>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Unlimited SMS/MMS Messages</p>
                                            <p className="text-sm text-slate-600">No limits on communication</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Video Meetings (200 participants)</p>
                                            <p className="text-sm text-slate-600">Host large virtual gatherings</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Breakout Rooms & Recording</p>
                                            <p className="text-sm text-slate-600">Advanced meeting features</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Multi-Campus Support</p>
                                            <p className="text-sm text-slate-600">Manage multiple locations seamlessly</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">White-Label Branding</p>
                                            <p className="text-sm text-slate-600">Fully customize with your church's brand</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <ArrowRight className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Dedicated Account Manager</p>
                                            <p className="text-sm text-slate-600">Personal support for your church</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link to={createPageUrl('Dashboard')} className="flex-1">
                            <Button variant="outline" className="w-full h-12">
                                Back to Dashboard
                            </Button>
                        </Link>
                        <Link to={createPageUrl('SubscriptionPlans')} className="flex-1">
                            <Button className={`w-full h-12 bg-gradient-to-r ${plan.color} hover:opacity-90`}>
                                <Icon className="w-5 h-5 mr-2" />
                                Upgrade to {plan.name}
                            </Button>
                        </Link>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-slate-500">
                            ✨ 14-day free trial • Cancel anytime • No setup fees
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}