import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, ArrowLeft, Heart, User, BookOpen, Mail, Phone } from "lucide-react";
import confetti from "canvas-confetti";

const MINISTRY_INTERESTS = [
    { value: "worship_team", label: "Worship Team" },
    { value: "children_ministry", label: "Children's Ministry" },
    { value: "youth_ministry", label: "Youth Ministry" },
    { value: "hospitality", label: "Hospitality" },
    { value: "prayer_team", label: "Prayer Team" },
    { value: "outreach", label: "Outreach" },
    { value: "small_groups", label: "Small Groups" },
    { value: "missions", label: "Missions" }
];

const ONBOARDING_STEPS = [
    { id: 1, title: "Welcome", icon: Heart },
    { id: 2, title: "Personal Info", icon: User },
    { id: 3, title: "Interests", icon: Heart },
    { id: 4, title: "Resources", icon: BookOpen },
    { id: 5, title: "Complete", icon: CheckCircle }
];

export default function OnboardingWizard({ userEmail, userName, userType = "visitor", onComplete }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [progress, setProgress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        phone: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        birth_date: "",
        gender: "",
        age_group: "",
        interests: [],
        resources_viewed: []
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
                if (existing[0].personal_info) {
                    setFormData(prev => ({
                        ...prev,
                        ...existing[0].personal_info,
                        interests: existing[0].interests_selected || [],
                        resources_viewed: existing[0].resources_viewed || []
                    }));
                }
            } else {
                const newProgress = await base44.entities.OnboardingProgress.create({
                    user_email: userEmail,
                    user_name: userName,
                    user_type: userType,
                    current_step: 1,
                    completed_steps: []
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
        const completedSteps = [...new Set([...progress.completed_steps, currentStep])];
        const nextStep = currentStep + 1;

        let updates = {
            current_step: nextStep,
            completed_steps: completedSteps
        };

        // Step-specific updates
        if (currentStep === 2) {
            updates.basic_info_completed = true;
            updates.personal_info = {
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zip_code: formData.zip_code,
                birth_date: formData.birth_date,
                gender: formData.gender,
                age_group: formData.age_group
            };

            // Create or update member record
            try {
                const members = await base44.entities.Member.filter({ email: userEmail });
                const memberData = {
                    first_name: userName.split(' ')[0],
                    last_name: userName.split(' ').slice(1).join(' '),
                    email: userEmail,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zip_code,
                    birth_date: formData.birth_date,
                    gender: formData.gender,
                    age_group: formData.age_group,
                    member_status: userType === "member" ? "member" : "visitor"
                };

                if (members.length > 0) {
                    await base44.entities.Member.update(members[0].id, memberData);
                } else {
                    await base44.entities.Member.create(memberData);
                }
            } catch (err) {
                console.error("Error updating member:", err);
            }
        }

        if (currentStep === 3) {
            updates.interests_selected = formData.interests;
            updates.roles_assigned = formData.interests;

            // Update member interests
            try {
                const members = await base44.entities.Member.filter({ email: userEmail });
                if (members.length > 0) {
                    await base44.entities.Member.update(members[0].id, {
                        ministry_involvement: formData.interests
                    });
                }
            } catch (err) {
                console.error("Error updating member interests:", err);
            }
        }

        if (currentStep === 4) {
            updates.resources_viewed = formData.resources_viewed;
        }

        if (nextStep > 5) {
            updates.onboarding_completed = true;
            updates.completion_date = new Date().toISOString();
            
            // Send welcome email
            if (!progress.welcome_email_sent) {
                try {
                    await base44.functions.invoke('sendWelcomeEmail', {
                        email: userEmail,
                        name: userName,
                        userType: userType
                    });
                    updates.welcome_email_sent = true;
                } catch (err) {
                    console.error("Error sending welcome email:", err);
                }
            }

            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            if (onComplete) onComplete();
        }

        await updateProgress(updates);
        if (nextStep <= 5) {
            setCurrentStep(nextStep);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const toggleInterest = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const markResourceViewed = (resourceId) => {
        if (!formData.resources_viewed.includes(resourceId)) {
            setFormData(prev => ({
                ...prev,
                resources_viewed: [...prev.resources_viewed, resourceId]
            }));
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
                            const isCompleted = progress.completed_steps.includes(step.id);
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
                            <Heart className="w-16 h-16 text-red-500 mx-auto" />
                            <h2 className="text-2xl font-bold text-slate-900">
                                Welcome, {userName}!
                            </h2>
                            <p className="text-slate-600 max-w-xl mx-auto">
                                We're thrilled to have you join our church community. This quick setup will help us 
                                personalize your experience and connect you with ministries that match your interests.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    ⏱️ This will take about 3-5 minutes
                                </p>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <p className="text-slate-600 mb-4">
                                Help us get to know you better by sharing some basic information.
                            </p>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="(555) 123-4567"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Birth Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <Label>Gender</Label>
                                    <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Age Group</Label>
                                    <Select value={formData.age_group} onValueChange={(v) => setFormData({...formData, age_group: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="child">Child (0-12)</SelectItem>
                                            <SelectItem value="teen">Teen (13-17)</SelectItem>
                                            <SelectItem value="young_adult">Young Adult (18-35)</SelectItem>
                                            <SelectItem value="adult">Adult (36-59)</SelectItem>
                                            <SelectItem value="senior">Senior (60+)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Address</Label>
                                <Input
                                    placeholder="123 Main Street"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                />
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <Label>City</Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>State</Label>
                                    <Input
                                        value={formData.state}
                                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>ZIP Code</Label>
                                    <Input
                                        value={formData.zip_code}
                                        onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <p className="text-slate-600 mb-4">
                                Select the ministries and activities you're interested in. We'll help connect you with these areas.
                            </p>
                            
                            <div className="grid md:grid-cols-2 gap-3">
                                {MINISTRY_INTERESTS.map(ministry => (
                                    <button
                                        key={ministry.value}
                                        onClick={() => toggleInterest(ministry.value)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                                            formData.interests.includes(ministry.value)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-900">{ministry.label}</span>
                                            {formData.interests.includes(ministry.value) && (
                                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="bg-amber-50 p-4 rounded-lg mt-4">
                                <p className="text-sm text-amber-900">
                                    💡 Selected {formData.interests.length} interest{formData.interests.length !== 1 ? 's' : ''}. 
                                    You can always update these later in your profile.
                                </p>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <p className="text-slate-600 mb-4">
                                Here are some resources to help you get started:
                            </p>

                            <div className="space-y-3">
                                {[
                                    { id: 'guide1', title: 'New Member Guide', description: 'Everything you need to know about our church' },
                                    { id: 'guide2', title: 'Ministry Opportunities', description: 'Ways to get involved and serve' },
                                    { id: 'guide3', title: 'Small Groups Directory', description: 'Find a group that fits your schedule' },
                                    { id: 'guide4', title: 'Upcoming Events', description: 'See what\'s happening this month' }
                                ].map(resource => (
                                    <Card key={resource.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="w-8 h-8 text-blue-600" />
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">{resource.title}</h4>
                                                    <p className="text-sm text-slate-600">{resource.description}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    markResourceViewed(resource.id);
                                                    window.open('#', '_blank');
                                                }}
                                                className={formData.resources_viewed.includes(resource.id) ? 'bg-green-50' : ''}
                                            >
                                                {formData.resources_viewed.includes(resource.id) ? 'Viewed' : 'View'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="text-center space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                            <h2 className="text-2xl font-bold text-slate-900">
                                You're All Set!
                            </h2>
                            <p className="text-slate-600 max-w-xl mx-auto">
                                Thank you for completing your onboarding. We've sent a welcome email with additional 
                                information and next steps.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-900 font-medium">
                                    📧 Check your email for your welcome package and ministry coordinator contacts
                                </p>
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
                        >
                            {currentStep === 5 ? 'Finish' : 'Next'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}