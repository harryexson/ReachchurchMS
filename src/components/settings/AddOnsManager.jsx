import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Subscription } from '@/entities/Subscription';
import { User } from '@/entities/User';
import { Check, Plus, Sparkles, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/functions/createCheckoutSession';

const AVAILABLE_ADDONS = [
    {
        id: 'extra_sms',
        name: 'Extra SMS Messages',
        price: 29,
        description: 'Add 1,000 additional SMS messages per month',
        forPlans: ['growth'],
        features: {
            sms_monthly_limit_addon: 1000
        }
    },
    {
        id: 'extra_video',
        name: 'Extra Video Capacity',
        price: 49,
        description: 'Increase to 50 participants per meeting',
        forPlans: ['growth'],
        features: {
            video_max_participants: 50
        }
    },
    {
        id: 'unlimited_mms',
        name: 'Unlimited MMS',
        price: 39,
        description: 'Unlimited multimedia campaigns',
        forPlans: ['growth'],
        features: {
            mms_monthly_limit: 999999
        }
    }
];

export default function AddOnsManager() {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        try {
            const user = await User.me();
            const subs = await Subscription.filter({ 
                church_admin_email: user.email,
                status: 'active'
            });

            if (subs.length > 0) {
                setSubscription(subs[0]);
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        }
        setLoading(false);
    };

    const handlePurchaseAddon = async (addon) => {
        setPurchasing(addon.id);

        try {
            const response = await createCheckoutSession({
                type: 'addon',
                amount: addon.price,
                addonId: addon.id,
                addonName: addon.name,
                successUrl: `${window.location.origin}/Settings?tab=subscription&addon_success=true`,
                cancelUrl: `${window.location.origin}/Settings?tab=subscription`,
                metadata: {
                    addon_id: addon.id,
                    addon_features: JSON.stringify(addon.features)
                }
            });

            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (error) {
            console.error('Error purchasing addon:', error);
            alert('Failed to start checkout. Please try again.');
        }

        setPurchasing(null);
    };

    const hasAddon = (addonId) => {
        if (!subscription || !subscription.active_addons) return false;
        return subscription.active_addons.some(a => a.addon_id === addonId);
    };

    const canUseAddon = (addon) => {
        if (!subscription) return false;
        return addon.forPlans.includes(subscription.subscription_tier);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-slate-600">No active subscription found. Please subscribe to a plan first.</p>
                </CardContent>
            </Card>
        );
    }

    const availableAddons = AVAILABLE_ADDONS.filter(addon => canUseAddon(addon));

    if (availableAddons.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Add-Ons</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600">
                        Your {subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1)} plan includes all features. 
                        No add-ons are available.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Available Add-Ons
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableAddons.map(addon => {
                        const active = hasAddon(addon.id);
                        
                        return (
                            <Card key={addon.id} className={active ? 'border-2 border-green-500' : ''}>
                                <CardContent className="p-6">
                                    {active && (
                                        <Badge className="mb-3 bg-green-100 text-green-800">
                                            <Check className="w-3 h-3 mr-1" />
                                            Active
                                        </Badge>
                                    )}
                                    
                                    <h3 className="font-semibold text-lg mb-2">{addon.name}</h3>
                                    <p className="text-2xl font-bold text-blue-600 mb-2">
                                        ${addon.price}
                                        <span className="text-sm text-slate-500">/month</span>
                                    </p>
                                    <p className="text-sm text-slate-600 mb-4">{addon.description}</p>
                                    
                                    {active ? (
                                        <Button variant="outline" disabled className="w-full">
                                            Currently Active
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={() => handlePurchaseAddon(addon)}
                                            disabled={purchasing === addon.id}
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                        >
                                            {purchasing === addon.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add to Plan
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                        💡 <strong>Tip:</strong> Add-ons are billed monthly alongside your subscription. 
                        You can cancel any add-on at any time from your billing portal.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}