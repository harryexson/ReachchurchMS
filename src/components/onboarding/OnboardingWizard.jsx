import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, ArrowLeft, Building, CreditCard, Phone, Smartphone, Users, Heart, Calendar, MessageSquare, Zap, BookOpen, Home } from "lucide-react";
import confetti from "canvas-confetti";
import { createPageUrl } from "@/utils";

export default function OnboardingWizard({ userEmail, userName, userType = "admin", onComplete }) {
    const isMember = userType === "member";
    
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
    const [memberInfo, setMemberInfo] = useState({
        interests: [],
        communication_preferences: []
    });

    const adminSteps = [
        { id: 1, title: "Welcome", icon: Building },
        { id: 2, title: "Church Info", icon: Building },
        { id: 3, title: "Contact", icon: Phone },
        { id: 4, title: "Payments", icon: CreditCard },
        { id: 5, title: "Mobile App", icon: Smartphone },
        { id: 6, title: "Complete", icon: CheckCircle }
    ];

    const memberSteps = [
        { id: 1, title: "Welcome", icon: Home },
        { id: 2, title: "Interests", icon: Heart },
        { id: 3, title: "Stay Connected", icon: MessageSquare },
        { id: 4, title: "Complete", icon: CheckCircle }
    ];

    const steps = isMember ? memberSteps : adminSteps;

    useEffect(() => {
        loadProgress();
    }, []);

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
        if (isMember) {
            // Member onboarding flow
            if (currentStep === memberSteps.length) {
                try {
                    await base44.auth.updateMe({
                        interests: memberInfo.interests.join(', '),
                        communication_preferences: memberInfo.communication_preferences.join(', ')
                    });

                    await updateProgress({
                        onboarding_completed: true,
                        completion_date: new Date().toISOString()
                    });

                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                } catch (error) {
                    console.error("Failed to complete onboarding:", error);
                }
                onComplete();
            } else {
                setCurrentStep(currentStep + 1);
            }
        } else {
            // Admin onboarding flow
            const stepsCompleted = [...new Set([...progress.steps_completed || [], `step${currentStep}`])];
            const nextStep = currentStep + 1;

            let updates = {
                current_step: nextStep,
                steps_completed: stepsCompleted
            };

            if (currentStep === 2) {
                updates.church_name = formData.church_name;
                updates.church_phone = formData.church_phone;
                updates.church_address = formData.church_address;

                // Update ChurchSettings
                try {
                    const settings = await base44.entities.ChurchSettings.list();
                    const settingsData = {
                        church_name: formData.church_name
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
            }

            if (currentStep === 4) {
                updates.stripe_connected = formData.stripe_connected;
                updates.bank_account_added = formData.bank_account_added;
            }

            if (nextStep > 6) {
                updates.onboarding_completed = true;
                updates.completion_date = new Date().toISOString();

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

            const onboardingUrl = response.data?.onboarding_url || response?.onboarding_url;
            
            if (onboardingUrl) {
                window.location.href = onboardingUrl;
            } else {
                throw new Error('No onboarding URL received');
            }
        } catch (error) {
            console.error('Stripe Connect error:', error);
            alert('Failed to connect Stripe. Please try again.');
        }
    };

    const progressPercentage = (currentStep / steps.length) * 100;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (progress?.onboarding_completed && !isMember) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Setup Complete!</h2>
                    <p className="text-slate-600 mb-6">
                        Your church is ready to go.
                    </p>
                    <Button onClick={onComplete} className="bg-blue-600 hover:bg-blue-700">
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const renderMemberStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Home className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome, {userName}!</h2>
                            <p className="text-lg text-slate-600">
                                We're excited to have you as part of our church community.
                            </p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-3">What you can do:</h3>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    View and register for events
                                </li>
                                <li className="flex items-center gap-2">
                                    <Heart className="w-4 h-4" />
                                    Give online securely
                                </li>
                                <li className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Watch sermons and resources
                                </li>
                                <li className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Connect with other members
                                </li>
                            </ul>
                        </div>
                    </div>
                );

            case 2:
                const interestOptions = ["Worship", "Children's Ministry", "Youth Ministry", "Outreach", "Prayer", "Small Groups", "Volunteering", "Music"];
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <Heart className="w-16 h-16 mx-auto mb-4 text-pink-600" />
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">What are you interested in?</h2>
                            <p className="text-slate-600">
                                Help us connect you with the right groups and opportunities
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {interestOptions.map(interest => (
                                <button
                                    key={interest}
                                    onClick={() => {
                                        const interests = memberInfo.interests.includes(interest)
                                            ? memberInfo.interests.filter(i => i !== interest)
                                            : [...memberInfo.interests, interest];
                                        setMemberInfo({ ...memberInfo, interests });
                                    }}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        memberInfo.interests.includes(interest)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <p className="font-medium text-slate-900">{interest}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 3:
                const commPrefs = ["Email", "SMS", "Push Notifications", "In-App Messages"];
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <Users className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Stay Connected</h2>
                            <p className="text-slate-600">
                                How would you like to receive updates from the church?
                            </p>
                        </div>
                        <div className="space-y-3">
                            {commPrefs.map(pref => (
                                <label
                                    key={pref}
                                    className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-slate-300 cursor-pointer transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        checked={memberInfo.communication_preferences.includes(pref)}
                                        onChange={(e) => {
                                            const prefs = e.target.checked
                                                ? [...memberInfo.communication_preferences, pref]
                                                : memberInfo.communication_preferences.filter(p => p !== pref);
                                            setMemberInfo({ ...memberInfo, communication_preferences: prefs });
                                        }}
                                        className="w-5 h-5 rounded"
                                    />
                                    <span className="font-medium text-slate-900">{pref}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6 text-center">
                        <CheckCircle className="w-20 h-20 mx-auto text-green-600" />
                        <h2 className="text-3xl font-bold text-slate-900">You're all set!</h2>
                        <p className="text-lg text-slate-600">
                            Welcome to the community. Let's get started!
                        </p>
                        <div className="grid gap-4 max-w-md mx-auto mt-8">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = createPageUrl('Community')}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                Explore Sermons
                            </Button>
                            <Button className="w-full" variant="outline" onClick={() => window.location.href = createPageUrl('PublicEventsCalendar')}>
                                <Calendar className="w-4 h-4 mr-2" />
                                View Events
                            </Button>
                            <Button className="w-full" variant="outline" onClick={() => window.location.href = createPageUrl('MyGroups')}>
                                <Users className="w-4 h-4 mr-2" />
                                Join a Group
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const renderAdminStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="text-center space-y-4">
                        <Building className="w-16 h-16 text-blue-600 mx-auto" />
                        <h2 className="text-2xl font-bold text-slate-900">
                            Welcome to REACH Church Connect!
                        </h2>
                        <p className="text-slate-600 max-w-xl mx-auto">
                            Let's get your church set up in just a few minutes. We'll help you configure everything.
                        </p>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 mt-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-4">Your Complete Church Platform</h3>
                            <div className="grid md:grid-cols-3 gap-4 text-sm text-left">
                                <div>
                                    <h4 className="font-semibold text-green-900 mb-2">💰 Giving & Finance</h4>
                                    <ul className="space-y-1 text-green-800">
                                        <li>• Online giving portal</li>
                                        <li>• Kiosk stations</li>
                                        <li>• Text-to-give</li>
                                        <li>• QR code donations</li>
                                        <li>• Auto receipts</li>
                                        <li>• Financial reports</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-blue-900 mb-2">📱 Communication</h4>
                                    <ul className="space-y-1 text-blue-800">
                                        <li>• Bulk SMS/MMS</li>
                                        <li>• Email campaigns</li>
                                        <li>• Push notifications</li>
                                        <li>• In-app messaging</li>
                                        <li>• Automated workflows</li>
                                        <li>• Visitor follow-up</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-purple-900 mb-2">👥 People</h4>
                                    <ul className="space-y-1 text-purple-800">
                                        <li>• Member directory</li>
                                        <li>• Visitor tracking</li>
                                        <li>• Volunteer management</li>
                                        <li>• Event registration</li>
                                        <li>• Kids check-in</li>
                                        <li>• Group management</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <p className="text-slate-600 mb-4">Tell us about your church</p>
                        
                        <div>
                            <Label>Church Name *</Label>
                            <Input
                                placeholder="First Community Church"
                                value={formData.church_name}
                                onChange={(e) => setFormData({...formData, church_name: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <Label>Church Phone</Label>
                            <Input
                                placeholder="+1 (555) 123-4567"
                                value={formData.church_phone}
                                onChange={(e) => setFormData({...formData, church_phone: e.target.value})}
                            />
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
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <p className="text-slate-600 mb-4">
                            Who should we contact for important updates?
                        </p>
                        
                        <div>
                            <Label>Primary Contact Name *</Label>
                            <Input
                                placeholder="Pastor John Smith"
                                value={formData.point_of_contact}
                                onChange={(e) => setFormData({...formData, point_of_contact: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <Label>Contact Phone *</Label>
                            <Input
                                placeholder="+1 (555) 123-4567"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <Label>Contact Email</Label>
                            <Input
                                type="email"
                                value={formData.contact_email}
                                disabled
                            />
                            <p className="text-xs text-slate-500 mt-1">Using your login email</p>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <p className="text-slate-600 mb-4">
                            Connect Stripe to accept donations
                        </p>

                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                            <CreditCard className="w-10 h-10 text-purple-600 mb-4" />
                            <h3 className="font-bold text-slate-900 mb-2">Stripe Connect</h3>
                            <p className="text-sm text-slate-600 mb-3">
                                Secure payment processing with direct deposits to your bank
                            </p>
                            <ul className="text-sm text-slate-700 space-y-1 mb-4">
                                <li>✓ Accept credit/debit cards</li>
                                <li>✓ Automatic receipts</li>
                                <li>✓ 2-3 day deposits</li>
                            </ul>

                            {!formData.stripe_connected ? (
                                <Button 
                                    onClick={handleConnectStripe}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                >
                                    Connect Stripe
                                </Button>
                            ) : (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <div>
                                        <p className="font-semibold text-green-900">Connected!</p>
                                        <p className="text-sm text-green-700">Ready to accept donations</p>
                                    </div>
                                </div>
                            )}
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
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <Smartphone className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Mobile App Ready!</h2>
                            <p className="text-slate-600">
                                Your app works as a Progressive Web App (PWA)
                            </p>
                        </div>

                        <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                            <h3 className="font-bold text-slate-900 mb-4">Mobile Features Included:</h3>
                            <ul className="text-sm text-slate-700 space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>Install on home screen (no App Store)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>Push notifications for announcements</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>Mobile-optimized interface</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>Offline indicators</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="text-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                        <h2 className="text-2xl font-bold text-slate-900">
                            Setup Complete! 🎉
                        </h2>
                        <p className="text-slate-600 max-w-xl mx-auto">
                            Your church is ready to use REACH Church Connect.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 mt-6 text-left">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h4 className="font-semibold text-green-900 mb-2">✓ Quick Start</h4>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>• Add members</li>
                                    <li>• Create events</li>
                                    <li>• Set up workflows</li>
                                </ul>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2">✓ Resources</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Video tutorials</li>
                                    <li>• Help center</li>
                                    <li>• 24/7 support</li>
                                </ul>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <h4 className="font-semibold text-purple-900 mb-2">✓ Automation</h4>
                                <ul className="text-sm text-purple-700 space-y-1">
                                    <li>• Visitor follow-up</li>
                                    <li>• Event reminders</li>
                                    <li>• Welcome workflows</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        {steps.map((step) => {
                            const Icon = step.icon;
                            const isCompleted = progress?.steps_completed?.includes(`step${step.id}`);
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

            <Card>
                <CardHeader>
                    <CardTitle>
                        {steps.find(s => s.id === currentStep)?.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {isMember ? renderMemberStepContent() : renderAdminStepContent()}

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
                                (!isMember && currentStep === 2 && !formData.church_name) ||
                                (!isMember && currentStep === 3 && (!formData.point_of_contact || !formData.contact_phone))
                            }
                        >
                            {currentStep === steps.length ? 'Complete & Start' : 'Next'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}