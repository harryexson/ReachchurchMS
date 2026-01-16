import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, ArrowLeft, Building, CreditCard, Settings, User, Phone, DollarSign, Smartphone } from "lucide-react";
import confetti from "canvas-confetti";

const ONBOARDING_STEPS = [
    { id: 1, title: "Welcome", icon: Building },
    { id: 2, title: "Organization", icon: Building },
    { id: 3, title: "Contact Info", icon: Phone },
    { id: 4, title: "Stripe Connect", icon: CreditCard },
    { id: 5, title: "Mobile & PWA", icon: Smartphone },
    { id: 6, title: "Complete", icon: CheckCircle }
];

export default function OnboardingWizard({ userEmail, userName, userType = "visitor", onComplete }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [progress, setProgress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        church_name: "",
        church_phone: "",
        church_address: "",
        point_of_contact: "",
        contact_phone: "",
        contact_email: userEmail,
        stripe_connected: false,
        bank_account_added: false
    });

    useEffect(() => {
        loadProgress();
    }, []);

    useEffect(() => {
        if (progress) {
            setCurrentStep(progress.current_step);
        }
    }, [progress]);

    const loadProgress = async () => {
        setIsLoading(true);
        try {
            const existing = await base44.entities.OnboardingProgress.filter({
                user_email: userEmail
            });

            if (existing.length > 0) {
                setProgress(existing[0]);
                setFormData(prev => ({
                    ...prev,
                    church_name: existing[0].church_name || "",
                    church_phone: existing[0].church_phone || "",
                    church_address: existing[0].church_address || "",
                    point_of_contact: existing[0].point_of_contact || "",
                    stripe_connected: existing[0].stripe_connected || false,
                    bank_account_added: existing[0].bank_account_added || false
                }));
            } else {
                const newProgress = await base44.entities.OnboardingProgress.create({
                    user_email: userEmail,
                    current_step: 1,
                    steps_completed: [],
                    onboarding_completed: false
                });
                setProgress(newProgress);
            }
        } catch (error) {
            console.error("Error loading progress:", error);
        }
        setIsLoading(false);
    };

    const updateProgress = async (updates) => {
        try {
            const updated = await base44.entities.OnboardingProgress.update(progress.id, updates);
            setProgress(updated);
        } catch (error) {
            console.error("Error updating progress:", error);
        }
    };

    const handleNext = async () => {
        const stepsCompleted = [...new Set([...progress.steps_completed || [], `step${currentStep}`])];
        const nextStep = currentStep + 1;

        let updates = {
            current_step: nextStep,
            steps_completed: stepsCompleted
        };

        // Step-specific updates
        if (currentStep === 2) {
            updates.church_name = formData.church_name;
            updates.church_phone = formData.church_phone;
            updates.church_address = formData.church_address;

            // Update ChurchSettings
            try {
                const settings = await base44.entities.ChurchSettings.list();
                const settingsData = {
                    church_name: formData.church_name,
                    tagline: formData.tagline || ''
                };

                if (settings.length > 0) {
                    await base44.entities.ChurchSettings.update(settings[0].id, settingsData);
                } else {
                    await base44.entities.ChurchSettings.create(settingsData);
                }
            } catch (err) {
                console.error("Error updating church settings:", err);
            }
        }

        if (currentStep === 3) {
            updates.point_of_contact = formData.point_of_contact;
            updates.church_phone = formData.contact_phone;
        }

        if (currentStep === 4) {
            updates.stripe_connected = formData.stripe_connected;
            updates.bank_account_added = formData.bank_account_added;
        }

        if (nextStep > 6) {
            updates.onboarding_completed = true;
            updates.completion_date = new Date().toISOString();

            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            if (onComplete) onComplete();
        }

        await updateProgress(updates);
        if (nextStep <= 6) {
            setCurrentStep(nextStep);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleConnectStripe = async () => {
        try {
            const currentUrl = window.location.origin + window.location.pathname;
            const response = await base44.functions.invoke('createStripeConnectAccount', {
                church_name: formData.church_name,
                return_url: currentUrl,
                refresh_url: currentUrl
            });

            console.log('Stripe Connect response:', response);

            const onboardingUrl = response.data?.onboarding_url || response?.onboarding_url;
            
            if (onboardingUrl) {
                console.log('Redirecting to Stripe onboarding:', onboardingUrl);
                window.location.href = onboardingUrl;
            } else {
                throw new Error('No onboarding URL received from server');
            }
        } catch (error) {
            console.error('Stripe Connect error:', error);
            alert('Failed to connect Stripe. Please try again or contact support.');
        }
    };

    const progressPercentage = (currentStep / ONBOARDING_STEPS.length) * 100;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (progress?.onboarding_completed) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to the Family!</h2>
                    <p className="text-slate-600 mb-6">
                        Your onboarding is complete. We're excited to have you as part of our community.
                    </p>
                    <Button onClick={onComplete} className="bg-blue-600 hover:bg-blue-700">
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Progress Bar */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        {ONBOARDING_STEPS.map((step) => {
                            const Icon = step.icon;
                            const isCompleted = progress.steps_completed?.includes(`step${step.id}`);
                            const isCurrent = currentStep === step.id;
                            
                            return (
                                <div key={step.id} className="flex flex-col items-center flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                        isCompleted ? 'bg-green-500 text-white' :
                                        isCurrent ? 'bg-blue-600 text-white' :
                                        'bg-slate-200 text-slate-400'
                                    }`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-xs font-medium ${
                                        isCurrent ? 'text-blue-600' : 'text-slate-500'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </CardContent>
            </Card>

            {/* Step Content */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {ONBOARDING_STEPS.find(s => s.id === currentStep)?.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {currentStep === 1 && (
                        <div className="text-center space-y-4">
                            <Building className="w-16 h-16 text-blue-600 mx-auto" />
                            <h2 className="text-2xl font-bold text-slate-900">
                                Welcome to REACH Church Connect!
                            </h2>
                            <p className="text-slate-600 max-w-xl mx-auto">
                                Let's get your church set up in just a few minutes. We'll help you configure your organization profile, 
                                connect payment processing, and get everything ready for your ministry.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    ⏱️ This will take about 5-10 minutes
                                </p>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <p className="text-slate-600 mb-4">
                                Tell us about your church or ministry organization.
                            </p>
                            
                            <div>
                                <Label>Church/Organization Name *</Label>
                                <Input
                                    placeholder="First Community Church"
                                    value={formData.church_name}
                                    onChange={(e) => setFormData({...formData, church_name: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Church Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="+1 (555) 123-4567"
                                        value={formData.church_phone}
                                        onChange={(e) => setFormData({...formData, church_phone: e.target.value})}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Church Address</Label>
                                <Textarea
                                    placeholder="123 Main Street, City, State, ZIP"
                                    value={formData.church_address}
                                    onChange={(e) => setFormData({...formData, church_address: e.target.value})}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <p className="text-slate-600 mb-4">
                                Who should we contact for important updates and support?
                            </p>
                            
                            <div>
                                <Label>Primary Point of Contact *</Label>
                                <Input
                                    placeholder="Pastor John Smith"
                                    value={formData.point_of_contact}
                                    onChange={(e) => setFormData({...formData, point_of_contact: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Contact Phone Number *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="+1 (555) 123-4567"
                                        value={formData.contact_phone}
                                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Contact Email</Label>
                                <Input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                                    disabled
                                />
                                <p className="text-xs text-slate-500 mt-1">Using your login email</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <p className="text-slate-600 mb-4">
                                Connect Stripe to accept online donations and process payments.
                            </p>

                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                                <div className="flex items-start gap-4 mb-4">
                                    <CreditCard className="w-10 h-10 text-purple-600 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">Stripe Connect Setup</h3>
                                        <p className="text-sm text-slate-600 mb-3">
                                            Stripe is the payment processor used by churches worldwide. It's secure, reliable, 
                                            and deposits donations directly to your bank account.
                                        </p>
                                        <ul className="text-sm text-slate-700 space-y-1">
                                            <li>✓ Secure payment processing</li>
                                            <li>✓ Direct bank deposits (2-3 business days)</li>
                                            <li>✓ Automatic donation receipts</li>
                                            <li>✓ Credit card, debit card, and bank transfers</li>
                                        </ul>
                                    </div>
                                </div>

                                {!formData.stripe_connected ? (
                                    <Button 
                                        onClick={handleConnectStripe}
                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                    >
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Connect Stripe Account
                                    </Button>
                                ) : (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                        <div>
                                            <p className="font-semibold text-green-900">Stripe Connected!</p>
                                            <p className="text-sm text-green-700">Your payment processing is ready</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2">💡 You'll Need</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Your church's EIN/Tax ID number</li>
                                    <li>• Bank account and routing numbers</li>
                                    <li>• Business representative's information</li>
                                </ul>
                            </div>

                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="bank_added"
                                    checked={formData.bank_account_added}
                                    onChange={(e) => setFormData({...formData, bank_account_added: e.target.checked})}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="bank_added" className="cursor-pointer">
                                    I've added my bank account in Stripe
                                </Label>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <p className="text-slate-600 mb-4">
                                Your app is already mobile-ready with Progressive Web App (PWA) features!
                            </p>

                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                                <div className="flex items-start gap-4 mb-4">
                                    <Smartphone className="w-10 h-10 text-purple-600 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">Mobile Features Enabled</h3>
                                        <ul className="text-sm text-slate-700 space-y-2">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span><strong>Install on Home Screen:</strong> Members can install your app like a native app - no App Store needed!</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span><strong>Push Notifications:</strong> Send instant alerts for announcements and events</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span><strong>Mobile Navigation:</strong> Beautiful bottom nav bar optimized for phones</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span><strong>Offline Support:</strong> Clear indicators when connection is lost</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
                                <p className="text-sm text-blue-800">
                                    Members will see an automatic prompt to install the app after using it for a few seconds. 
                                    They can also install it manually from their browser menu: "Add to Home Screen" or "Install App"
                                </p>
                            </div>
                        </div>
                    )}

                    {currentStep === 6 && (
                        <div className="text-center space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                            <h2 className="text-2xl font-bold text-slate-900">
                                Setup Complete! 🎉
                            </h2>
                            <p className="text-slate-600 max-w-xl mx-auto">
                                Your church is now ready to use REACH Church Connect. You can start managing members, 
                                accepting donations, scheduling events, and engaging your congregation.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-6 text-left">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="font-semibold text-green-900 mb-2">✓ Organization Profile</h4>
                                    <p className="text-sm text-green-700">{formData.church_name}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-blue-900 mb-2">✓ Contact Information</h4>
                                    <p className="text-sm text-blue-700">{formData.point_of_contact}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 className="font-semibold text-purple-900 mb-2">✓ Payment Processing</h4>
                                    <p className="text-sm text-purple-700">
                                        {formData.stripe_connected ? 'Stripe Connected' : 'Ready to connect'}
                                    </p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                    <h4 className="font-semibold text-amber-900 mb-2">✓ Bank Account</h4>
                                    <p className="text-sm text-amber-700">
                                        {formData.bank_account_added ? 'Connected' : 'Pending setup'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6 border-t">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={
                                (currentStep === 2 && !formData.church_name) ||
                                (currentStep === 3 && (!formData.point_of_contact || !formData.contact_phone))
                            }
                        >
                            {currentStep === 6 ? 'Complete Setup & Go to Dashboard' : 'Next'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}