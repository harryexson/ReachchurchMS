import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Feature definitions for each plan
const PLAN_FEATURES = {
    starter: {
        member_limit: 100,
        sms_enabled: false,
        sms_monthly_limit: 0,
        mms_enabled: false,
        mms_monthly_limit: 0,
        video_enabled: false,
        video_max_participants: 0,
        breakout_rooms_enabled: false,
        recording_enabled: false,
        kids_checkin_enabled: true,
        kiosk_giving_enabled: true,
        coffee_shop_enabled: false,
        bookstore_enabled: false,
        automated_workflows_enabled: false,
        visitor_followup_enabled: false,
        giving_thankyou_enabled: false,
        tax_statements_enabled: true,
        advanced_analytics_enabled: false,
        financial_management_enabled: true,
        multi_campus: false,
        white_label: false,
        api_access: false,
        custom_branding_enabled: true,
        priority_support: false,
        dedicated_account_manager: false
    },
    growth: {
        member_limit: 500,
        sms_enabled: true,
        sms_monthly_limit: 1000,
        mms_enabled: true,
        mms_monthly_limit: 10,
        video_enabled: true,
        video_max_participants: 25,
        breakout_rooms_enabled: false,
        recording_enabled: false,
        kids_checkin_enabled: true,
        kiosk_giving_enabled: true,
        coffee_shop_enabled: true,
        bookstore_enabled: true,
        automated_workflows_enabled: true,
        visitor_followup_enabled: true,
        giving_thankyou_enabled: true,
        tax_statements_enabled: true,
        advanced_analytics_enabled: true,
        financial_management_enabled: true,
        multi_campus: false,
        white_label: false,
        api_access: false,
        custom_branding_enabled: true,
        priority_support: true,
        dedicated_account_manager: false
    },
    premium: {
        member_limit: 999999,
        sms_enabled: true,
        sms_monthly_limit: 999999,
        mms_enabled: true,
        mms_monthly_limit: 999999,
        video_enabled: true,
        video_max_participants: 200,
        breakout_rooms_enabled: true,
        recording_enabled: true,
        kids_checkin_enabled: true,
        kiosk_giving_enabled: true,
        coffee_shop_enabled: true,
        bookstore_enabled: true,
        automated_workflows_enabled: true,
        visitor_followup_enabled: true,
        giving_thankyou_enabled: true,
        tax_statements_enabled: true,
        advanced_analytics_enabled: true,
        financial_management_enabled: true,
        multi_campus: true,
        white_label: true,
        api_access: true,
        custom_branding_enabled: true,
        priority_support: true,
        dedicated_account_manager: true
    }
};

export function useSubscription() {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [features, setFeatures] = useState(PLAN_FEATURES.starter); // Default to starter features
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadSubscription = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const user = await base44.auth.me();
            
            if (!user || !user.email) {
                console.warn('[useSubscription] No authenticated user');
                // Set default starter features for unauthenticated users
                setFeatures(PLAN_FEATURES.starter);
                setLoading(false);
                return;
            }

            // Try to find subscription
            let subscriptions = [];
            try {
                subscriptions = await base44.entities.Subscription.filter({
                    church_admin_email: user.email
                });
            } catch (subError) {
                console.warn('[useSubscription] Could not fetch subscriptions (entity may not exist yet):', subError.message);
                // If Subscription entity doesn't exist yet, create a trial subscription
                try {
                    const newSub = await base44.entities.Subscription.create({
                        church_name: user.church_name || user.full_name || 'My Church',
                        church_admin_email: user.email,
                        subscription_tier: 'growth',
                        billing_cycle: 'monthly',
                        monthly_price: 149,
                        status: 'trial',
                        trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                        member_count: 0,
                        features: PLAN_FEATURES.growth
                    });
                    subscriptions = [newSub];
                    console.log('[useSubscription] Created trial subscription:', newSub);
                } catch (createError) {
                    console.error('[useSubscription] Could not create trial subscription:', createError);
                    // Fall back to starter features
                    setFeatures(PLAN_FEATURES.starter);
                    setLoading(false);
                    return;
                }
            }

            if (subscriptions && subscriptions.length > 0) {
                // Get the most recent active or trial subscription
                const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'trial');
                const sub = activeSub || subscriptions[0];
                
                setSubscription(sub);

                // Get plan features
                const planFeatures = PLAN_FEATURES[sub.subscription_tier] || PLAN_FEATURES.starter;
                
                // Merge with custom features from subscription if any
                const customFeatures = sub.features || {};
                
                // Get active add-ons features
                const addOnFeatures = {};
                if (sub.active_addons && Array.isArray(sub.active_addons)) {
                    sub.active_addons.forEach(addon => {
                        if (addon.features) {
                            Object.assign(addOnFeatures, addon.features);
                        }
                    });
                }

                // Merge: plan base + custom overrides + add-ons
                const mergedFeatures = {
                    ...planFeatures,
                    ...customFeatures,
                    ...addOnFeatures
                };

                setFeatures(mergedFeatures);
                
                console.log('[useSubscription] Loaded subscription:', {
                    tier: sub.subscription_tier,
                    status: sub.status,
                    features: mergedFeatures
                });
            } else {
                // No subscription found - create a default trial
                console.log('[useSubscription] No subscription found, creating trial...');
                try {
                    const newSub = await base44.entities.Subscription.create({
                        church_name: user.church_name || user.full_name || 'My Church',
                        church_admin_email: user.email,
                        subscription_tier: 'growth',
                        billing_cycle: 'monthly',
                        monthly_price: 149,
                        status: 'trial',
                        trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                        member_count: 0,
                        features: PLAN_FEATURES.growth
                    });
                    setSubscription(newSub);
                    setFeatures(PLAN_FEATURES.growth);
                    console.log('[useSubscription] Created new trial subscription');
                } catch (createError) {
                    console.error('[useSubscription] Failed to create trial:', createError);
                    setFeatures(PLAN_FEATURES.starter);
                }
            }
        } catch (err) {
            console.error('[useSubscription] Error loading subscription:', err);
            setError(err.message || 'Failed to load subscription');
            // Set default starter features on error
            setFeatures(PLAN_FEATURES.starter);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    // Helper functions
    const hasFeature = (featureName) => {
        return features[featureName] === true || features[featureName] > 0;
    };

    const getFeatureLimit = (featureName) => {
        return features[featureName] || 0;
    };

    const getPlanName = () => {
        if (!subscription) return 'Starter (Trial)';
        const tier = subscription.subscription_tier || 'starter';
        const displayName = tier.charAt(0).toUpperCase() + tier.slice(1);
        
        if (subscription.status === 'trial') {
            return `${displayName} (Trial)`;
        }
        return displayName;
    };

    const getPlanPrice = () => {
        if (!subscription) return 0;
        return subscription.billing_cycle === 'monthly' 
            ? subscription.monthly_price 
            : subscription.annual_price;
    };

    const isTrialActive = () => {
        if (!subscription) return false;
        if (subscription.status !== 'trial') return false;
        
        const trialEnd = new Date(subscription.trial_end_date);
        return new Date() < trialEnd;
    };

    const getDaysLeftInTrial = () => {
        if (!subscription || subscription.status !== 'trial') return 0;
        
        const trialEnd = new Date(subscription.trial_end_date);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysLeft);
    };

    // Feature-specific helpers
    const canUseSMS = () => hasFeature('sms_enabled');
    const canUseMMS = () => hasFeature('mms_enabled');
    const canUseVideo = () => hasFeature('video_enabled');
    const canUseKidsCheckin = () => hasFeature('kids_checkin_enabled');
    const canUseKioskGiving = () => hasFeature('kiosk_giving_enabled');
    const canUseCoffeeShop = () => hasFeature('coffee_shop_enabled');
    const canUseBookstore = () => hasFeature('bookstore_enabled');

    const getSMSRemaining = () => {
        if (!subscription || !features.sms_enabled) return 0;
        const limit = features.sms_monthly_limit || 0;
        const used = subscription.features?.sms_used_this_month || 0;
        return Math.max(0, limit - used);
    };

    const getMMSRemaining = () => {
        if (!subscription || !features.mms_enabled) return 0;
        const limit = features.mms_monthly_limit || 0;
        const used = subscription.features?.mms_used_this_month || 0;
        return Math.max(0, limit - used);
    };

    const getVideoMaxParticipants = () => {
        return features.video_max_participants || 0;
    };

    const requiresPlanUpgrade = (featureName) => {
        if (!subscription) return 'growth';
        
        const currentTier = subscription.subscription_tier || 'starter';
        
        // Check if current plan has this feature
        if (hasFeature(featureName)) return null;
        
        // Check which plan has this feature
        if (PLAN_FEATURES.growth[featureName]) return 'growth';
        if (PLAN_FEATURES.premium[featureName]) return 'premium';
        
        return null;
    };

    const refresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return {
        subscription,
        features,
        loading,
        error,
        hasFeature,
        getFeatureLimit,
        getPlanName,
        getPlanPrice,
        isTrialActive,
        getDaysLeftInTrial,
        canUseSMS,
        canUseMMS,
        canUseVideo,
        canUseKidsCheckin,
        canUseKioskGiving,
        canUseCoffeeShop,
        canUseBookstore,
        getSMSRemaining,
        getMMSRemaining,
        getVideoMaxParticipants,
        requiresPlanUpgrade,
        refresh,
        lastRefresh: Date.now()
    };
}