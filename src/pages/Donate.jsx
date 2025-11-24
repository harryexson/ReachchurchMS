
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Donation } from "@/entities/Donation";
import { ChurchSettings } from "@/entities/ChurchSettings";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Heart, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";

const initialDonationState = {
    donor_name: "",
    donor_email: "",
    amount: "50.00",
    donation_type: "offering",
};

export default function DonatePage() {
    const [formData, setFormData] = useState(initialDonationState);
    const [currentUser, setCurrentUser] = useState(null);
    const [churchSettings, setChurchSettings] = useState(null);
    const [monthlyProgress, setMonthlyProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we're returning from successful payment
    const urlParams = new URLSearchParams(location.search);
    const paymentSuccess = urlParams.get('payment') === 'success';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [user, settings, donations] = await Promise.all([
                    User.me().catch(() => null),
                    ChurchSettings.list(),
                    Donation.list()
                ]);

                setCurrentUser(user);
                if (settings.length > 0) {
                    setChurchSettings(settings[0]);
                    
                    // Calculate monthly progress
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const monthlyDonations = donations.filter(donation => {
                        const donationDate = new Date(donation.donation_date);
                        return donationDate.getMonth() === currentMonth && 
                               donationDate.getFullYear() === currentYear;
                    });
                    const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + d.amount, 0);
                    const goal = settings[0].donation_goal_monthly || 5000;
                    setMonthlyProgress(Math.min((monthlyTotal / goal) * 100, 100));
                }

                if (user) {
                    setFormData(prev => ({
                        ...prev,
                        donor_name: user.full_name || "",
                        donor_email: user.email || ""
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, []);

    const handleAmountClick = (amount) => {
        setFormData({ ...formData, amount });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const { createDonationCheckout } = await import("@/functions/createDonationCheckout");
            
            const response = await createDonationCheckout({
                amount: parseFloat(formData.amount),
                donation_type: formData.donation_type,
                successUrl: `${window.location.origin}${createPageUrl('Donate')}?payment=success`,
                cancelUrl: `${window.location.origin}${createPageUrl('Donate')}`,
                metadata: {
                    donor_name: formData.donor_name
                }
            });

            if (response.data.checkout_url) {
                // Redirect to Stripe checkout
                window.location.href = response.data.checkout_url;
            } else {
                throw new Error(response.data.message || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error("Checkout failed:", error);
            if (error.message?.includes('bank account not connected')) {
                alert("Your church needs to connect their bank account in Settings before accepting donations.");
            } else {
                alert("Payment setup failed. Please try again or contact support.");
            }
        }

        setIsProcessing(false);
    };

    if (paymentSuccess) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md text-center shadow-2xl">
                    <CardHeader>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <CardTitle className="text-3xl">Thank You!</CardTitle>
                        <CardDescription>Your generous gift is greatly appreciated.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6">Your donation has been successfully processed. You should receive a confirmation email shortly.</p>
                        <Button onClick={() => navigate(createPageUrl('Dashboard'))}>Return to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Monthly Goal Progress */}
                {churchSettings?.donation_goal_monthly && (
                    <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="text-center space-y-4">
                                <h2 className="text-xl font-bold text-slate-900">Monthly Giving Goal</h2>
                                <div className="space-y-2">
                                    <Progress value={monthlyProgress} className="h-4" />
                                    <p className="text-sm text-slate-600">
                                        {Math.round(monthlyProgress)}% of ${churchSettings.donation_goal_monthly.toLocaleString()} goal reached this month
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex items-center justify-center">
                    <Card className="w-full max-w-md shadow-2xl">
                        <CardHeader className="text-center">
                            <Heart className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <CardTitle className="text-3xl">Give Generously</CardTitle>
                            <CardDescription>Support our ministry and mission through secure online giving.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Choose an amount ($)</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["25", "50", "100", "250", "500", "1000"].map(amt => (
                                            <Button key={amt} type="button" variant={formData.amount === amt ? "default" : "outline"} onClick={() => handleAmountClick(amt)}>${amt}</Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Or enter a custom amount</Label>
                                    <Input id="amount" name="amount" type="number" min="1" step="0.01" value={formData.amount} onChange={handleChange} required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="donation_type">Designation</Label>
                                    <Select value={formData.donation_type} onValueChange={(value) => handleSelectChange('donation_type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="offering">General Offering</SelectItem>
                                            <SelectItem value="tithe">Tithe</SelectItem>
                                            <SelectItem value="building_fund">Building Fund</SelectItem>
                                            <SelectItem value="missions">Missions</SelectItem>
                                            <SelectItem value="special_event">Special Event</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {!currentUser && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="donor_name">Full Name</Label>
                                            <Input id="donor_name" name="donor_name" value={formData.donor_name} onChange={handleChange} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="donor_email">Email Address</Label>
                                            <Input id="donor_email" name="donor_email" type="email" value={formData.donor_email} onChange={handleChange} required />
                                        </div>
                                    </>
                                )}
                                
                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Donate ${parseFloat(formData.amount || 0).toFixed(2)}
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-slate-500">
                                    Secure payment processed by Stripe. Your information is encrypted and protected.
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
