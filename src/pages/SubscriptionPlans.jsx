import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Loader2, MessageSquare, Video, Phone, Mail, Calendar, XCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function SubscriptionPlansPage() {
    const navigate = useNavigate();
    const [selectedBilling, setSelectedBilling] = useState("monthly");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isUpgrade, setIsUpgrade] = useState(false);
    const [existingSubscription, setExistingSubscription] = useState(null);
    const [pricingPlans, setPricingPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    // Check if this is an upgrade from expired trial and load pricing from database
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isExpired = urlParams.get('expired') === 'true';
        const isUpgradeParam = urlParams.get('upgrade') === 'true';
        
        if (isUpgradeParam || isExpired) {
            setIsUpgrade(true);
        }
        
        // Load pricing plans and subscription info
        const loadData = async () => {
            try {
                // Load pricing plans from database
                const dbPlans = await base44.entities.PricingPlan.filter({ is_active: true });
                if (dbPlans.length > 0) {
                    setPricingPlans(dbPlans.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
                }
                
                const user = await base44.auth.me();
                if (user?.email) {
                    const subs = await base44.entities.Subscription.filter({
                        church_admin_email: user.email
                    });
                    if (subs.length > 0) {
                        setExistingSubscription(subs[0]);
                    }
                }
            } catch (e) {
                console.log('Could not load data:', e);
            } finally {
                setLoadingPlans(false);
            }
        };
        loadData();
    }, []);

    const defaultPlans = useMemo(() => [
        {
            name: "Starter",
            tier: "starter",
            price: 49,
            annualPrice: 470,
            stripePriceIdMonthly: "price_1SnEtEEmNtS0X4tOWzCAK8Dy",
            stripePriceIdAnnual: "price_1SnEtEEmNtS0X4tOnnPohnty",
            description: "Perfect for small churches just getting started",
            memberLimit: "Up to 150 members",
            popular: false,
            isFree: false,
            features: [
                "👥 Member Management (150 limit)",
                "📅 Event Planning & Calendar",
                "💰 Basic Giving Tracking",
                "🙋 Volunteer Coordination",
                "✉️ Email Communications (1,000/month)",
                "📊 Basic Reports & Analytics",
                "👋 Visitor Management",
                "🎤 Sermon Library",
                "💬 Community Forum",
                "📱 Mobile-Responsive Design",
                "🔔 In-App Messaging",
                "📧 Giving Receipts",
                "👤 User Roles & Permissions",
                "📝 Member Groups",
                "💌 Community Support"
            ],
            limitations: [
                "No SMS/MMS messaging",
                "No video meetings",
                "No kids check-in",
                "No kiosk giving",
                "No automated workflows",
                "No financial management",
                "No coffee shop/bookstore POS"
            ]
        },
        {
            name: "Growth",
            tier: "growth",
            price: 119,
            annualPrice: 1140,
            stripePriceIdMonthly: "price_1SnEtFEmNtS0X4tOsXL1EzBU",
            stripePriceIdAnnual: "price_1SnEtFEmNtS0X4tOO3NNgXoz",
            description: "BEST VALUE - Same price as Tithe.ly with 10x more features",
            memberLimit: "Up to 750 members",
            popular: true,
            features: [
                "✨ Everything in Starter, plus:",
                "📱 SMS Messaging (1,000 msgs/month)",
                "📸 MMS Multimedia Campaigns (10/month)",
                "🎥 Video Meetings (25 participants)",
                "👶 Kids Check-In/Check-Out System",
                "🖨️ Label & Name Tag Printing",
                "💰 Kiosk Giving Stations",
                "☕ Coffee Shop POS System",
                "📚 Bookstore Management",
                "🛒 Inventory Management",
                "📦 Order Fulfillment",
                "🎁 Loyalty Program",
                "🤖 Automated Workflows",
                "📧 Visitor Follow-up Sequences",
                "💌 Automated Giving Thank-Yous",
                "📊 Tax Statement Generation",
                "📈 Advanced Analytics & Reports",
                "📱 Text-to-Give Keywords",
                "🔗 QR Code Generation",
                "💰 Complete Financial Management",
                "💳 Expense Tracking",
                "📉 Budget Management",
                "🎯 People Engagement Tracking",
                "📋 Follow-Up Task Management",
                "🎨 Theme Customization",
                "📢 Targeted Messaging",
                "📺 Display Management",
                "🖥️ Network Device Setup",
                "⚡ Priority Email Support"
            ],
            limitations: []
        },
        {
            name: "Premium",
            tier: "premium",
            price: 249,
            annualPrice: 2390,
            stripePriceIdMonthly: "price_1SnEtFEmNtS0X4tOXjdk9bR5",
            stripePriceIdAnnual: "price_1SnEtFEmNtS0X4tOK9jHN7nm",
            description: "50% cheaper than Pushpay - Enterprise features for multi-site",
            memberLimit: "Unlimited members",
            popular: false,
            features: [
                "🚀 Everything in Growth, plus:",
                "♾️ Unlimited SMS/MMS Messages",
                "🎥 Video Meetings (200 participants)",
                "📹 Video Recording & Playback",
                "🚪 Breakout Rooms for Meetings",
                "🏢 Multi-Campus Support",
                "🌍 Multi-Region Management",
                "🎨 White-Label Branding",
                "🌐 Custom Domain Support",
                "🔌 API Access for Integrations",
                "📞 Dedicated Phone Number(s)",
                "🔐 Advanced Role-Based Access",
                "⚙️ Custom Workflows & Automation",
                "📊 Advanced Financial Reporting",
                "💼 Donor Development Tools",
                "🎯 Donor Risk Analysis",
                "📈 Predictive Analytics",
                "🔄 Automated Donor Segmentation",
                "📞 Priority Phone Support",
                "👤 Dedicated Account Manager",
                "🎓 Custom Training & Onboarding",
                "🛡️ Enhanced Security & Compliance",
                "🔐 SSO/SAML Integration",
                "📱 Custom Mobile App (Coming Soon)",
                "🌐 International Currency Support"
            ],
            limitations: []
        }
    ], []);

    // Use database pricing if available, otherwise use defaults
    const plans = useMemo(() => {
        if (pricingPlans.length > 0) {
            return pricingPlans.map(dbPlan => ({
                name: dbPlan.display_name || dbPlan.plan_name.charAt(0).toUpperCase() + dbPlan.plan_name.slice(1),
                tier: dbPlan.plan_name,
                price: dbPlan.monthly_price,
                annualPrice: dbPlan.annual_price || (dbPlan.monthly_price * 12),
                stripePriceIdMonthly: dbPlan.stripe_monthly_price_id || defaultPlans.find(p => p.tier === dbPlan.plan_name)?.stripePriceIdMonthly || "",
                stripePriceIdAnnual: dbPlan.stripe_annual_price_id || defaultPlans.find(p => p.tier === dbPlan.plan_name)?.stripePriceIdAnnual || "",
                description: dbPlan.notes || defaultPlans.find(p => p.tier === dbPlan.plan_name)?.description || "",
                memberLimit: `Up to ${dbPlan.features?.member_limit || 0} members`,
                popular: dbPlan.recommended || false,
                features: defaultPlans.find(p => p.tier === dbPlan.plan_name)?.features || [],
                limitations: defaultPlans.find(p => p.tier === dbPlan.plan_name)?.limitations || []
            }));
        }
        return defaultPlans;
    }, [pricingPlans, defaultPlans]);

    const handleAddOnPurchase = async (addonId, price) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const user = await base44.auth.me();
            if (!user?.email) {
                base44.auth.redirectToLogin(window.location.href);
                return;
            }

            // Check if user has an active subscription
            const subscriptions = await base44.entities.Subscription.filter({
                church_admin_email: user.email
            });

            if (subscriptions.length === 0 || !['active', 'trial'].includes(subscriptions[0].status)) {
                alert('You need an active subscription to purchase add-ons. Please select a plan first.');
                setIsLoading(false);
                return;
            }

            const subscription = subscriptions[0];

            // Check if addon already purchased
            if (subscription.active_addons?.some(addon => addon.addon_id === addonId)) {
                alert('You already have this add-on!');
                setIsLoading(false);
                return;
            }

            // Define addon features
            const addonFeatures = {
                extra_sms_mms: {
                    sms_monthly_limit: (subscription.features?.sms_monthly_limit || 0) + 1000,
                    mms_monthly_limit: (subscription.features?.mms_monthly_limit || 0) + 50
                },
                extra_video_seats: {
                    video_max_participants: (subscription.features?.video_max_participants || 0) + 50
                },
                dedicated_number: {
                    dedicated_phone_enabled: true
                }
            };

            // Update subscription with addon
            const updatedAddons = [...(subscription.active_addons || []), {
                addon_id: addonId,
                addon_name: addonId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                addon_price: price,
                features: addonFeatures[addonId],
                added_date: new Date().toISOString()
            }];

            const updatedFeatures = {
                ...subscription.features,
                ...addonFeatures[addonId]
            };

            await base44.entities.Subscription.update(subscription.id, {
                active_addons: updatedAddons,
                features: updatedFeatures
            });

            alert('Add-on successfully added to your plan! Features are now enabled.');
            setIsLoading(false);
        } catch (error) {
            console.error('Add-on purchase error:', error);
            alert(`Failed to add add-on: ${error.message}`);
            setIsLoading(false);
        }
    };

    const handleSelectPlan = async (plan) => {
        setIsLoading(true);
        setError(null);
        
        try {
            let user;
            try {
                user = await base44.auth.me();
            } catch (authError) {
                console.warn("User not authenticated");
                await base44.auth.redirectToLogin(window.location.href);
                return;
            }

            if (user && user.email) {
                const subscriptions = await base44.entities.Subscription.filter({
                    church_admin_email: user.email
                });

                console.log('Found subscriptions:', subscriptions);

                if (subscriptions.length > 0) {
                    const activeSub = subscriptions.find(s => 
                        (s.status === 'active' || s.status === 'trial') && 
                        s.subscription_tier === plan.tier
                    );
                    
                    // Only block if they have an ACTIVE subscription for THIS exact plan
                    if (activeSub) {
                        // Check if trial is still valid
                        if (activeSub.status === 'trial' && activeSub.trial_end_date) {
                            const trialEnd = new Date(activeSub.trial_end_date);
                            const now = new Date();
                            
                            // If trial expired, let them subscribe
                            if (now > trialEnd) {
                                console.log('Trial expired, allowing new subscription');
                            } else {
                                alert(`You already have the ${plan.name} plan active!`);
                                setIsLoading(false);
                                return;
                            }
                        } else if (activeSub.status === 'active') {
                            alert(`You already have the ${plan.name} plan active!`);
                            setIsLoading(false);
                            return;
                        }
                    }
                }
            }

            const priceId = selectedBilling === "monthly" ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual;
            
            if (!priceId || priceId.includes('placeholder')) {
                alert(`The ${plan.name} plan is not yet configured. Please contact support at support@reachconnect.app`);
                setIsLoading(false);
                return;
            }

            console.log("Creating checkout with price ID:", priceId);

            const response = await base44.functions.invoke('createCheckoutSession', {
                priceId: priceId,
                planName: `${plan.name} (${selectedBilling})`,
                successUrl: `https://reachchurchms.com${createPageUrl('Dashboard')}?subscription=success`,
                cancelUrl: `https://reachchurchms.com${createPageUrl('SubscriptionPlans')}?subscription=cancelled`,
                metadata: {
                    plan_tier: plan.tier,
                    plan_name: plan.name,
                    billing_cycle: selectedBilling,
                    church_admin_email: user.email,
                    church_name: user.church_name || user.full_name
                }
            });

            console.log("Checkout response:", response);

            const checkoutUrl = response?.data?.checkout_url || response?.checkout_url;

            if (checkoutUrl) {
                console.log("Redirecting to:", checkoutUrl);
                window.location.href = checkoutUrl;
            } else {
                throw new Error("No checkout URL received from server");
            }
        } catch (error) {
            console.error('Checkout error:', error);
            setError(error.response?.data?.message || error.message || 'Failed to start checkout');
            alert(`Checkout failed: ${error.message}. Please contact support.`);
        }
        
        setIsLoading(false);
    };

    if (loadingPlans) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading pricing plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-90" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                              {isUpgrade ? "Your Trial Has Ended - Choose Your Plan" : "Simple, Transparent Pricing"}
                          </h1>
                          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                              {isUpgrade 
                                  ? "Thank you for trying REACH Church Connect! Your trial has ended, but all your data and settings are safely preserved. Choose a plan below to continue your ministry with full access."
                                  : "Choose the perfect plan for your church. No hidden fees, no surprises. Cancel anytime."
                              }
                          </p>
                          {isUpgrade && (
                              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-4 inline-block mb-4">
                                  <p className="text-white font-semibold">
                                      ✅ All your data is safe • No setup required • Continue where you left off
                                  </p>
                              </div>
                          )}
                          {isUpgrade && existingSubscription && (
                              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 inline-block mb-4">
                                  <p className="text-white">
                                      👋 Welcome back, {existingSubscription.church_name}! Your account is ready to upgrade.
                                  </p>
                              </div>
                          )}
                        
                        {/* Billing Toggle */}
                        <div className="inline-flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-full p-2">
                            <button
                                onClick={() => setSelectedBilling("monthly")}
                                className={`px-6 py-2 rounded-full font-medium transition-all ${
                                    selectedBilling === "monthly"
                                        ? "bg-white text-blue-600 shadow-lg"
                                        : "text-white hover:bg-white/10"
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setSelectedBilling("annual")}
                                className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                                    selectedBilling === "annual"
                                        ? "bg-white text-blue-600 shadow-lg"
                                        : "text-white hover:bg-white/10"
                                }`}
                            >
                                Annual
                                <Badge className="bg-green-500 text-white">Save 20%</Badge>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-24">
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.tier}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className={`relative h-full flex flex-col ${
                                plan.popular
                                    ? "border-4 border-blue-500 shadow-2xl scale-105"
                                    : "border-2 border-slate-200 shadow-xl"
                            }`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
                                            ⭐ MOST POPULAR
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-6">
                                    <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                                        {plan.name}
                                    </CardTitle>
                                    <p className="text-slate-600 mb-4">{plan.description}</p>
                                    <div className="mb-4">
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-5xl font-bold text-slate-900">
                                                ${selectedBilling === "monthly" ? plan.price : plan.annualPrice}
                                            </span>
                                            <span className="text-slate-600">
                                                /{selectedBilling === "monthly" ? "mo" : "yr"}
                                            </span>
                                        </div>
                                        {selectedBilling === "annual" && (
                                            <p className="text-sm text-green-600 font-medium mt-2">
                                                Save ${(plan.price * 12) - plan.annualPrice}/year
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="text-sm">
                                        {plan.memberLimit}
                                    </Badge>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col">
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className={`text-sm ${
                                                    feature.startsWith('✨') || feature.startsWith('🚀')
                                                        ? 'font-semibold text-slate-900'
                                                        : 'text-slate-700'
                                                }`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                        {plan.limitations.map((limitation, idx) => (
                                            <li key={`limit-${idx}`} className="flex items-start gap-3">
                                                <XCircle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-slate-400">{limitation}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isLoading}
                                        className={`w-full py-6 text-lg font-semibold ${
                                            plan.popular
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl"
                                                : "bg-slate-900 hover:bg-slate-800 text-white"
                                        }`}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>Get Started</>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Professional Services Section */}
                <div className="mt-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            🎓 Professional Training & Implementation
                        </h2>
                        <p className="text-lg text-slate-600">
                            Get your church up and running fast with expert guidance
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <Card className="border-2 border-blue-200 hover:shadow-xl transition-all">
                            <CardContent className="p-6">
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-xl mb-2">Quick Start Setup</h3>
                                    <p className="text-4xl font-bold text-blue-600 mb-1">$299</p>
                                    <p className="text-sm text-slate-600">One-time</p>
                                </div>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>1-hour live setup call</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Basic configuration assistance</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Member data import help</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Giving page customization</span>
                                    </li>
                                </ul>
                                <Button 
                                    className="w-full mt-6"
                                    onClick={() => window.location.href = 'mailto:info@reachconnect.app?subject=Quick Start Setup'}
                                >
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-4 border-purple-500 hover:shadow-2xl transition-all relative">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <Badge className="bg-purple-600 text-white px-4 py-1">Most Popular</Badge>
                            </div>
                            <CardContent className="p-6 pt-8">
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Star className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-xl mb-2">Complete Training</h3>
                                    <p className="text-4xl font-bold text-purple-600 mb-1">$799</p>
                                    <p className="text-sm text-slate-600">One-time</p>
                                </div>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>3 hours of live training</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Full system implementation</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Staff training for up to 5 people</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Custom workflow setup</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Data migration assistance</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>30-day follow-up support</span>
                                    </li>
                                </ul>
                                <Button 
                                    className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
                                    onClick={() => window.location.href = 'mailto:info@reachconnect.app?subject=Complete Training Package'}
                                >
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-slate-200 hover:shadow-xl transition-all">
                            <CardContent className="p-6">
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Phone className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-xl mb-2">Ongoing Coaching</h3>
                                    <p className="text-4xl font-bold text-green-600 mb-1">$199</p>
                                    <p className="text-sm text-slate-600">/month</p>
                                </div>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Monthly 1-hour coaching call</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Priority email support</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Strategy sessions</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Best practices guidance</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Quarterly reviews</span>
                                    </li>
                                </ul>
                                <Button 
                                    className="w-full mt-6"
                                    onClick={() => window.location.href = 'mailto:info@reachconnect.app?subject=Ongoing Coaching'}
                                >
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Add-Ons Section */}
                <div className="mt-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Need More? Add Premium Features
                        </h2>
                        <p className="text-lg text-slate-600">
                            Enhance any plan with these powerful add-ons
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="border-2 border-slate-200 hover:shadow-xl transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <MessageSquare className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Extra SMS/MMS</h3>
                                        <p className="text-2xl font-bold text-blue-600">$29<span className="text-sm text-slate-600">/mo</span></p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-4">
                                    Add 1,000 additional SMS or 50 MMS messages per month
                                </p>
                                <Button 
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleAddOnPurchase('extra_sms_mms', 29)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Plan'}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-slate-200 hover:shadow-xl transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <Video className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Extra Video Seats</h3>
                                        <p className="text-2xl font-bold text-purple-600">$49<span className="text-sm text-slate-600">/mo</span></p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-4">
                                    Add 50 more participants to your video meetings
                                </p>
                                <Button 
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    onClick={() => handleAddOnPurchase('extra_video_seats', 49)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Plan'}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-slate-200 hover:shadow-xl transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <Phone className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Dedicated Number</h3>
                                        <p className="text-2xl font-bold text-green-600">$15<span className="text-sm text-slate-600">/mo</span></p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-4">
                                    Get your own dedicated phone number for SMS/MMS
                                </p>
                                <Button 
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAddOnPurchase('dedicated_number', 15)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Plan'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-24">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Can I switch plans anytime?</h3>
                                <p className="text-slate-600 text-sm">
                                    Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Is there a free trial?</h3>
                                <p className="text-slate-600 text-sm">
                                    Yes! All new accounts get a 14-day free trial of the Growth plan. No credit card required to start.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-slate-900 mb-2">What payment methods do you accept?</h3>
                                <p className="text-slate-600 text-sm">
                                    We accept all major credit cards, debit cards, and ACH bank transfers through our secure payment processor, Stripe.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-slate-900 mb-2">Can I cancel anytime?</h3>
                                <p className="text-slate-600 text-sm">
                                    Absolutely. Cancel your subscription anytime with no cancellation fees. Your access continues until the end of your billing period.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-24 text-center">
                    <Card className="bg-gradient-to-br from-blue-600 to-purple-600 border-0">
                        <CardContent className="p-12">
                            <h2 className="text-3xl font-bold text-white mb-4">
                                Still have questions?
                            </h2>
                            <p className="text-xl text-blue-100 mb-8">
                                Our team is here to help you find the perfect plan for your church
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                            size="lg"
                                            className="bg-white text-blue-600 hover:bg-blue-50 px-8"
                                            onClick={() => window.location.href = 'mailto:info@reachconnect.app?subject=Interested in REACH Church Connect Pricing'}
                                        >
                                            <Mail className="w-5 h-5 mr-2" />
                                            Contact Sales
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="border-2 border-white text-white hover:bg-white/10 px-8"
                                            onClick={() => window.location.href = 'mailto:support@reachconnect.app?subject=Support Request'}
                                        >
                                            <Mail className="w-5 h-5 mr-2" />
                                            Contact Support
                                        </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}