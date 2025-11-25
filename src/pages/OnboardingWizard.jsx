import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Church, Users, Heart, Calendar, MessageSquare, Video, 
    CheckCircle, ArrowRight, ArrowLeft, Upload, Palette,
    DollarSign, Settings, Sparkles, Baby, Coffee, Book,
    Globe, Mail, Phone, MapPin, Loader2
} from 'lucide-react';
import { createPageUrl } from '@/utils';

const STEPS = [
    { id: 'welcome', title: 'Welcome', icon: Sparkles },
    { id: 'church-info', title: 'Church Info', icon: Church },
    { id: 'branding', title: 'Branding', icon: Palette },
    { id: 'features', title: 'Features', icon: Settings },
    { id: 'giving', title: 'Giving Setup', icon: DollarSign },
    { id: 'complete', title: 'Complete', icon: CheckCircle },
];

export default function OnboardingWizard() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [existingSettings, setExistingSettings] = useState(null);
    
    const [formData, setFormData] = useState({
        // Church Info
        church_name: '',
        tagline: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        
        // Branding
        logo_url: '',
        hero_image_url: '',
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        
        // Features
        features: {
            members: true,
            events: true,
            giving: true,
            visitors: true,
            volunteers: false,
            sms: false,
            video: false,
            kids_checkin: false,
            coffee_shop: false,
            bookstore: false,
        },
        
        // Giving
        donation_goal_monthly: '',
        donation_goal_title: '',
        donation_goal_description: '',
        show_goal_on_public_page: true,
    });

    useEffect(() => {
        loadUserAndSettings();
    }, []);

    const loadUserAndSettings = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            // Check if user already has settings (not first time)
            const settings = await base44.entities.ChurchSettings.filter({});
            if (settings.length > 0) {
                setExistingSettings(settings[0]);
                // Pre-populate form with existing data
                setFormData(prev => ({
                    ...prev,
                    church_name: settings[0].church_name || '',
                    tagline: settings[0].tagline || '',
                    logo_url: settings[0].logo_url || '',
                    hero_image_url: settings[0].hero_image_url || '',
                    primary_color: settings[0].primary_color || '#3b82f6',
                    secondary_color: settings[0].secondary_color || '#8b5cf6',
                    donation_goal_monthly: settings[0].donation_goal_monthly || '',
                    donation_goal_title: settings[0].donation_goal_title || '',
                    donation_goal_description: settings[0].donation_goal_description || '',
                    show_goal_on_public_page: settings[0].show_goal_on_public_page !== false,
                }));
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
        setIsLoading(false);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFeatureToggle = (feature) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: !prev.features[feature]
            }
        }));
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            handleInputChange(field, file_url);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const settingsData = {
                church_name: formData.church_name,
                tagline: formData.tagline,
                logo_url: formData.logo_url,
                hero_image_url: formData.hero_image_url,
                primary_color: formData.primary_color,
                secondary_color: formData.secondary_color,
                donation_goal_monthly: formData.donation_goal_monthly ? parseFloat(formData.donation_goal_monthly) : null,
                donation_goal_title: formData.donation_goal_title,
                donation_goal_description: formData.donation_goal_description,
                show_goal_on_public_page: formData.show_goal_on_public_page,
            };

            if (existingSettings) {
                await base44.entities.ChurchSettings.update(existingSettings.id, settingsData);
            } else {
                await base44.entities.ChurchSettings.create(settingsData);
            }

            // Update user with onboarding completed flag
            await base44.auth.updateMe({
                onboarding_completed: true,
                church_name: formData.church_name,
            });

        } catch (error) {
            console.error('Error saving settings:', error);
        }
        setIsSaving(false);
    };

    const nextStep = async () => {
        if (currentStep === STEPS.length - 2) {
            // Before going to complete, save everything
            await saveSettings();
        }
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const goToDashboard = () => {
        navigate(createPageUrl('Dashboard'));
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Church className="w-8 h-8 text-blue-600" />
                            <span className="font-bold text-xl text-slate-900">REACH Church Connect</span>
                        </div>
                        <Badge variant="outline" className="text-sm">
                            Step {currentStep + 1} of {STEPS.length}
                        </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    
                    {/* Step Indicators */}
                    <div className="flex justify-between mt-4">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = idx === currentStep;
                            const isCompleted = idx < currentStep;
                            return (
                                <div 
                                    key={step.id} 
                                    className={`flex flex-col items-center gap-1 ${
                                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-slate-100'
                                    }`}>
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <Icon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className="text-xs hidden md:block">{step.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Step 0: Welcome */}
                {currentStep === 0 && (
                    <Card className="border-0 shadow-xl">
                        <CardContent className="p-8 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-4">
                                Welcome to REACH Church Connect!
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
                                Let's get your church set up in just a few minutes. We'll guide you through 
                                the essential configuration to get you up and running.
                            </p>
                            
                            <div className="grid md:grid-cols-3 gap-4 mb-8">
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <Church className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-slate-900">Church Profile</h3>
                                    <p className="text-sm text-slate-600">Basic info & branding</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-xl">
                                    <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-slate-900">Choose Features</h3>
                                    <p className="text-sm text-slate-600">Enable what you need</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl">
                                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-slate-900">Giving Setup</h3>
                                    <p className="text-sm text-slate-600">Start accepting donations</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500">
                                This should only take about 5 minutes. You can always change these settings later.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Step 1: Church Info */}
                {currentStep === 1 && (
                    <Card className="border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Church className="w-6 h-6 text-blue-600" />
                                Church Information
                            </CardTitle>
                            <CardDescription>
                                Tell us about your church. This information will appear throughout the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="church_name">Church Name *</Label>
                                    <Input
                                        id="church_name"
                                        value={formData.church_name}
                                        onChange={(e) => handleInputChange('church_name', e.target.value)}
                                        placeholder="e.g., Grace Community Church"
                                        className="mt-1"
                                    />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <Label htmlFor="tagline">Tagline / Mission Statement</Label>
                                    <Input
                                        id="tagline"
                                        value={formData.tagline}
                                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                                        placeholder="e.g., Connecting people to God and each other"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <div className="relative mt-1">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            placeholder="123 Main St, City, State 12345"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative mt-1">
                                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="(555) 123-4567"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="email">Contact Email</Label>
                                    <div className="relative mt-1">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="info@yourchurch.org"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="website">Website</Label>
                                    <div className="relative mt-1">
                                        <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="website"
                                            value={formData.website}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                            placeholder="https://www.yourchurch.org"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Branding */}
                {currentStep === 2 && (
                    <Card className="border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-6 h-6 text-purple-600" />
                                Branding & Appearance
                            </CardTitle>
                            <CardDescription>
                                Customize how your church appears in the system and on public pages.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Logo Upload */}
                            <div>
                                <Label>Church Logo</Label>
                                <div className="mt-2 flex items-center gap-4">
                                    <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                                        {formData.logo_url ? (
                                            <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'logo_url')}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label htmlFor="logo-upload">
                                            <Button variant="outline" asChild>
                                                <span className="cursor-pointer">
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Upload Logo
                                                </span>
                                            </Button>
                                        </label>
                                        <p className="text-xs text-slate-500 mt-1">PNG or JPG, max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Image Upload */}
                            <div>
                                <Label>Hero Image (Optional)</Label>
                                <p className="text-sm text-slate-500 mb-2">This appears on your public giving page</p>
                                <div className="mt-2">
                                    <div className="w-full h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                                        {formData.hero_image_url ? (
                                            <img src={formData.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <span className="text-sm text-slate-500">Upload a hero image</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'hero_image_url')}
                                        className="hidden"
                                        id="hero-upload"
                                    />
                                    <label htmlFor="hero-upload">
                                        <Button variant="outline" className="mt-2" asChild>
                                            <span className="cursor-pointer">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Hero Image
                                            </span>
                                        </Button>
                                    </label>
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="primary_color">Primary Color</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="color"
                                            id="primary_color"
                                            value={formData.primary_color}
                                            onChange={(e) => handleInputChange('primary_color', e.target.value)}
                                            className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                                        />
                                        <Input
                                            value={formData.primary_color}
                                            onChange={(e) => handleInputChange('primary_color', e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="secondary_color">Secondary Color</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="color"
                                            id="secondary_color"
                                            value={formData.secondary_color}
                                            onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                                            className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                                        />
                                        <Input
                                            value={formData.secondary_color}
                                            onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <Label className="mb-3 block">Preview</Label>
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: formData.primary_color }}
                                    >
                                        <Church className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{formData.church_name || 'Your Church Name'}</h3>
                                        <p className="text-sm" style={{ color: formData.secondary_color }}>
                                            {formData.tagline || 'Your tagline here'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Features */}
                {currentStep === 3 && (
                    <Card className="border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-6 h-6 text-blue-600" />
                                Choose Your Features
                            </CardTitle>
                            <CardDescription>
                                Select the features you want to use. You can enable more later.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    { id: 'members', icon: Users, title: 'Member Management', desc: 'Track members, families, and groups', included: true },
                                    { id: 'events', icon: Calendar, title: 'Events & Calendar', desc: 'Schedule and manage church events', included: true },
                                    { id: 'giving', icon: DollarSign, title: 'Online Giving', desc: 'Accept donations online', included: true },
                                    { id: 'visitors', icon: Heart, title: 'Visitor Tracking', desc: 'Track and follow up with visitors', included: true },
                                    { id: 'volunteers', icon: Users, title: 'Volunteer Management', desc: 'Coordinate volunteer schedules', included: true },
                                    { id: 'sms', icon: MessageSquare, title: 'SMS Messaging', desc: 'Send text messages to members', badge: 'Growth+' },
                                    { id: 'video', icon: Video, title: 'Video Meetings', desc: 'Host virtual meetings', badge: 'Growth+' },
                                    { id: 'kids_checkin', icon: Baby, title: 'Kids Check-In', desc: 'Secure child check-in system', badge: 'Growth+' },
                                    { id: 'coffee_shop', icon: Coffee, title: 'Coffee Shop POS', desc: 'Manage coffee shop sales', badge: 'Growth+' },
                                    { id: 'bookstore', icon: Book, title: 'Bookstore', desc: 'Sell books and merchandise', badge: 'Growth+' },
                                ].map((feature) => {
                                    const Icon = feature.icon;
                                    const isEnabled = formData.features[feature.id];
                                    return (
                                        <div
                                            key={feature.id}
                                            onClick={() => handleFeatureToggle(feature.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                isEnabled 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    isEnabled ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                                                        {feature.badge && (
                                                            <Badge variant="outline" className="text-xs">{feature.badge}</Badge>
                                                        )}
                                                        {feature.included && (
                                                            <Badge className="bg-green-100 text-green-800 text-xs">Included</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600">{feature.desc}</p>
                                                </div>
                                                <Checkbox checked={isEnabled} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Giving Setup */}
                {currentStep === 4 && (
                    <Card className="border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-6 h-6 text-green-600" />
                                Giving Setup
                            </CardTitle>
                            <CardDescription>
                                Configure your online giving page and donation goals.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                <h3 className="font-semibold text-green-900 mb-2">💡 Start Accepting Donations Immediately</h3>
                                <p className="text-sm text-green-800">
                                    Your public giving page is ready to go. You can connect your Stripe account 
                                    in Settings to start receiving donations directly to your bank account.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="donation_goal_title">Donation Goal Title (Optional)</Label>
                                <Input
                                    id="donation_goal_title"
                                    value={formData.donation_goal_title}
                                    onChange={(e) => handleInputChange('donation_goal_title', e.target.value)}
                                    placeholder="e.g., Building Fund, Monthly Operations"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="donation_goal_monthly">Monthly Goal Amount</Label>
                                <div className="relative mt-1">
                                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="donation_goal_monthly"
                                        type="number"
                                        value={formData.donation_goal_monthly}
                                        onChange={(e) => handleInputChange('donation_goal_monthly', e.target.value)}
                                        placeholder="10000"
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="donation_goal_description">Goal Description</Label>
                                <Textarea
                                    id="donation_goal_description"
                                    value={formData.donation_goal_description}
                                    onChange={(e) => handleInputChange('donation_goal_description', e.target.value)}
                                    placeholder="Help us reach our monthly goal to support church operations..."
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="show_goal"
                                    checked={formData.show_goal_on_public_page}
                                    onCheckedChange={(checked) => handleInputChange('show_goal_on_public_page', checked)}
                                />
                                <Label htmlFor="show_goal" className="cursor-pointer">
                                    Show donation goal progress on public giving page
                                </Label>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 5: Complete */}
                {currentStep === 5 && (
                    <Card className="border-0 shadow-xl">
                        <CardContent className="p-8 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-4">
                                You're All Set! 🎉
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
                                <strong>{formData.church_name || 'Your church'}</strong> is now set up in REACH Church Connect. 
                                You can start managing your church right away!
                            </p>

                            <div className="grid md:grid-cols-3 gap-4 mb-8">
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-slate-900">Add Members</h3>
                                    <p className="text-sm text-slate-600">Start adding your congregation</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl">
                                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-slate-900">Connect Stripe</h3>
                                    <p className="text-sm text-slate-600">Start receiving donations</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-xl">
                                    <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-slate-900">Create Events</h3>
                                    <p className="text-sm text-slate-600">Schedule your first event</p>
                                </div>
                            </div>

                            <Button 
                                size="lg" 
                                onClick={goToDashboard}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                Go to Dashboard
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={currentStep === 0 ? 'invisible' : ''}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {currentStep < STEPS.length - 1 && (
                        <Button 
                            onClick={nextStep}
                            disabled={currentStep === 1 && !formData.church_name}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    {currentStep === STEPS.length - 2 ? 'Complete Setup' : 'Continue'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Skip Link */}
                {currentStep > 0 && currentStep < STEPS.length - 1 && (
                    <div className="text-center mt-4">
                        <button 
                            onClick={goToDashboard}
                            className="text-sm text-slate-500 hover:text-slate-700 underline"
                        >
                            Skip setup and go to dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}