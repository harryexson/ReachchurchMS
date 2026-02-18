import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Church, MapPin, Phone, Mail, Users, Upload, Loader2, Save, Shield, Palette, AlertCircle, CreditCard, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ChurchSettingsPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [onboardingProgress, setOnboardingProgress] = useState(null);
    const [churchSettings, setChurchSettings] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingHero, setUploadingHero] = useState(false);
    const [isCreatingStripeAccount, setIsCreatingStripeAccount] = useState(false);

    useEffect(() => {
        loadData();
        
        // Check if returning from Stripe Connect
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('stripe_return') === 'success') {
            toast.success('Stripe Connect setup complete! Your account is being verified.');
            // Remove query param
            window.history.replaceState({}, '', createPageUrl('ChurchSettings'));
        } else if (urlParams.get('stripe_return') === 'refresh') {
            toast.info('Please complete your Stripe Connect setup.');
        }
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            
            if (!user) {
                console.error('No user returned from auth.me()');
                throw new Error('Authentication required');
            }
            
            setCurrentUser(user);

            // Check admin access
            if (user.role !== 'admin') {
                toast.error('Only administrators can access church settings');
                window.location.href = createPageUrl('Dashboard');
                return;
            }

            // Load church settings - CRITICAL: Filter by church_admin_email for proper isolation
            const settings = await base44.entities.ChurchSettings.filter({
                church_admin_email: user.email
            });
            if (settings.length > 0) {
                setChurchSettings(settings[0]);
            } else {
                // Create default settings with church_admin_email
                const defaultSettings = {
                    church_name: "",
                    church_admin_email: user.email,
                    logo_url: "",
                    hero_image_url: "",
                    primary_color: "#3b82f6",
                    secondary_color: "#10b981",
                    tagline: "",
                    auto_send_receipts: true
                };
                const created = await base44.entities.ChurchSettings.create(defaultSettings);
                setChurchSettings(created);
            }

            // Load onboarding progress
            const progress = await base44.entities.OnboardingProgress.filter({ user_email: user.email });
            if (progress.length > 0) {
                setOnboardingProgress(progress[0]);
            } else {
                // Create default onboarding progress if none exists
                const defaultProgress = {
                    user_email: user.email,
                    onboarding_completed: false,
                    point_of_contact: "",
                    church_description: "",
                    church_size: "",
                    founded_year: "",
                    church_phone: "",
                    church_email: "",
                    church_address: "",
                    church_website: "",
                    facebook_url: "",
                    instagram_url: "",
                    youtube_url: ""
                };
                const created = await base44.entities.OnboardingProgress.create(defaultProgress);
                setOnboardingProgress(created);
                console.log('✅ Created default onboarding progress:', created.id);
            }
        } catch (error) {
            console.error('Failed to load church settings:', error);
            
            // If auth fails when returning from Stripe, try reloading once
            const urlParams = new URLSearchParams(window.location.search);
            const isReturningFromStripe = urlParams.get('stripe_return') === 'success' || urlParams.get('stripe_return') === 'refresh';
            
            if (isReturningFromStripe && !currentUser) {
                console.log('Auth issue after Stripe redirect - reloading page');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                return;
            }
            
            toast.error('Failed to load settings: ' + (error.message || 'Unknown error'));
        }
        setIsLoading(false);
    };

    const handleSaveChurchInfo = async () => {
        setIsSaving(true);
        try {
            // Extract only editable fields - exclude built-in fields
            if (churchSettings && churchSettings.id) {
                const { id, created_date, updated_date, created_by, ...editableData } = churchSettings;
                await base44.entities.ChurchSettings.update(churchSettings.id, editableData);
                console.log('✅ ChurchSettings saved successfully');
            }
            if (onboardingProgress && onboardingProgress.id) {
                const { id, created_date, updated_date, created_by, ...editableData } = onboardingProgress;
                await base44.entities.OnboardingProgress.update(onboardingProgress.id, editableData);
                console.log('✅ OnboardingProgress saved successfully');
            }
            toast.success('Church information saved!');
            // Reload to verify save
            await loadData();
        } catch (error) {
            console.error('❌ Save failed:', error);
            toast.error('Failed to save: ' + (error.message || 'Unknown error'));
        }
        setIsSaving(false);
    };

    const handleSaveBranding = async () => {
        setIsSaving(true);
        try {
            if (churchSettings && churchSettings.id) {
                const { id, created_date, updated_date, created_by, ...editableData } = churchSettings;
                await base44.entities.ChurchSettings.update(churchSettings.id, editableData);
                console.log('✅ Branding saved successfully');
            }
            toast.success('Branding settings saved!');
            // Reload to verify save
            await loadData();
        } catch (error) {
            console.error('❌ Save failed:', error);
            toast.error('Failed to save: ' + (error.message || 'Unknown error'));
        }
        setIsSaving(false);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploadingLogo(true);
        try {
            console.log('📤 Starting logo upload...');
            const result = await base44.integrations.Core.UploadFile({ file });
            console.log('✅ File uploaded to:', result.file_url);
            
            const newLogoUrl = result.file_url;
            
            // Update local state immediately for UI feedback
            setChurchSettings(prev => ({ ...prev, logo_url: newLogoUrl }));
            
            // Auto-save after upload
            if (churchSettings && churchSettings.id) {
                console.log('💾 Saving logo URL to ChurchSettings:', churchSettings.id);
                const { id, created_date, updated_date, created_by, ...editableData } = churchSettings;
                const updatedData = {
                    ...editableData,
                    logo_url: newLogoUrl
                };
                console.log('📝 Update data:', updatedData);
                
                await base44.entities.ChurchSettings.update(churchSettings.id, updatedData);
                console.log('✅ Logo saved successfully to database');
                
                // Reload to confirm save
                await loadData();
            } else {
                console.error('❌ No ChurchSettings record to update:', churchSettings);
            }
            toast.success('Logo uploaded and saved!');
        } catch (error) {
            console.error('❌ Logo upload failed:', error);
            console.error('Error details:', error.message, error.response, error.stack);
            toast.error('Failed to upload logo: ' + (error.message || 'Unknown error'));
        }
        setUploadingLogo(false);
    };

    const handleHeroUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploadingHero(true);
        try {
            console.log('📤 Starting hero image upload...');
            const result = await base44.integrations.Core.UploadFile({ file });
            console.log('✅ File uploaded to:', result.file_url);
            
            const newHeroUrl = result.file_url;
            
            // Update local state immediately for UI feedback
            setChurchSettings(prev => ({ ...prev, hero_image_url: newHeroUrl }));
            
            // Auto-save after upload
            if (churchSettings && churchSettings.id) {
                console.log('💾 Saving hero image URL to ChurchSettings:', churchSettings.id);
                const { id, created_date, updated_date, created_by, ...editableData } = churchSettings;
                const updatedData = {
                    ...editableData,
                    hero_image_url: newHeroUrl
                };
                console.log('📝 Update data:', updatedData);
                
                await base44.entities.ChurchSettings.update(churchSettings.id, updatedData);
                console.log('✅ Hero image saved successfully to database');
                
                // Reload to confirm save
                await loadData();
            } else {
                console.error('❌ No ChurchSettings record to update:', churchSettings);
            }
            toast.success('Church photo uploaded and saved!');
        } catch (error) {
            console.error('❌ Hero upload failed:', error);
            console.error('Error details:', error.message, error.response, error.stack);
            toast.error('Failed to upload photo: ' + (error.message || 'Unknown error'));
        }
        setUploadingHero(false);
    };

    const handleStripeOnboarding = async () => {
        setIsCreatingStripeAccount(true);
        try {
            const host = window.location.origin;
            const returnUrl = `${host}${createPageUrl('ChurchSettings')}?stripe_return=success`;
            const refreshUrl = `${host}${createPageUrl('ChurchSettings')}?stripe_return=refresh`;

            const response = await base44.functions.invoke('createStripeConnectAccount', {
                church_name: churchSettings?.church_name || "Church",
                return_url: returnUrl,
                refresh_url: refreshUrl
            });

            console.log('Full Stripe response:', JSON.stringify(response, null, 2));

            // Extract onboarding URL from response
            // Response structure: { data: { data: { onboarding_url, account_id } } }
            const onboardingUrl = response?.data?.data?.onboarding_url || response?.data?.onboarding_url;
            const errorMsg = response?.data?.error || response?.data?.data?.error || response?.error;
            
            if (onboardingUrl) {
                console.log('✅ Redirecting to Stripe onboarding:', onboardingUrl);
                // Use window.location for reliable redirect
                window.location.href = onboardingUrl;
            } else {
                console.error('❌ No onboarding URL found in response:', response);
                toast.error(errorMsg || 'Failed to generate Stripe onboarding link. Please try again.');
                setIsCreatingStripeAccount(false);
            }
        } catch (error) {
            console.error('❌ Stripe onboarding error:', error);
            const errorMessage = error?.response?.data?.error || error?.data?.error || error?.message || 'Failed to connect to Stripe';
            console.error('Error details:', errorMessage);
            toast.error(errorMessage);
            setIsCreatingStripeAccount(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="p-6">
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                        You must be an administrator to access church settings.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Church className="w-8 h-8 text-blue-600" />
                        Church Settings
                    </h1>
                    <p className="text-slate-600 mt-1">Manage your church's information and branding</p>
                </div>

                {/* Stripe Onboarding Banner - Show if not connected */}
                {(!churchSettings?.stripe_account_id || !churchSettings?.payouts_enabled) && (
                    <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        <AlertDescription className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-green-900 mb-1">Accept Online Donations with Stripe</h3>
                                <p className="text-sm text-green-800">
                                    {!churchSettings?.stripe_account_id 
                                        ? "Connect your bank account to receive donations directly. Takes 5 minutes to complete."
                                        : "Complete your Stripe onboarding to start receiving donations."}
                                </p>
                            </div>
                            <Button 
                                onClick={handleStripeOnboarding}
                                disabled={isCreatingStripeAccount}
                                className="bg-green-600 hover:bg-green-700 ml-4"
                            >
                                {isCreatingStripeAccount ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        {!churchSettings?.stripe_account_id ? "Connect Stripe" : "Complete Setup"}
                                    </>
                                )}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stripe Connected Success Banner */}
                {churchSettings?.stripe_account_id && churchSettings?.payouts_enabled && (
                    <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <AlertDescription>
                            <h3 className="font-semibold text-green-900">✅ Stripe Connected & Active</h3>
                            <p className="text-sm text-green-800 mt-1">
                                Your church is ready to accept online donations. Donations will be deposited directly to your bank account.
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="info">Church Info</TabsTrigger>
                        <TabsTrigger value="branding">Branding</TabsTrigger>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    {/* Church Information Tab */}
                    <TabsContent value="info" className="space-y-6">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Church className="w-5 h-5 text-blue-600" />
                                    General Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Church Name *</Label>
                                    <Input
                                        value={churchSettings?.church_name || ""}
                                        onChange={(e) => setChurchSettings({ ...churchSettings, church_name: e.target.value })}
                                        placeholder="Enter your church name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tagline / Mission Statement</Label>
                                    <Textarea
                                        value={churchSettings?.tagline || ""}
                                        onChange={(e) => setChurchSettings({ ...churchSettings, tagline: e.target.value })}
                                        placeholder="e.g., 'A Place to Call Home' or 'Transforming Lives Through Christ'"
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Lead Pastor / Contact Person</Label>
                                    <Input
                                        value={onboardingProgress?.point_of_contact || ""}
                                        onChange={(e) => setOnboardingProgress({ ...onboardingProgress, point_of_contact: e.target.value })}
                                        placeholder="Pastor John Smith"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>About Your Church</Label>
                                    <Textarea
                                        value={onboardingProgress?.church_description || ""}
                                        onChange={(e) => setOnboardingProgress({ ...onboardingProgress, church_description: e.target.value })}
                                        placeholder="Tell your story, your mission, and what makes your church unique..."
                                        rows={4}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Church Size</Label>
                                        <Input
                                            type="number"
                                            value={onboardingProgress?.church_size || ""}
                                            onChange={(e) => setOnboardingProgress({ ...onboardingProgress, church_size: e.target.value })}
                                            placeholder="Average attendance"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Founded Year</Label>
                                        <Input
                                            type="number"
                                            value={onboardingProgress?.founded_year || ""}
                                            onChange={(e) => setOnboardingProgress({ ...onboardingProgress, founded_year: e.target.value })}
                                            placeholder="1995"
                                        />
                                    </div>
                                </div>

                                <Button onClick={handleSaveChurchInfo} disabled={isSaving} className="w-full bg-blue-600">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Church Information
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Branding Tab */}
                    <TabsContent value="branding" className="space-y-6">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-purple-600" />
                                    Visual Identity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Logo Upload */}
                                <div className="space-y-4">
                                    <Label>Church Logo</Label>
                                    <p className="text-sm text-slate-600">
                                        Appears on giving pages, kiosk, emails, and member portals (recommended: 400x400px PNG)
                                    </p>
                                    <div className="flex items-center gap-6">
                                        {churchSettings?.logo_url && (
                                            <div className="w-32 h-32 border-2 border-slate-200 rounded-lg flex items-center justify-center bg-white p-2">
                                                <img 
                                                    src={churchSettings.logo_url} 
                                                    alt="Church Logo" 
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <input
                                                type="file"
                                                id="logo_upload"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                            />
                                            <Button 
                                                onClick={() => document.getElementById('logo_upload').click()}
                                                disabled={uploadingLogo}
                                                variant="outline"
                                            >
                                                {uploadingLogo ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload Logo
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Hero Image */}
                                <div className="space-y-4">
                                    <Label>Hero Image / Church Photo</Label>
                                    <p className="text-sm text-slate-600">
                                        Main photo for public pages (recommended: 1920x1080px)
                                    </p>
                                    <div className="flex items-start gap-6">
                                        {churchSettings?.hero_image_url && (
                                            <div className="w-64 h-36 border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
                                                <img 
                                                    src={churchSettings.hero_image_url} 
                                                    alt="Church Hero" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <input
                                                type="file"
                                                id="hero_upload"
                                                accept="image/*"
                                                onChange={handleHeroUpload}
                                                className="hidden"
                                            />
                                            <Button 
                                                onClick={() => document.getElementById('hero_upload').click()}
                                                disabled={uploadingHero}
                                                variant="outline"
                                            >
                                                {uploadingHero ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload Photo
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Brand Marketing */}
                                <div className="space-y-4">
                                    <Label>Brand Marketing Message</Label>
                                    <p className="text-sm text-slate-600">
                                        A compelling message about your church for marketing and promotional materials
                                    </p>
                                    <Textarea
                                        value={churchSettings?.brand_marketing || ""}
                                        onChange={(e) => setChurchSettings({ ...churchSettings, brand_marketing: e.target.value })}
                                        placeholder="e.g., 'We are a vibrant community dedicated to serving God and our neighbors through worship, fellowship, and outreach...'"
                                        rows={4}
                                    />
                                </div>

                                {/* Color Customization */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Primary Brand Color</Label>
                                        <div className="flex gap-3 items-center">
                                            <Input
                                                type="color"
                                                value={churchSettings?.primary_color || "#3b82f6"}
                                                onChange={(e) => setChurchSettings({ ...churchSettings, primary_color: e.target.value })}
                                                className="w-20 h-10"
                                            />
                                            <Input
                                                value={churchSettings?.primary_color || "#3b82f6"}
                                                onChange={(e) => setChurchSettings({ ...churchSettings, primary_color: e.target.value })}
                                                placeholder="#3b82f6"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Secondary Brand Color</Label>
                                        <div className="flex gap-3 items-center">
                                            <Input
                                                type="color"
                                                value={churchSettings?.secondary_color || "#10b981"}
                                                onChange={(e) => setChurchSettings({ ...churchSettings, secondary_color: e.target.value })}
                                                className="w-20 h-10"
                                            />
                                            <Input
                                                value={churchSettings?.secondary_color || "#10b981"}
                                                onChange={(e) => setChurchSettings({ ...churchSettings, secondary_color: e.target.value })}
                                                placeholder="#10b981"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="space-y-2">
                                    <Label>Preview</Label>
                                    <div 
                                        className="p-6 rounded-lg border-2"
                                        style={{ 
                                            background: `linear-gradient(135deg, ${churchSettings?.primary_color || '#3b82f6'} 0%, ${churchSettings?.secondary_color || '#10b981'} 100%)`
                                        }}
                                    >
                                        <div className="bg-white rounded-lg p-6 text-center space-y-4">
                                            {churchSettings?.logo_url && (
                                                <img 
                                                    src={churchSettings.logo_url} 
                                                    alt="Logo Preview" 
                                                    className="h-16 mx-auto object-contain"
                                                />
                                            )}
                                            <h3 className="text-2xl font-bold" style={{ color: churchSettings?.primary_color || '#3b82f6' }}>
                                                {churchSettings?.church_name || "Your Church Name"}
                                            </h3>
                                            {churchSettings?.tagline && (
                                                <p className="text-slate-600">{churchSettings.tagline}</p>
                                            )}
                                            <Button style={{ backgroundColor: churchSettings?.primary_color || '#3b82f6' }}>
                                                Give Now
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Button onClick={handleSaveBranding} disabled={isSaving} className="w-full bg-purple-600">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Branding
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Contact Information Tab */}
                    <TabsContent value="contact" className="space-y-6">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-green-600" />
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Church Phone Number</Label>
                                    <Input
                                        value={onboardingProgress?.church_phone || ""}
                                        onChange={(e) => setOnboardingProgress({ ...onboardingProgress, church_phone: e.target.value })}
                                        placeholder="(555) 123-4567"
                                        type="tel"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Church Email</Label>
                                    <Input
                                        value={onboardingProgress?.church_email || ""}
                                        onChange={(e) => setOnboardingProgress({ ...onboardingProgress, church_email: e.target.value })}
                                        placeholder="info@yourchurch.org"
                                        type="email"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Church Address</Label>
                                    <Textarea
                                        value={onboardingProgress?.church_address || ""}
                                        onChange={(e) => setOnboardingProgress({ ...onboardingProgress, church_address: e.target.value })}
                                        placeholder="123 Main Street&#10;City, State 12345"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Website URL</Label>
                                    <Input
                                        value={onboardingProgress?.church_website || ""}
                                        onChange={(e) => setOnboardingProgress({ ...onboardingProgress, church_website: e.target.value })}
                                        placeholder="https://www.yourchurch.org"
                                        type="url"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Visitor Reply Email</Label>
                                    <p className="text-sm text-slate-600">
                                        Email address where visitor replies to follow-up messages will be sent
                                    </p>
                                    <Input
                                        value={churchSettings?.visitor_reply_email || ""}
                                        onChange={(e) => setChurchSettings({ ...churchSettings, visitor_reply_email: e.target.value })}
                                        placeholder="visitors@yourchurch.org"
                                        type="email"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Social Media Links</Label>
                                    <div className="space-y-3">
                                        <Input
                                            value={onboardingProgress?.facebook_url || ""}
                                            onChange={(e) => setOnboardingProgress({ ...onboardingProgress, facebook_url: e.target.value })}
                                            placeholder="Facebook Page URL"
                                        />
                                        <Input
                                            value={onboardingProgress?.instagram_url || ""}
                                            onChange={(e) => setOnboardingProgress({ ...onboardingProgress, instagram_url: e.target.value })}
                                            placeholder="Instagram Profile URL"
                                        />
                                        <Input
                                            value={onboardingProgress?.youtube_url || ""}
                                            onChange={(e) => setOnboardingProgress({ ...onboardingProgress, youtube_url: e.target.value })}
                                            placeholder="YouTube Channel URL"
                                        />
                                    </div>
                                </div>

                                <Button onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        if (churchSettings && churchSettings.id) {
                                            const { id, created_date, updated_date, created_by, ...editableData } = churchSettings;
                                            await base44.entities.ChurchSettings.update(churchSettings.id, editableData);
                                            console.log('✅ ChurchSettings saved successfully');
                                        }
                                        if (onboardingProgress && onboardingProgress.id) {
                                            const { id, created_date, updated_date, created_by, ...editableData } = onboardingProgress;
                                            await base44.entities.OnboardingProgress.update(onboardingProgress.id, editableData);
                                            console.log('✅ OnboardingProgress saved successfully');
                                        }
                                        toast.success('Contact information saved!');
                                        // Reload to verify save
                                        await loadData();
                                    } catch (error) {
                                        console.error('❌ Save failed:', error);
                                        toast.error('Failed to save: ' + (error.message || 'Unknown error'));
                                    }
                                    setIsSaving(false);
                                }} disabled={isSaving} className="w-full bg-green-600">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Contact Information
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Advanced Settings Tab */}
                    <TabsContent value="advanced" className="space-y-6">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-orange-600" />
                                    Advanced Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-2">🔒 Custom Roles & Permissions</h3>
                                    <p className="text-sm text-blue-800 mb-3">
                                        Create custom roles with granular permissions beyond admin and user
                                    </p>
                                    <Button
                                        onClick={() => window.location.href = createPageUrl('RoleManagement')}
                                        className="bg-blue-600"
                                    >
                                        <Shield className="w-4 h-4 mr-2" />
                                        Manage Roles & Permissions
                                    </Button>
                                </div>

                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <h3 className="font-semibold text-purple-900 mb-2">👥 User Role Assignment</h3>
                                    <p className="text-sm text-purple-800 mb-3">
                                        Assign custom roles to specific users
                                    </p>
                                    <Button
                                        onClick={() => window.location.href = createPageUrl('UserRoleAssignment')}
                                        variant="outline"
                                        className="border-purple-300"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Assign User Roles
                                    </Button>
                                </div>

                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <h3 className="font-semibold text-green-900 mb-2">⚙️ Technical Settings</h3>
                                    <p className="text-sm text-green-800 mb-3">
                                        Configure integrations, streaming, SMS, and other technical features
                                    </p>
                                    <Button
                                        onClick={() => window.location.href = createPageUrl('Settings')}
                                        variant="outline"
                                        className="border-green-300"
                                    >
                                        Go to Technical Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}