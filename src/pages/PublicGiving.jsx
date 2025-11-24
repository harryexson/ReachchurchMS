import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2, Heart, DollarSign, AlertCircle } from "lucide-react";

export default function PublicGiving() {
    const [amount, setAmount] = useState("");
    const [customAmount, setCustomAmount] = useState("");
    const [donationType, setDonationType] = useState("offering");
    const [donorName, setDonorName] = useState("");
    const [donorEmail, setDonorEmail] = useState("");
    const [donorPhone, setDonorPhone] = useState("");
    const [donorAddress, setDonorAddress] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState("monthly");
    const [isProcessing, setIsProcessing] = useState(false);
    const [churchName, setChurchName] = useState("Our Church");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [goalData, setGoalData] = useState(null);
    const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
    const [givingCategories, setGivingCategories] = useState([]);
    const [branding, setBranding] = useState({
        logo_url: "",
        primary_color: "#3b82f6",
        secondary_color: "#10b981",
        hero_image_url: "",
        tagline: ""
    });

    useEffect(() => {
        loadInitialData();
        
        // CRITICAL FIX: Clear URL params immediately on mount to prevent loops
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true' || urlParams.get('cancelled') === 'true') {
            // Store the result before clearing
            const isSuccess = urlParams.get('success') === 'true';
            const isCancelled = urlParams.get('cancelled') === 'true';
            
            // Clear URL immediately
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Set result flags
            if (isSuccess) {
                sessionStorage.setItem('donation_success', 'true');
            }
            if (isCancelled) {
                sessionStorage.setItem('donation_cancelled', 'true');
            }
        }
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            let user = null;
            try {
                user = await base44.auth.me();
                setCurrentUser(user);
                setIsAuthenticated(true);
                console.log('User authenticated for giving:', user.email);
                
                setDonorName(user.full_name || "");
                setDonorEmail(user.email || "");
                setDonorPhone(user.phone_number || "");
                
                if (user.member_id) {
                    try {
                        const members = await base44.entities.Member.filter({ id: user.member_id });
                        if (members.length > 0) {
                            setDonorAddress(members[0].address || "");
                        }
                    } catch (memberError) {
                        console.log('Could not load member data:', memberError);
                    }
                }
            } catch (authError) {
                console.log('No authenticated user (public donation)');
                setIsAuthenticated(false);
            }

            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                const churchSettings = settings[0];
                if (churchSettings.church_name) {
                    setChurchName(churchSettings.church_name);
                }
                setBranding({
                    logo_url: churchSettings.logo_url || "",
                    primary_color: churchSettings.primary_color || "#3b82f6",
                    secondary_color: churchSettings.secondary_color || "#10b981",
                    hero_image_url: churchSettings.hero_image_url || "",
                    tagline: churchSettings.tagline || ""
                });
                
                // Load goal data if enabled
                if (churchSettings.show_goal_on_public_page && churchSettings.donation_goal_monthly) {
                    setGoalData({
                        goal: churchSettings.donation_goal_monthly,
                        title: churchSettings.donation_goal_title || "Monthly Goal",
                        description: churchSettings.donation_goal_description || ""
                    });
                    
                    // Calculate current month donations
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    const donations = await base44.entities.Donation.list('-donation_date', 1000);
                    const monthlyDonations = donations.filter(d => d.donation_date >= monthStart);
                    const total = monthlyDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
                    setCurrentMonthTotal(total);
                    }
                    }

                    // Load giving categories
                    const categories = await base44.entities.GivingCategory.filter({ 
                    is_active: true,
                    show_on_public_page: true
                    });
                    setGivingCategories(categories.sort((a, b) => a.display_order - b.display_order));
                    } catch (error) {
                    console.error("Failed to load initial data:", error);
                    }
                    setIsLoading(false);
                    };

    const suggestedAmounts = [25, 50, 100, 250, 500];

    const handleDonate = async () => {
        const donationAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);
        
        if (!donationAmount || donationAmount <= 0) {
            alert("Please enter a valid donation amount");
            return;
        }

        if (!donorName || !donorEmail || !donorPhone || !donorAddress) {
            alert("Please fill in all required fields (name, email, phone, and address)");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(donorEmail)) {
            alert("Please enter a valid email address");
            return;
        }

        const phoneDigits = donorPhone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            alert("Please enter a valid phone number");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // CRITICAL FIX: Build absolute URLs without any existing params
            const baseUrl = window.location.origin + window.location.pathname;
            const successUrl = `${baseUrl}?success=true&t=${Date.now()}`;
            const cancelUrl = `${baseUrl}?cancelled=true&t=${Date.now()}`;

            console.log('Creating donation checkout...');
            console.log('Success URL:', successUrl);
            console.log('Cancel URL:', cancelUrl);

            const response = await base44.functions.invoke('createDonationCheckout', {
                amount: donationAmount,
                donation_type: donationType,
                donor_name: donorName,
                donor_email: donorEmail,
                donor_phone: donorPhone,
                donor_address: donorAddress,
                recurring: isRecurring,
                recurring_frequency: isRecurring ? recurringFrequency : null,
                successUrl: successUrl,
                cancelUrl: cancelUrl,
                metadata: {
                    donor_name: donorName,
                    donor_email: donorEmail,
                    donor_phone: donorPhone,
                    donor_address: donorAddress,
                    donation_type: donationType,
                    recurring: isRecurring ? 'true' : 'false',
                    recurring_frequency: isRecurring ? recurringFrequency : '',
                    source: 'public_giving_page',
                    user_id: currentUser?.id || 'public',
                    member_id: currentUser?.member_id || null
                }
            });

            console.log('Checkout response:', response);

            if (response.data && response.data.checkout_url) {
                console.log('Redirecting to:', response.data.checkout_url);
                
                // CRITICAL FIX: Break out of iframe if embedded
                if (window.self !== window.top) {
                    console.log('Breaking out of iframe...');
                    window.top.location.href = response.data.checkout_url;
                } else {
                    // Use direct window.location for clean redirect
                    window.location.href = response.data.checkout_url;
                }
            } else {
                throw new Error("No checkout URL received from server");
            }
        } catch (error) {
            console.error("Donation error:", error);
            setError(error.response?.data?.message || error.message || "Failed to process donation");
            setIsProcessing(false);
            alert("Failed to process donation. Please try again or contact us directly.");
        }
    };

    // Check for success/cancel from sessionStorage
    const donationSuccess = sessionStorage.getItem('donation_success') === 'true';
    const donationCancelled = sessionStorage.getItem('donation_cancelled') === 'true';

    // Clear flags after reading
    if (donationSuccess) {
        sessionStorage.removeItem('donation_success');
    }
    if (donationCancelled) {
        sessionStorage.removeItem('donation_cancelled');
    }

    if (donationSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full shadow-2xl">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Thank You for Your Generosity!
                        </h1>
                        <p className="text-lg text-slate-600">
                            Your donation has been received and recorded. You'll receive a receipt via email shortly.
                        </p>
                        <p className="text-slate-600">
                            Your gift makes a difference in our community and helps us continue our mission.
                        </p>
                        <Button
                            onClick={() => window.location.href = window.location.pathname}
                            className="mt-6 bg-green-600 hover:bg-green-700"
                        >
                            Make Another Donation
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (donationCancelled) {
        setTimeout(() => {
            window.location.href = window.location.pathname;
        }, 3000);
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <h2 className="text-3xl font-bold text-slate-900">Donation Cancelled</h2>
                        <p className="text-xl text-slate-600">No charges were made.</p>
                        <p className="text-slate-500">Returning to donation page...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-green-600 animate-spin" />
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen py-12 px-6"
            style={{
                background: `linear-gradient(135deg, ${branding.primary_color}15 0%, ${branding.secondary_color}15 100%)`
            }}
        >
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    {branding.logo_url ? (
                        <img 
                            src={branding.logo_url} 
                            alt={`${churchName} Logo`}
                            className="h-32 w-auto max-w-[400px] mx-auto mb-4 object-contain"
                        />
                    ) : (
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/2ca3c03b0_ReachLOGOEdited08_44_18AM.png"
                            alt="REACH ChurchConnect Logo"
                            className="h-32 w-auto max-w-[400px] mx-auto mb-4 object-contain"
                        />
                    )}
                    {branding.hero_image_url && (
                        <div className="w-full h-48 rounded-xl overflow-hidden mb-6 shadow-lg">
                            <img 
                                src={branding.hero_image_url} 
                                alt={churchName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: branding.primary_color }}
                    >
                        <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">
                        Give to {churchName}
                    </h1>
                    {branding.tagline && (
                        <p className="text-lg text-slate-600 mb-3">{branding.tagline}</p>
                    )}
                    <p className="text-lg text-slate-600">
                        Thank you for supporting our mission and ministry!
                    </p>
                    {isAuthenticated && (
                        <p className="text-sm text-green-600 mt-2">
                            ✓ Signed in as {currentUser?.full_name || currentUser?.email}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-900">Error Processing Donation</p>
                            <p className="text-sm text-red-800 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Goal Progress */}
                {goalData && (
                    <Card className="shadow-2xl mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{goalData.title}</h3>
                                        {goalData.description && (
                                            <p className="text-sm text-slate-600 mt-1">{goalData.description}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-green-600">
                                            ${currentMonthTotal.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            of ${goalData.goal.toLocaleString()} goal
                                        </p>
                                    </div>
                                </div>
                                <div className="relative h-4 bg-white rounded-full overflow-hidden">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((currentMonthTotal / goalData.goal) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>{Math.round((currentMonthTotal / goalData.goal) * 100)}% reached</span>
                                    <span>${(goalData.goal - currentMonthTotal).toLocaleString()} remaining</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="shadow-2xl">
                    <CardHeader 
                        className="text-white"
                        style={{
                            background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`
                        }}
                    >
                        <CardTitle className="text-2xl">Make a Donation</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                        <div className="space-y-2">
                            <Label>Select Amount</Label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                {suggestedAmounts.map(amt => (
                                    <Button
                                        key={amt}
                                        type="button"
                                        variant={amount === String(amt) ? "default" : "outline"}
                                        onClick={() => {
                                            setAmount(String(amt));
                                            setCustomAmount("");
                                        }}
                                        className="text-lg font-semibold"
                                    >
                                        ${amt}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customAmount">Or Enter Custom Amount</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="customAmount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={customAmount}
                                    onChange={(e) => {
                                        setCustomAmount(e.target.value);
                                        setAmount('custom');
                                    }}
                                    placeholder="Enter amount"
                                    className="pl-10 text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="donationType">Donation Type</Label>
                            <Select value={donationType} onValueChange={setDonationType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {givingCategories.length > 0 ? (
                                        givingCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.category_code}>
                                                {cat.category_name}
                                                {cat.goal_amount && ` (Goal: $${cat.goal_amount.toLocaleString()})`}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="tithe">Tithe</SelectItem>
                                            <SelectItem value="offering">Offering</SelectItem>
                                            <SelectItem value="building_fund">Building Fund</SelectItem>
                                            <SelectItem value="missions">Missions</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="recurring" className="text-base">Make this a recurring donation</Label>
                                    <p className="text-sm text-slate-500 mt-1">Set up automatic donations</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsRecurring(!isRecurring)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        isRecurring ? 'bg-green-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            isRecurring ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {isRecurring && (
                                <div className="space-y-2 animate-in slide-in-from-top">
                                    <Label>Frequency</Label>
                                    <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="annually">Annually</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-green-600 mt-2">
                                        ✓ You'll be charged ${amount === 'custom' ? customAmount : amount} {recurringFrequency}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="donorName">
                                    Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="donorName"
                                    value={donorName}
                                    onChange={(e) => setDonorName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="donorEmail">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="donorEmail"
                                    type="email"
                                    value={donorEmail}
                                    onChange={(e) => setDonorEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="donorPhone">
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="donorPhone"
                                type="tel"
                                value={donorPhone}
                                onChange={(e) => setDonorPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="donorAddress">
                                Mailing Address <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="donorAddress"
                                value={donorAddress}
                                onChange={(e) => setDonorAddress(e.target.value)}
                                placeholder="123 Main St, City, State ZIP"
                                rows={3}
                                required
                            />
                            <p className="text-xs text-slate-500">Required for tax receipt purposes</p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-2">🔒 Secure Payment</h3>
                            <p className="text-sm text-blue-800">
                                Your payment is processed securely through Stripe. We never store your credit card information.
                            </p>
                        </div>

                        <Button
                            onClick={handleDonate}
                            disabled={isProcessing || (!amount && !customAmount)}
                            className="w-full text-lg py-6 text-white"
                            style={{ backgroundColor: branding.primary_color }}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Heart className="w-5 h-5 mr-2" />
                                    Proceed to Secure Payment
                                </>
                            )}
                        </Button>

                        <p className="text-sm text-slate-500 text-center">
                            All donations are tax-deductible. You'll receive a receipt via email.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}