import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowRight, Heart, Users, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MemberOnboarding() {
    const [currentUser, setCurrentUser] = useState(null);
    const [onboarding, setOnboarding] = useState(null);
    const [member, setMember] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedMinistries, setSelectedMinistries] = useState([]);

    const steps = [
        { 
            id: 1, 
            key: 'welcome',
            title: 'Welcome', 
            icon: Sparkles,
            description: 'Get started with your journey'
        },
        { 
            id: 2, 
            key: 'profile_complete',
            title: 'Complete Profile', 
            icon: Users,
            description: 'Tell us about yourself'
        },
        { 
            id: 3, 
            key: 'ministry_exploration',
            title: 'Explore Ministries', 
            icon: Heart,
            description: 'Find where you belong'
        },
        { 
            id: 4, 
            key: 'church_values',
            title: 'Church Values', 
            icon: BookOpen,
            description: 'Learn what we believe'
        },
        { 
            id: 5, 
            key: 'connect_community',
            title: 'Connect', 
            icon: MessageSquare,
            description: 'Join the community'
        }
    ];

    useEffect(() => {
        loadOnboardingData();
    }, []);

    const loadOnboardingData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Get member record
            const memberRecords = await base44.entities.Member.filter({ email: user.email });
            if (memberRecords.length === 0) {
                throw new Error('Member record not found');
            }
            const memberRecord = memberRecords[0];
            setMember(memberRecord);

            // Get onboarding record
            const onboardingRecords = await base44.entities.MemberOnboarding.filter({ 
                member_email: user.email 
            });
            
            if (onboardingRecords.length > 0) {
                const ob = onboardingRecords[0];
                setOnboarding(ob);
                setCurrentStep(ob.current_step || 1);
                setSelectedMinistries(ob.selected_ministries || []);
            }

            // Pre-fill form with member data
            setFormData({
                phone: memberRecord.phone || '',
                address: memberRecord.address || '',
                city: memberRecord.city || '',
                state: memberRecord.state || '',
                zip_code: memberRecord.zip_code || '',
                birth_date: memberRecord.birth_date || '',
                gender: memberRecord.gender || '',
                age_group: memberRecord.age_group || '',
                bio: memberRecord.bio || ''
            });

        } catch (error) {
            console.error('Error loading onboarding:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const completeStep = async (stepKey) => {
        if (!onboarding) return;

        try {
            const updatedSteps = { ...onboarding.steps_completed, [stepKey]: true };
            const allCompleted = Object.values(updatedSteps).every(v => v);

            await base44.entities.MemberOnboarding.update(onboarding.id, {
                steps_completed: updatedSteps,
                current_step: currentStep + 1,
                onboarding_completed: allCompleted,
                completion_date: allCompleted ? new Date().toISOString() : undefined
            });

            if (allCompleted) {
                // Create completion notification
                await base44.entities.Notification.create({
                    user_email: currentUser.email,
                    title: 'Onboarding Complete! 🎉',
                    message: 'Welcome to the family! You\'re all set to explore everything our church has to offer.',
                    type: 'success',
                    priority: 'normal',
                    created_by: member.created_by
                });
            }

            await loadOnboardingData();
        } catch (error) {
            console.error('Error completing step:', error);
        }
    };

    const handleNext = async () => {
        setIsSaving(true);
        try {
            const step = steps[currentStep - 1];

            // Step-specific actions
            if (step.key === 'profile_complete') {
                await base44.entities.Member.update(member.id, formData);
            } else if (step.key === 'ministry_exploration') {
                await base44.entities.Member.update(member.id, {
                    ministry_involvement: selectedMinistries
                });
                await base44.entities.MemberOnboarding.update(onboarding.id, {
                    selected_ministries: selectedMinistries
                });
            }

            await completeStep(step.key);
            if (currentStep < steps.length) {
                setCurrentStep(currentStep + 1);
            }
        } catch (error) {
            console.error('Error saving step:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const renderStepContent = () => {
        const step = steps[currentStep - 1];

        switch (step.key) {
            case 'welcome':
                return (
                    <div className="text-center space-y-6 py-8">
                        <Sparkles className="w-16 h-16 mx-auto text-blue-600" />
                        <h2 className="text-3xl font-bold text-slate-900">
                            Welcome, {member?.first_name}! 🎉
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            We're so glad you're here! Let's take a few minutes to get you settled in 
                            and help you discover all the amazing ways to connect with our church family.
                        </p>
                        <div className="bg-blue-50 rounded-xl p-6 max-w-xl mx-auto">
                            <p className="text-sm text-blue-900 font-medium mb-3">
                                This quick journey will help you:
                            </p>
                            <ul className="text-left text-sm text-blue-800 space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span>Complete your member profile</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span>Discover ministries that match your interests</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span>Learn about our church values and mission</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span>Connect with our vibrant community</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                );

            case 'profile_complete':
                return (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile</h2>
                            <p className="text-slate-600">Help us get to know you better</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Phone Number</Label>
                                <Input
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div>
                                <Label>Birth Date</Label>
                                <Input
                                    type="date"
                                    value={formData.birth_date || ''}
                                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Gender</Label>
                                <Select 
                                    value={formData.gender || ''} 
                                    onValueChange={(value) => setFormData({...formData, gender: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
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
                                <Select 
                                    value={formData.age_group || ''} 
                                    onValueChange={(value) => setFormData({...formData, age_group: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select age group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="child">Child</SelectItem>
                                        <SelectItem value="teen">Teen</SelectItem>
                                        <SelectItem value="young_adult">Young Adult</SelectItem>
                                        <SelectItem value="adult">Adult</SelectItem>
                                        <SelectItem value="senior">Senior</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Address</Label>
                            <Input
                                value={formData.address || ''}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                placeholder="123 Main Street"
                            />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>City</Label>
                                <Input
                                    value={formData.city || ''}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>State</Label>
                                <Input
                                    value={formData.state || ''}
                                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>ZIP Code</Label>
                                <Input
                                    value={formData.zip_code || ''}
                                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>About You</Label>
                            <Textarea
                                value={formData.bio || ''}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                placeholder="Tell us a bit about yourself..."
                                rows={4}
                            />
                        </div>
                    </div>
                );

            case 'ministry_exploration':
                const ministries = [
                    'Worship & Music', 'Youth Ministry', 'Children\'s Ministry',
                    'Small Groups', 'Outreach & Missions', 'Prayer Ministry',
                    'Media & Technology', 'Hospitality', 'Teaching & Preaching'
                ];

                return (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="text-center mb-8">
                            <Heart className="w-12 h-12 mx-auto mb-4 text-red-600" />
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Explore Our Ministries</h2>
                            <p className="text-slate-600">Select areas where you'd like to get involved</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {ministries.map(ministry => {
                                const isSelected = selectedMinistries.includes(ministry);
                                return (
                                    <Card 
                                        key={ministry}
                                        className={`cursor-pointer transition-all ${
                                            isSelected ? 'border-blue-600 bg-blue-50' : 'hover:border-blue-300'
                                        }`}
                                        onClick={() => {
                                            setSelectedMinistries(prev => 
                                                prev.includes(ministry)
                                                    ? prev.filter(m => m !== ministry)
                                                    : [...prev, ministry]
                                            );
                                        }}
                                    >
                                        <CardContent className="p-4 text-center">
                                            {isSelected && (
                                                <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                            )}
                                            <p className="text-sm font-medium text-slate-900">{ministry}</p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {selectedMinistries.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-800 font-medium">
                                    Great! You've selected {selectedMinistries.length} {selectedMinistries.length === 1 ? 'ministry' : 'ministries'}.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'church_values':
                return (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="text-center mb-8">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Our Church Values</h2>
                            <p className="text-slate-600">What we believe and how we live</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                                <CardHeader>
                                    <CardTitle className="text-lg">❤️ Love & Compassion</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600">
                                        We believe in showing God's love through compassion, kindness, and genuine care for one another.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                                <CardHeader>
                                    <CardTitle className="text-lg">🙏 Prayer & Worship</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600">
                                        Prayer and authentic worship are at the heart of everything we do, connecting us to God.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                                <CardHeader>
                                    <CardTitle className="text-lg">📖 Biblical Truth</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600">
                                        We are committed to teaching and living by the timeless truths found in God's Word.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
                                <CardHeader>
                                    <CardTitle className="text-lg">🤝 Community</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600">
                                        We are stronger together, supporting and encouraging one another in faith and life.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case 'connect_community':
                return (
                    <div className="text-center space-y-6 py-8">
                        <MessageSquare className="w-16 h-16 mx-auto text-green-600" />
                        <h2 className="text-3xl font-bold text-slate-900">
                            You're All Set! 🎊
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Congratulations on completing your onboarding! You're now part of our church family.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-8">
                            <Card className="hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => window.location.href = '/MyGroups'}>
                                <CardContent className="p-6 text-center">
                                    <Users className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                                    <h3 className="font-bold mb-2">Join a Small Group</h3>
                                    <p className="text-sm text-slate-600">Connect with others in a small group setting</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => window.location.href = '/Messages'}>
                                <CardContent className="p-6 text-center">
                                    <MessageSquare className="w-10 h-10 mx-auto mb-3 text-green-600" />
                                    <h3 className="font-bold mb-2">Start Messaging</h3>
                                    <p className="text-sm text-slate-600">Connect with church members</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <p className="text-slate-600">Loading your onboarding...</p>
            </div>
        );
    }

    if (!onboarding) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-slate-600">Onboarding not found. Please contact support.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const completedSteps = Object.values(onboarding.steps_completed || {}).filter(v => v).length;
    const progress = (completedSteps / steps.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Progress Header */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold text-slate-900">Member Onboarding</h1>
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                                {completedSteps} of {steps.length} Complete
                            </Badge>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            <motion.div 
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Step Indicators */}
                <div className="flex justify-between mb-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = onboarding.steps_completed?.[step.key];
                        const isCurrent = currentStep === step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center flex-1">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                    isCompleted ? 'bg-green-600' : isCurrent ? 'bg-blue-600' : 'bg-slate-300'
                                }`}>
                                    {isCompleted ? (
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    ) : (
                                        <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                                    )}
                                </div>
                                <p className={`text-xs text-center ${isCurrent ? 'font-bold text-blue-600' : 'text-slate-600'}`}>
                                    {step.title}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="shadow-xl">
                            <CardContent className="p-8">
                                {renderStepContent()}

                                {/* Navigation */}
                                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                                        disabled={currentStep === 1}
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSaving ? 'Saving...' : currentStep === steps.length ? 'Finish' : 'Next'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}