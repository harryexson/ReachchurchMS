import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Heart, Loader2, DollarSign, Church, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function KioskGivingPage() {
    const [step, setStep] = useState('amount');
    const [amount, setAmount] = useState("");
    const [customAmount, setCustomAmount] = useState("");
    const [donationType, setDonationType] = useState("offering");
    const [donorInfo, setDonorInfo] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [churchName, setChurchName] = useState("Our Church");
    const [inactivityTimer, setInactivityTimer] = useState(null);
    const [branding, setBranding] = useState({
        logo_url: "",
        primary_color: "#3b82f6",
        secondary_color: "#10b981",
        tagline: ""
    });
    
    // Track if settings have been loaded to prevent multiple API calls
    const settingsLoadedRef = useRef(false);
    const loadingSettingsRef = useRef(false);

    const presetAmounts = [20, 50, 100, 250, 500, 1000];

    const handleReset = useCallback(() => {
        setStep('amount');
        setAmount("");
        setCustomAmount("");
        setDonationType("offering");
        setDonorInfo({ name: "", email: "", phone: "" });
        setIsProcessing(false);
        
        sessionStorage.removeItem('kiosk_donation_success');
        sessionStorage.removeItem('kiosk_donation_cancelled');
        
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('success');
            url.searchParams.delete('cancelled');
            window.history.replaceState({path:url.href},'',url.href);
        }
    }, []);

    const startInactivityTimer = useCallback(() => {
        const timer = setTimeout(() => {
            handleReset();
        }, 60000);
        setInactivityTimer(timer);
    }, [handleReset]);

    useEffect(() => {
        const loadChurchSettings = async () => {
            // Prevent duplicate API calls
            if (settingsLoadedRef.current || loadingSettingsRef.current) {
                return;
            }
            
            loadingSettingsRef.current = true;
            
            try {
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
                        tagline: churchSettings.tagline || ""
                    });
                }
                settingsLoadedRef.current = true;
            } catch (error) {
                console.error("Failed to load church settings:", error);
                // Even on error, mark as loaded to prevent retries
                settingsLoadedRef.current = true;
            } finally {
                loadingSettingsRef.current = false;
            }
        };
        
        // Only load settings once on initial mount
        loadChurchSettings();
        startInactivityTimer();
        
        // Check URL params for success/cancel
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true' || urlParams.get('cancelled') === 'true') {
            const isSuccess = urlParams.get('success') === 'true';
            const isCancelled = urlParams.get('cancelled') === 'true';
            
            window.history.replaceState({}, document.title, window.location.pathname);
            
            if (isSuccess) {
                sessionStorage.setItem('kiosk_donation_success', 'true');
            }
            if (isCancelled) {
                sessionStorage.setItem('kiosk_donation_cancelled', 'true');
            }
        }
        
        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
        };
    }, []); // Empty deps - only run once on mount

    useEffect(() => {
        const resetTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            startInactivityTimer();
        };

        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('click', resetTimer);

        return () => {
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('click', resetTimer);
        };
    }, [inactivityTimer, startInactivityTimer]);

    const handleAmountSelect = (amt) => {
        setAmount(String(amt));
        setCustomAmount("");
    };

    const handleContinueToDetails = () => {
        const donationAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);
        if (!donationAmount || donationAmount <= 0) {
            alert("Please select or enter an amount");
            return;
        }
        setStep('details');
    };

    const handleDonate = async () => {
        const donationAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);
        
        if (!donationAmount || donationAmount <= 0) {
            alert("Please enter a valid donation amount");
            return;
        }

        if (!donorInfo.email) {
            alert("Please enter your email to receive a receipt");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(donorInfo.email)) {
            alert("Please enter a valid email address");
            return;
        }

        setIsProcessing(true);
        setStep('processing');

        try {
            const baseUrl = window.location.origin + window.location.pathname;
            const successUrl = `${baseUrl}?success=true&t=${Date.now()}`;
            const cancelUrl = `${baseUrl}?cancelled=true&t=${Date.now()}`;

            console.log('Kiosk donation checkout...');
            console.log('Success URL:', successUrl);
            console.log('Cancel URL:', cancelUrl);

            const response = await base44.functions.invoke('createDonationCheckout', {
                amount: donationAmount,
                donation_type: donationType,
                donor_name: donorInfo.name || "Anonymous",
                donor_email: donorInfo.email,
                donor_phone: donorInfo.phone || "",
                donor_address: "Kiosk Donation - Address on File",
                successUrl: successUrl,
                cancelUrl: cancelUrl,
                metadata: {
                    donor_name: donorInfo.name || "Anonymous",
                    donor_email: donorInfo.email,
                    donor_phone: donorInfo.phone || "",
                    donor_address: "Kiosk Donation",
                    donation_type: donationType,
                    source: 'kiosk',
                    kiosk_donation: true
                }
            });

            if (response.data && response.data.checkout_url) {
                console.log('Redirecting to checkout...');
                if (window.self !== window.top) {
                    window.top.location.href = response.data.checkout_url;
                } else {
                    window.location.href = response.data.checkout_url;
                }
            } else {
                throw new Error("No checkout URL received");
            }
        } catch (error) {
            console.error("Donation error:", error);
            setIsProcessing(false);
            
            const errorData = error.response?.data;
            
            if (errorData?.error === 'Payment system not configured') {
                setStep('config_error');
            } else {
                setStep('error');
            }
        }
    };

    const kioskSuccess = sessionStorage.getItem('kiosk_donation_success') === 'true';
    const kioskCancelled = sessionStorage.getItem('kiosk_donation_cancelled') === 'true';

    if (kioskSuccess) {
        sessionStorage.removeItem('kiosk_donation_success');
        setTimeout(handleReset, 5000);
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full shadow-2xl">
                    <CardContent className="pt-16 pb-16 text-center space-y-6">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-20 h-20 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900">
                            Thank You! 🙏
                        </h1>
                        <p className="text-2xl text-slate-700">
                            Your generous gift has been received!
                        </p>
                        <p className="text-lg text-slate-600">
                            A receipt has been sent to your email.
                        </p>
                        <div className="pt-8">
                            <p className="text-slate-500">Returning to home screen...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (kioskCancelled) {
        sessionStorage.removeItem('kiosk_donation_cancelled');
        setTimeout(handleReset, 3000);
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <h2 className="text-3xl font-bold text-slate-900">Donation Cancelled</h2>
                        <p className="text-xl text-slate-600">No charges were made.</p>
                        <p className="text-slate-500">Returning to home screen...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'processing') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full">
                    <CardContent className="pt-16 pb-16 text-center space-y-6">
                        <Loader2 className="w-24 h-24 mx-auto text-blue-600 animate-spin" />
                        <h2 className="text-3xl font-bold text-slate-900">Processing Your Gift...</h2>
                        <p className="text-xl text-slate-600">Please wait while we securely process your donation.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'config_error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full shadow-2xl">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Payment System Not Configured</h2>
                        <p className="text-lg text-slate-600">
                            The church's payment system needs to be set up by an administrator.
                        </p>
                        <div className="bg-blue-50 p-6 rounded-lg text-left">
                            <p className="font-semibold text-blue-900 mb-2">For Church Administrators:</p>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-5">
                                <li>Go to Dashboard → Code → Environment Variables</li>
                                <li>Add STRIPE_API_KEY with your Stripe secret key</li>
                                <li>Click Save & Deploy</li>
                                <li>Try the donation again</li>
                            </ol>
                        </div>
                        <Button
                            onClick={handleReset}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full shadow-2xl">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-4xl">❌</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Payment Failed</h2>
                        <p className="text-lg text-slate-600">
                            We couldn't process your donation. Please try again or see a staff member for assistance.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={() => setStep('details')}
                                variant="outline"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={handleReset}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Start Over
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen flex flex-col overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`,
                height: '100vh',
                width: '100vw',
                position: 'fixed',
                top: 0,
                left: 0
            }}
        >
            <div className="bg-white shadow-lg py-6 px-6 w-full flex-shrink-0">
                <div className="max-w-4xl mx-auto flex flex-col items-center">
                    <div className="text-center mb-4">
                        {branding.logo_url ? (
                            <img 
                                src={branding.logo_url}
                                alt={`${churchName} Logo`}
                                className="h-24 w-auto max-w-[300px] mx-auto object-contain"
                            />
                        ) : (
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/2ca3c03b0_ReachLOGOEdited08_44_18AM.png"
                                alt="REACH ChurchConnect Logo"
                                className="h-24 w-auto max-w-[300px] mx-auto object-contain"
                            />
                        )}
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold" style={{ color: branding.primary_color }}>
                            {churchName}
                        </h1>
                        <p className="text-slate-600 text-base">Digital Giving Station</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center p-4 overflow-y-auto">
                <Card className="max-w-2xl w-full shadow-2xl">
                    {step === 'amount' && (
                        <>
                            <CardHeader className="text-center pb-6 space-y-4">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                                    style={{ backgroundColor: branding.primary_color }}
                                >
                                    <Heart className="w-12 h-12 text-white" />
                                </div>
                                {branding.tagline && (
                                    <p className="text-lg text-slate-600">{branding.tagline}</p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-lg font-semibold">Select Amount</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {presetAmounts.map(amt => (
                                            <Button
                                                key={amt}
                                                type="button"
                                                variant={amount === String(amt) ? "default" : "outline"}
                                                onClick={() => handleAmountSelect(amt)}
                                                className="text-2xl font-bold h-20"
                                                style={amount === String(amt) ? { 
                                                    backgroundColor: branding.primary_color,
                                                    borderColor: branding.primary_color,
                                                    color: 'white'
                                                } : {}}
                                            >
                                                ${amt}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customAmount" className="text-lg font-semibold">Or Enter Custom Amount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
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
                                            className="pl-12 text-2xl h-16"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="donationType" className="text-lg font-semibold">Donation Type</Label>
                                    <Select value={donationType} onValueChange={setDonationType}>
                                        <SelectTrigger id="donationType" className="text-lg h-14">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tithe">Tithe</SelectItem>
                                            <SelectItem value="offering">Offering</SelectItem>
                                            <SelectItem value="building_fund">Building Fund</SelectItem>
                                            <SelectItem value="missions">Missions</SelectItem>
                                            <SelectItem value="special_event">Special Event</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={handleContinueToDetails}
                                    disabled={!amount && !customAmount}
                                    className="w-full text-xl py-8 text-white"
                                    style={{ backgroundColor: branding.primary_color }}
                                >
                                    Continue
                                </Button>
                                <button
                                    onClick={handleReset}
                                    className="w-full text-slate-500 hover:text-slate-700 text-lg"
                                >
                                    Start Over
                                </button>
                            </CardContent>
                        </>
                    )}

                    {step === 'details' && (
                        <CardContent className="pt-12 pb-12 space-y-8">
                            <button
                                onClick={() => setStep('amount')}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-lg font-semibold"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Amount
                            </button>

                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Information</h2>
                                <p className="text-lg text-slate-600">For your tax receipt</p>
                                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                                    <p className="text-3xl font-bold text-green-900">
                                        ${amount === 'custom' ? parseFloat(customAmount).toFixed(2) : parseFloat(amount).toFixed(2)}
                                    </p>
                                    <p className="text-lg text-green-700 capitalize">{donationType.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-xl font-semibold">
                                        Email Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={donorInfo.email}
                                        onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
                                        placeholder="your.email@example.com"
                                        className="h-16 text-xl"
                                        required
                                    />
                                    <p className="text-sm text-slate-500">Required for receipt</p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-xl font-semibold">
                                        Full Name (Optional)
                                    </Label>
                                    <Input
                                        id="name"
                                        value={donorInfo.name}
                                        onChange={(e) => setDonorInfo({...donorInfo, name: e.target.value})}
                                        placeholder="John Doe"
                                        className="h-16 text-xl"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="phone" className="text-xl font-semibold">
                                        Phone Number (Optional)
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={donorInfo.phone}
                                        onChange={(e) => setDonorInfo({...donorInfo, phone: e.target.value})}
                                        placeholder="(555) 123-4567"
                                        className="h-16 text-xl"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                                <p className="text-lg text-blue-900 font-semibold mb-2">🔒 Secure Payment</p>
                                <p className="text-blue-800">
                                    Your payment is processed securely through Stripe. We never store your card information.
                                </p>
                            </div>

                            <Button
                                onClick={handleDonate}
                                disabled={isProcessing || !donorInfo.email}
                                className="w-full h-20 bg-green-600 hover:bg-green-700 text-2xl font-bold"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Heart className="w-6 h-6 mr-3" />
                                        Complete Donation
                                    </>
                                )}
                            </Button>

                            <button
                                onClick={handleReset}
                                className="w-full text-slate-500 hover:text-slate-700 text-lg"
                            >
                                Cancel
                            </button>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}