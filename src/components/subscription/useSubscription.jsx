import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Feature definitions for each plan
const PLAN_FEATURES = {
    starter: {
        member_limit: 150,
        signalhouse_messaging_enabled: false,
        sms_enabled: false,
        sms_monthly_limit: 0,
        mms_enabled: false,
        mms_monthly_limit: 0,
        video_enabled: false,
        video_max_participants: 0,
        breakout_rooms_enabled: false,
        recording_enabled: false,
        kids_checkin_enabled: true,
        label_printing_enabled: false,
        kiosk_giving_enabled: true,
        coffee_shop_enabled: false,
        bookstore_enabled: false,
        inventory_management_enabled: false,
        automated_workflows_enabled: false,
        visitor_followup_enabled: false,
        giving_thankyou_enabled: false,
        tax_statements_enabled: true,
        advanced_analytics_enabled: false,
        financial_management_enabled: true,
        budget_tracking_enabled: false,
        expense_tracking_enabled: true,
        people_engagement_enabled: false,
        theme_customization_enabled: false,
        display_management_enabled: false,
        device_management_enabled: false,
        multi_campus: false,
        white_label: false,
        api_access: false,
        custom_domain: false,
        custom_branding_enabled: true,
        priority_support: false,
        phone_support: false,
        dedicated_account_manager: false
    },
    growth: {
        member_limit: 750,
        signalhouse_messaging_enabled: true,
        sms_enabled: true,
        sms_monthly_limit: 1000,
        mms_enabled: true,
        mms_monthly_limit: 10,
        video_enabled: true,
        video_max_participants: 25,
        breakout_rooms_enabled: false,
        recording_enabled: false,
        kids_checkin_enabled: true,
        label_printing_enabled: true,
        kiosk_giving_enabled: true,
        coffee_shop_enabled: true,
        bookstore_enabled: true,
        inventory_management_enabled: true,
        automated_workflows_enabled: true,
        visitor_followup_enabled: true,
        giving_thankyou_enabled: true,
        tax_statements_enabled: true,
        advanced_analytics_enabled: true,
        financial_management_enabled: true,
        budget_tracking_enabled: true,
        expense_tracking_enabled: true,
        people_engagement_enabled: true,
        theme_customization_enabled: true,
        display_management_enabled: true,
        device_management_enabled: true,
        multi_campus: false,
        white_label: false,
        api_access: false,
        custom_domain: false,
        custom_branding_enabled: true,
        priority_support: true,
        phone_support: false,
        dedicated_account_manager: false
    },
    premium: {
        member_limit: 999999,
        signalhouse_messaging_enabled: true,
        sms_enabled: true,
        sms_monthly_limit: 999999,
        mms_enabled: true,
        mms_monthly_limit: 999999,
        video_enabled: true,
        video_max_participants: 200,
        breakout_rooms_enabled: true,
        recording_enabled: true,
        kids_checkin_enabled: true,
        label_printing_enabled: true,
        kiosk_giving_enabled: true,
        coffee_shop_enabled: true,
        bookstore_enabled: true,
        inventory_management_enabled: true,
        automated_workflows_enabled: true,
        visitor_followup_enabled: true,
        giving_thankyou_enabled: true,
        tax_statements_enabled: true,
        advanced_analytics_enabled: true,
        financial_management_enabled: true,
        budget_tracking_enabled: true,
        expense_tracking_enabled: true,
        people_engagement_enabled: true,
        theme_customization_enabled: true,
        display_management_enabled: true,
        device_management_enabled: true,
        multi_campus: true,
        white_label: true,
        api_access: true,
        custom_domain: true,
        advanced_permissions: true,
        donor_development_tools: true,
        predictive_analytics: true,
        custom_branding_enabled: true,
        priority_support: true,
        phone_support: true,
        dedicated_account_manager: true
    }
};

export function useSubscription() {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [features, setFeatures] = useState(PLAN_FEATURES.starter); // Default to starter features
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    const loadSubscription = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            let user;
            try {
                user = await base44.auth.me();
            } catch (authError) {
                // Handle aborted requests gracefully
                if (authError.message && authError.message.includes('aborted')) {
                    console.log('[useSubscription] Request aborted, retrying...');
                    setLoading(false);
                    return;
                }
                console.warn('[useSubscription] Auth error:', authError.message);
                setFeatures(PLAN_FEATURES.starter);
                setLoading(false);
                return;
            }
            
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
                console.warn('[useSubscription] Could not fetch subscriptions:', subError.message);
                setFeatures(PLAN_FEATURES.starter);
                setLoading(false);
                return;
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
                // No subscription found - use starter features
                console.log('[useSubscription] No subscription found');
                setFeatures(PLAN_FEATURES.starter);
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
        setLastRefresh(Date.now());
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
        lastRefresh
    };
}