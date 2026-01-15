import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // NEW IMPORT
import { Settings as SettingsIcon, Youtube, Facebook, Loader2, CheckCircle, MessageSquare, AlertCircle, RefreshCw, Video, ExternalLink, Eye } from "lucide-react"; // UPDATED IMPORT
import { syncSocialVideos } from "@/functions/syncSocialVideos";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useSubscription } from "../components/subscription/useSubscription";
import AddOnsManager from "../components/settings/AddOnsManager";
import CustomFieldsManager from "../components/settings/CustomFieldsManager";
import { UploadFile } from "@/integrations/Core";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        church_name: "",
        logo_url: "",
        hero_image_url: "",
        primary_color: "#3b82f6",
        secondary_color: "#10b981",
        tagline: "",
        youtube_channel_id: "",
        facebook_page_id: "",
        live_stream_url: "",
        primary_streaming_platform: "youtube", // NEW
        restream_enabled: false, // NEW
        restream_stream_url: "", // NEW
        restream_stream_key: "", // NEW
        youtube_stream_url: "", // NEW
        youtube_stream_key: "", // NEW
        facebook_stream_url: "", // NEW
        facebook_stream_key: "", // NEW
        custom_rtmp_url: "", // NEW
        custom_rtmp_key: "", // NEW
        stream_status: "offline", // NEW
        last_stream_check: null, // NEW
        donation_goal_monthly: "",
        auto_sync_enabled: true,
        bank_account_connected: false,
        payouts_enabled: false,
        sinch_service_plan_id: "",
        sinch_api_token: "",
        sinch_phone_number: "",
        sinch_configured: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectResult, setConnectResult] = useState(null);
    const [sinchTestResult, setSinchTestResult] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingHero, setUploadingHero] = useState(false);

    const { subscription, getPlanName, isTrialActive, loading: subscriptionLoading, features, refresh } = useSubscription();

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('connected') === 'true') {
            setConnectResult({ success: true });
            setTimeout(() => {
                loadSettings();
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 1000);
        }
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const settingsList = await base44.entities.ChurchSettings.list();
            if (settingsList.length > 0) {
                setSettings(prevSettings => ({
                    ...prevSettings,
                    ...settingsList[0],
                    bank_account_connected: settingsList[0].bank_account_connected ?? false,
                    payouts_enabled: settingsList[0].payouts_enabled ?? false,
                    donation_goal_monthly: settingsList[0].donation_goal_monthly != null ? String(settingsList[0].donation_goal_monthly) : "",
                    sinch_service_plan_id: settingsList[0].sinch_service_plan_id ?? "",
                    sinch_api_token: settingsList[0].sinch_api_token ?? "",
                    sinch_phone_number: settingsList[0].sinch_phone_number ?? "",
                    sinch_configured: settingsList[0].sinch_configured ?? false,
                    logo_url: settingsList[0].logo_url ?? "",
                    hero_image_url: settingsList[0].hero_image_url ?? "",
                    primary_color: settingsList[0].primary_color ?? "#3b82f6",
                    secondary_color: settingsList[0].secondary_color ?? "#10b981",
                    tagline: settingsList[0].tagline ?? "",
                    // NEW STREAMING FIELDS
                    live_stream_url: settingsList[0].live_stream_url ?? "",
                    primary_streaming_platform: settingsList[0].primary_streaming_platform ?? "youtube",
                    restream_enabled: settingsList[0].restream_enabled ?? false,
                    restream_stream_url: settingsList[0].restream_stream_url ?? "",
                    restream_stream_key: settingsList[0].restream_stream_key ?? "",
                    youtube_stream_url: settingsList[0].youtube_stream_url ?? "",
                    youtube_stream_key: settingsList[0].youtube_stream_key ?? "",
                    facebook_stream_url: settingsList[0].facebook_stream_url ?? "",
                    facebook_stream_key: settingsList[0].facebook_stream_key ?? "",
                    custom_rtmp_url: settingsList[0].custom_rtmp_url ?? "",
                    custom_rtmp_key: settingsList[0].custom_rtmp_key ?? "",
                    stream_status: settingsList[0].stream_status ?? "offline",
                    last_stream_check: settingsList[0].last_stream_check ?? null,
                }));
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        
        const payload = {
            ...settings,
            donation_goal_monthly: settings.donation_goal_monthly === "" || isNaN(parseFloat(settings.donation_goal_monthly))
                ? null
                : parseFloat(settings.donation_goal_monthly),
        };

        try {
            const settingsList = await base44.entities.ChurchSettings.list();
            if (settingsList.length > 0) {
                await base44.entities.ChurchSettings.update(settingsList[0].id, payload);
            } else {
                await base44.entities.ChurchSettings.create(payload);
            }
            return true;
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("Failed to save settings. Please try again.");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleConnectBankAccount = async () => {
        if (!settings.church_name) {
            alert("Please enter your church name first in the General tab.");
            return;
        }

        setIsConnecting(true);
        setConnectResult(null);

        try {
            const response = await base44.functions.invoke('createStripeConnectAccount', {
                church_name: settings.church_name,
                return_url: `${window.location.origin}${window.location.pathname}?connected=true`,
                refresh_url: `${window.location.origin}${window.location.pathname}`
            });

            console.log('✅ Stripe Connect response:', response);

            // Handle response - the data is in response.data
            const data = response.data || response;
            
            if (data.onboarding_url) {
                console.log('🔗 Redirecting to Stripe onboarding:', data.onboarding_url);
                window.location.href = data.onboarding_url;
            } else {
                console.error('❌ No onboarding URL in response:', data);
                throw new Error('No onboarding URL received from Stripe');
            }
        } catch (error) {
            console.error('❌ Bank account connection failed:', error);
            setConnectResult({ success: false, error: error.message });
            
            const errorMsg = error.message || 'Unknown error';
            alert(`Failed to connect Stripe: ${errorMsg}\n\nPlease contact support if this persists.`);
        }
        
        setIsConnecting(false);
    };

    const handleSyncVideos = async () => {
        if (!settings.youtube_channel_id && !settings.facebook_page_id) {
            alert("Please enter a YouTube Channel ID or Facebook Page ID first.");
            return;
        }

        setIsSyncing(true);
        setSyncResult(null);
        try {
            const response = await syncSocialVideos({
                youtube_channel_id: settings.youtube_channel_id,
                facebook_page_id: settings.facebook_page_id
            });

            setSyncResult(response.data);
            
            const updatedSettings = {
                ...settings,
                last_sync_date: new Date().toISOString()
            };
            setSettings(updatedSettings);
            
            const settingsList = await base44.entities.ChurchSettings.list();
            if (settingsList.length > 0) {
                await base44.entities.ChurchSettings.update(settingsList[0].id, updatedSettings);
            }

        } catch (error) {
            console.error("Sync failed:", error);
            alert("Failed to sync videos. Please check your API keys and channel IDs.");
        }
        setIsSyncing(false);
    };

    const testSinchConnection = async () => {
        setSinchTestResult({ status: 'testing' });
        
        // First save the credentials to the database
        const saved = await handleSave();
        
        if (!saved) {
            setSinchTestResult({ 
                status: 'error', 
                message: 'Failed to save Sinch credentials. Please check for errors and try again.' 
            });
            return;
        }

        // Small delay to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const testResponse = await base44.functions.invoke('testSinchSetup', {});
            
            console.log('Test response:', testResponse.data);
            
            if (testResponse.data.all_configured) {
                setSinchTestResult({ 
                    status: 'success', 
                    message: 'Sinch credentials verified! Your SMS system is ready to use.',
                    details: testResponse.data
                });
                
                // Update local state to mark as configured
                const updatedSettings = {
                    ...settings,
                    sinch_configured: true
                };
                setSettings(updatedSettings);
                
                // Save configured status to database
                const settingsList = await base44.entities.ChurchSettings.list();
                if (settingsList.length > 0) {
                    await base44.entities.ChurchSettings.update(settingsList[0].id, { sinch_configured: true });
                }
            } else {
                // Show detailed error
                const errorDetails = testResponse.data.api_test?.message || 'API connection failed';
                setSinchTestResult({ 
                    status: 'error', 
                    message: errorDetails,
                    details: testResponse.data
                });
                
                // Update configured status
                const settingsList = await base44.entities.ChurchSettings.list();
                if (settingsList.length > 0) {
                    await base44.entities.ChurchSettings.update(settingsList[0].id, { sinch_configured: false });
                }
            }
            
        } catch (error) {
            console.error('Test error:', error);
            setSinchTestResult({ 
                status: 'error', 
                message: error.message || 'Failed to validate Sinch credentials. Please check your Service Plan ID and API Token.' 
            });
            
            const settingsList = await base44.entities.ChurchSettings.list();
            if (settingsList.length > 0) {
                await base44.entities.ChurchSettings.update(settingsList[0].id, { sinch_configured: false });
            }
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setUploadingLogo(true);
        try {
            const result = await UploadFile({ file });
            setSettings(prev => ({ ...prev, logo_url: result.file_url }));
            alert('Logo uploaded successfully!');
        } catch (error) {
            console.error('Logo upload failed:', error);
            alert('Failed to upload logo. Please try again.');
        }
        setUploadingLogo(false);
    };

    const handleHeroUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setUploadingHero(true);
        try {
            const result = await UploadFile({ file });
            setSettings(prev => ({ ...prev, hero_image_url: result.file_url }));
            alert('Church photo uploaded successfully!');
        } catch (error) {
            console.error('Hero image upload failed:', error);
            alert('Failed to upload photo. Please try again.');
        }
        setUploadingHero(false);
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        if (['sinch_service_plan_id', 'sinch_api_token', 'sinch_phone_number'].includes(field)) {
            setSinchTestResult(null);
        }
    };



    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <SettingsIcon className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
                        <p className="text-slate-600">Configure integrations and church information</p>
                    </div>
                </div>

                <Tabs defaultValue="general" className="space-y-6 mt-8">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-11">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="branding">Branding</TabsTrigger>
                        <TabsTrigger value="streaming">Streaming</TabsTrigger>
                        <TabsTrigger value="giving">Giving</TabsTrigger>
                        <TabsTrigger value="receipts">Receipts</TabsTrigger>
                        <TabsTrigger value="sms">SMS/Sinch</TabsTrigger>
                        <TabsTrigger value="social">Social Media</TabsTrigger>
                        <TabsTrigger value="kiosk">Kiosk Setup</TabsTrigger>
                        <TabsTrigger value="subscription">Subscription</TabsTrigger>
                        <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
                        <TabsTrigger value="member-groups">Member Groups</TabsTrigger>
                    </TabsList>

                    {/* Content for General (formerly Church Info) */}
                    <TabsContent value="general">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="church_name">Church Name</Label>
                                    <Input
                                        id="church_name"
                                        value={settings.church_name}
                                        onChange={(e) => handleChange('church_name', e.target.value)}
                                        placeholder="Enter your church name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tagline">Church Tagline / Mission Statement</Label>
                                    <Input
                                        id="tagline"
                                        value={settings.tagline}
                                        onChange={(e) => handleChange('tagline', e.target.value)}
                                        placeholder="e.g., 'A Place to Call Home' or 'Transforming Lives Through Christ'"
                                    />
                                </div>
                                {/* Removed live_stream_url from here, moved to Streaming tab */}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Content for Branding */}
                    <TabsContent value="branding">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Branding & Customization</CardTitle>
                                <p className="text-sm text-slate-600">Customize your church's look and feel across all interfaces</p>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Logo Upload */}
                                <div className="space-y-4">
                                    <Label>Church Logo</Label>
                                    <p className="text-sm text-slate-600">
                                        Your logo will appear on giving pages, kiosk, and member portals (recommended: 400x400px, PNG with transparent background)
                                    </p>
                                    <div className="flex items-center gap-6">
                                        {settings.logo_url && (
                                            <div className="w-32 h-32 border-2 border-slate-200 rounded-lg flex items-center justify-center bg-white p-2">
                                                <img 
                                                    src={settings.logo_url} 
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
                                            <label htmlFor="logo_upload">
                                                <Button 
                                                    type="button"
                                                    onClick={() => document.getElementById('logo_upload').click()}
                                                    disabled={uploadingLogo}
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <span>
                                                        {uploadingLogo ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>Upload Logo</>
                                                        )}
                                                    </span>
                                                </Button>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Hero Image Upload */}
                                <div className="space-y-4">
                                    <Label>Hero Image / Church Photo</Label>
                                    <p className="text-sm text-slate-600">
                                        Main church photo for your giving pages and public-facing interfaces (recommended: 1920x1080px)
                                    </p>
                                    <div className="flex items-start gap-6">
                                        {settings.hero_image_url && (
                                            <div className="w-64 h-36 border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
                                                <img 
                                                    src={settings.hero_image_url} 
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
                                            <label htmlFor="hero_upload">
                                                <Button 
                                                    type="button"
                                                    onClick={() => document.getElementById('hero_upload').click()}
                                                    disabled={uploadingHero}
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <span>
                                                        {uploadingHero ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>Upload Church Photo</>
                                                        )}
                                                    </span>
                                                </Button>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Color Customization */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="primary_color">Primary Brand Color</Label>
                                        <div className="flex gap-3 items-center">
                                            <Input
                                                type="color"
                                                id="primary_color"
                                                value={settings.primary_color}
                                                onChange={(e) => handleChange('primary_color', e.target.value)}
                                                className="w-20 h-10"
                                            />
                                            <Input
                                                value={settings.primary_color}
                                                onChange={(e) => handleChange('primary_color', e.target.value)}
                                                placeholder="#3b82f6"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="secondary_color">Secondary Brand Color</Label>
                                        <div className="flex gap-3 items-center">
                                            <Input
                                                type="color"
                                                id="secondary_color"
                                                value={settings.secondary_color}
                                                onChange={(e) => handleChange('secondary_color', e.target.value)}
                                                className="w-20 h-10"
                                            />
                                            <Input
                                                value={settings.secondary_color}
                                                onChange={(e) => handleChange('secondary_color', e.target.value)}
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
                                        className="p-6 rounded-lg border-2 border-slate-200"
                                        style={{ 
                                            background: `linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color} 100%)`
                                        }}
                                    >
                                        <div className="bg-white rounded-lg p-6 text-center space-y-4">
                                            {settings.logo_url && (
                                                <img 
                                                    src={settings.logo_url} 
                                                    alt="Logo Preview" 
                                                    className="h-16 mx-auto object-contain"
                                                />
                                            )}
                                            <h3 className="text-2xl font-bold" style={{ color: settings.primary_color }}>
                                                {settings.church_name || "Your Church Name"}
                                            </h3>
                                            {settings.tagline && (
                                                <p className="text-slate-600">{settings.tagline}</p>
                                            )}
                                            <Button style={{ backgroundColor: settings.primary_color }}>
                                                Give Now
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* UPDATED: Streaming Tab */}
                    <TabsContent value="streaming">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Live Streaming Configuration</CardTitle>
                                <p className="text-sm text-slate-600 mt-2">
                                    Connect your streaming platforms and manage stream keys for live broadcasts
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Primary Streaming Platform */}
                                <div className="space-y-2">
                                    <Label htmlFor="primary_streaming_platform">Primary Streaming Platform</Label>
                                    <Select
                                        value={String(settings.primary_streaming_platform || 'youtube')}
                                        onValueChange={(value) => handleChange('primary_streaming_platform', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="youtube">YouTube Live</SelectItem>
                                            <SelectItem value="facebook">Facebook Live</SelectItem>
                                            <SelectItem value="restream">Restream (Multi-platform)</SelectItem>
                                            <SelectItem value="custom">Custom RTMP Server</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-slate-500">
                                        Choose your primary platform for live streaming
                                    </p>
                                </div>

                                {/* Stream Embed URL */}
                                <div className="space-y-2">
                                    <Label htmlFor="live_stream_url">Live Stream Embed URL</Label>
                                    <Input
                                        id="live_stream_url"
                                        value={settings.live_stream_url}
                                        onChange={(e) => handleChange('live_stream_url', e.target.value)}
                                        placeholder="https://www.youtube.com/embed/your-channel-id/live"
                                    />
                                    <p className="text-sm text-slate-500">
                                        This is the URL that will be displayed in the app for your live stream.
                                        For YouTube, often a permanent embed URL like 
                                        <code className="block mt-1 bg-white px-2 py-1 rounded text-[10px] w-fit">
                                        https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID
                                        </code>
                                        can be used. For Facebook, find the embed URL after starting a stream.
                                    </p>
                                </div>

                                {/* Restream Multi-Platform Integration */}
                                <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                            <Video className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-purple-900 text-lg">Restream Multi-Platform Streaming</h3>
                                                <Switch
                                                    checked={settings.restream_enabled || false}
                                                    onCheckedChange={(checked) => handleChange('restream_enabled', checked)}
                                                />
                                            </div>
                                            <p className="text-sm text-purple-800 mb-4">
                                                Stream to YouTube, Facebook, and 30+ platforms simultaneously with Restream
                                            </p>

                                            {settings.restream_enabled && (
                                                <div className="space-y-4 mt-4">
                                                    <div className="bg-white p-4 rounded-lg border border-purple-300 space-y-3">
                                                        <div>
                                                            <Label htmlFor="restream_stream_url">Restream Server URL</Label>
                                                            <Input
                                                                id="restream_stream_url"
                                                                value={settings.restream_stream_url || ''}
                                                                onChange={(e) => handleChange('restream_stream_url', e.target.value)}
                                                                placeholder="rtmp://live.restream.io/live"
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="restream_stream_key">Restream Stream Key</Label>
                                                            <div className="flex gap-2 mt-1">
                                                                <Input
                                                                    id="restream_stream_key"
                                                                    type="password"
                                                                    value={settings.restream_stream_key || ''}
                                                                    onChange={(e) => handleChange('restream_stream_key', e.target.value)}
                                                                    placeholder="Enter your Restream key"
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        const input = document.getElementById('restream_stream_key');
                                                                        input.type = input.type === 'password' ? 'text' : 'password';
                                                                    }}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-4 rounded-lg border border-purple-300">
                                                        <h4 className="font-semibold text-purple-900 mb-2">Setup Instructions:</h4>
                                                        <ol className="text-sm text-purple-800 space-y-2 list-decimal ml-5">
                                                            <li>Create a free account at <a href="https://restream.io" target="_blank" rel="noopener noreferrer" className="underline font-medium">restream.io</a></li>
                                                            <li>Connect your YouTube and Facebook accounts</li>
                                                            <li>Go to Settings → Stream URL & Key</li>
                                                            <li>Copy the RTMP URL and Stream Key</li>
                                                            <li>Paste them in the fields above</li>
                                                            <li>Use these credentials in OBS or your streaming software</li>
                                                        </ol>
                                                    </div>

                                                    <Button
                                                        onClick={() => window.open('https://restream.io', '_blank')}
                                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Open Restream Dashboard
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* YouTube Streaming Setup */}
                                <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                                            <Youtube className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-red-900 text-lg mb-2">YouTube Live Streaming</h3>
                                            <p className="text-sm text-red-800 mb-4">
                                                Stream your church services directly through YouTube
                                            </p>

                                            <div className="space-y-3">
                                                <div>
                                                    <Label htmlFor="youtube_stream_url">YouTube RTMP URL</Label>
                                                    <Input
                                                        id="youtube_stream_url"
                                                        value={settings.youtube_stream_url || ''}
                                                        onChange={(e) => handleChange('youtube_stream_url', e.target.value)}
                                                        placeholder="rtmp://a.rtmp.youtube.com/live2"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="youtube_stream_key">YouTube Stream Key</Label>
                                                    <div className="flex gap-2 mt-1">
                                                        <Input
                                                            id="youtube_stream_key"
                                                            type="password"
                                                            value={settings.youtube_stream_key || ''}
                                                            onChange={(e) => handleChange('youtube_stream_key', e.target.value)}
                                                            placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                const input = document.getElementById('youtube_stream_key');
                                                                input.type = input.type === 'password' ? 'text' : 'password';
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-red-300 space-y-3 mt-4">
                                                <h4 className="font-semibold text-red-900">How to Get Your Stream Key:</h4>
                                                <ol className="text-sm text-red-800 space-y-2 list-decimal ml-5">
                                                    <li>Go to <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">YouTube Studio</a></li>
                                                    <li>Click "Create" → "Go Live"</li>
                                                    <li>Choose "Stream" (for streaming software)</li>
                                                    <li>Copy your "Stream Key" and "Stream URL"</li>
                                                    <li>Paste them in the fields above</li>
                                                </ol>
                                            </div>

                                            <Button
                                                onClick={() => window.open('https://studio.youtube.com/channel/UC/livestreaming', '_blank')}
                                                className="mt-4 bg-red-600 hover:bg-red-700 w-full"
                                            >
                                                <Youtube className="w-4 h-4 mr-2" />
                                                Open YouTube Studio
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Facebook Streaming Setup */}
                                <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                            <Facebook className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-blue-900 text-lg mb-2">Facebook Live Streaming</h3>
                                            <p className="text-sm text-blue-800 mb-4">
                                                Stream your services to your Facebook Page
                                            </p>

                                            <div className="space-y-3">
                                                <div>
                                                    <Label htmlFor="facebook_stream_url">Facebook RTMPS URL</Label>
                                                    <Input
                                                        id="facebook_stream_url"
                                                        value={settings.facebook_stream_url || ''}
                                                        onChange={(e) => handleChange('facebook_stream_url', e.target.value)}
                                                        placeholder="rtmps://live-api-s.facebook.com:443/rtmp/"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="facebook_stream_key">Facebook Stream Key</Label>
                                                    <div className="flex gap-2 mt-1">
                                                        <Input
                                                            id="facebook_stream_key"
                                                            type="password"
                                                            value={settings.facebook_stream_key || ''}
                                                            onChange={(e) => handleChange('facebook_stream_key', e.target.value)}
                                                            placeholder="Enter your Facebook stream key"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                const input = document.getElementById('facebook_stream_key');
                                                                input.type = input.type === 'password' ? 'text' : 'password';
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-blue-300 space-y-3 mt-4">
                                                <h4 className="font-semibold text-blue-900">How to Get Your Stream Key:</h4>
                                                <ol className="text-sm text-blue-800 space-y-2 list-decimal ml-5">
                                                    <li>Go to your Facebook Page</li>
                                                    <li>Click "Live Video" in the Create section</li>
                                                    <li>Choose "Streaming Software"</li>
                                                    <li>Copy your "Stream Key"</li>
                                                    <li>Paste it in the field above</li>
                                                </ol>
                                            </div>

                                            <Button
                                                onClick={() => window.open('https://www.facebook.com/live/producer', '_blank')}
                                                className="mt-4 bg-blue-600 hover:bg-blue-700 w-full"
                                            >
                                                <Facebook className="w-4 h-4 mr-2" />
                                                Open Facebook Live Producer
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom RTMP Setup */}
                                {settings.primary_streaming_platform === 'custom' && (
                                    <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-lg space-y-4">
                                        <h3 className="font-bold text-slate-900 text-lg mb-2">Custom RTMP Server</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <Label htmlFor="custom_rtmp_url">RTMP Server URL</Label>
                                                <Input
                                                    id="custom_rtmp_url"
                                                    value={settings.custom_rtmp_url || ''}
                                                    onChange={(e) => handleChange('custom_rtmp_url', e.target.value)}
                                                    placeholder="rtmp://your-server.com/live"
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="custom_rtmp_key">Stream Key</Label>
                                                <Input
                                                    id="custom_rtmp_key"
                                                    type="password"
                                                    value={settings.custom_rtmp_key || ''}
                                                    onChange={(e) => handleChange('custom_rtmp_key', e.target.value)}
                                                    placeholder="Enter your stream key"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stream Status Info */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                    <h4 className="font-semibold text-slate-900 mb-3">📡 Current Stream Status:</h4>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${
                                            settings.stream_status === 'live' ? 'bg-red-500 animate-pulse' :
                                            settings.stream_status === 'scheduled' ? 'bg-yellow-500' :
                                            'bg-slate-300'
                                        }`} />
                                        <span className="font-medium">
                                            {settings.stream_status === 'live' ? '🔴 LIVE' :
                                             settings.stream_status === 'scheduled' ? '📅 Scheduled' :
                                             '⚪ Offline'}
                                        </span>
                                        {settings.last_stream_check && (
                                            <span className="text-xs text-slate-500 ml-auto">
                                                Last checked: {new Date(settings.last_stream_check).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Recommended Streaming Software */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                    <h4 className="font-semibold text-slate-900 mb-3">🎥 Recommended Streaming Software:</h4>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="p-3 bg-white rounded border">
                                            <p className="font-semibold text-sm">OBS Studio (Free)</p>
                                            <p className="text-xs text-slate-600 mb-2">Most popular, powerful, open-source</p>
                                            <a href="https://obsproject.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                                                Download OBS →
                                            </a>
                                        </div>
                                        <div className="p-3 bg-white rounded border">
                                            <p className="font-semibold text-sm">Streamlabs (Free)</p>
                                            <p className="text-xs text-slate-600 mb-2">Beginner-friendly, easy setup</p>
                                            <a href="https://streamlabs.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                                                Download Streamlabs →
                                            </a>
                                        </div>
                                        <div className="p-3 bg-white rounded border">
                                            <p className="font-semibold text-sm">vMix (Paid)</p>
                                            <p className="text-xs text-slate-600 mb-2">Professional, multi-camera support</p>
                                            <a href="https://www.vmix.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                                                Learn More →
                                            </a>
                                        </div>
                                        <div className="p-3 bg-white rounded border">
                                            <p className="font-semibold text-sm">Restream (Paid)</p>
                                            <p className="text-xs text-slate-600 mb-2">Stream to multiple platforms simultaneously</p>
                                            <a href="https://restream.io/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                                                Learn More →
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Test Your Stream */}
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="font-semibold text-green-900 mb-2">✅ Test Your Configuration</h4>
                                    <p className="text-sm text-green-800 mb-3">
                                        After saving your settings, test your stream configuration by visiting your Sermons page.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            if (settings.live_stream_url) {
                                                window.open(createPageUrl('Sermons'), '_blank');
                                            } else {
                                                alert('Please enter a Live Stream URL first');
                                            }
                                        }}
                                        variant="outline"
                                        className="border-green-300 text-green-700 hover:bg-green-100"
                                    >
                                        Preview Stream on Sermons Page
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Content for Social Media */}
                    <TabsContent value="social">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Social Media Integration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="youtube_channel_id" className="flex items-center gap-2">
                                        <Youtube className="w-4 h-4 text-red-600" />
                                        YouTube Channel ID
                                    </Label>
                                    <Input
                                        id="youtube_channel_id"
                                        value={settings.youtube_channel_id}
                                        onChange={(e) => handleChange('youtube_channel_id', e.target.value)}
                                        placeholder="UCXpF8z4J1234567890"
                                    />
                                    <p className="text-sm text-slate-500">
                                        Find this in YouTube Studio → Settings → Channel → Basic Info
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="facebook_page_id" className="flex items-center gap-2">
                                        <Facebook className="w-4 h-4 text-blue-600" />
                                        Facebook Page ID
                                    </Label>
                                    <Input
                                        id="facebook_page_id"
                                        value={settings.facebook_page_id}
                                        onChange={(e) => handleChange('facebook_page_id', e.target.value)}
                                        placeholder="123456789012345"
                                    />
                                    <p className="text-sm text-slate-500">
                                        Find this in your Facebook Page → About → Page Info
                                    </p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                    <div>
                                        <Label htmlFor="auto_sync">Automatic Video Sync</Label>
                                        <p className="text-sm text-slate-600">
                                            Automatically check for new videos and add them as sermons
                                        </p>
                                    </div>
                                    <Switch
                                        id="auto_sync"
                                        checked={settings.auto_sync_enabled}
                                        onCheckedChange={(value) => handleChange('auto_sync_enabled', value)}
                                    />
                                </div>

                                <div className="space-y-4 p-4 border rounded-lg">
                                    <h3 className="font-semibold">Manual Video Sync</h3>
                                    <p className="text-sm text-slate-600">
                                        Click the button below to manually sync the latest videos from your connected social media channels.
                                    </p>
                                    <Button 
                                        onClick={handleSyncVideos} 
                                        disabled={isSyncing}
                                        className="w-full"
                                    >
                                        {isSyncing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Syncing Videos...
                                            </>
                                        ) : (
                                            "Sync Videos Now"
                                        )}
                                    </Button>
                                    
                                    {syncResult && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-green-800">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="font-medium">Sync Complete!</span>
                                            </div>
                                            <p className="text-sm text-green-700 mt-1">
                                                {syncResult.total_synced} new videos synced successfully
                                            </p>
                                        </div>
                                    )}
                                    
                                    {settings.last_sync_date && (
                                        <p className="text-xs text-slate-500">
                                            Last sync: {new Date(settings.last_sync_date).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Content for Receipts */}
                    <TabsContent value="receipts">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Donation Receipt Settings</CardTitle>
                                <p className="text-sm text-slate-600 mt-2">
                                    Customize the donation receipts that are automatically sent to donors
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div>
                                        <Label htmlFor="auto_send_receipts">Automatically Send Receipts</Label>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Send a receipt email immediately after each donation
                                        </p>
                                    </div>
                                    <Switch
                                        id="auto_send_receipts"
                                        checked={settings.auto_send_receipts !== false}
                                        onCheckedChange={(value) => handleChange('auto_send_receipts', value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="receipt_template_subject">Email Subject Line</Label>
                                    <Input
                                        id="receipt_template_subject"
                                        value={settings.receipt_template_subject || ''}
                                        onChange={(e) => handleChange('receipt_template_subject', e.target.value)}
                                        placeholder="Thank You for Your Generous Donation!"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="receipt_template_header">Header Message</Label>
                                    <textarea
                                        id="receipt_template_header"
                                        value={settings.receipt_template_header || ''}
                                        onChange={(e) => handleChange('receipt_template_header', e.target.value)}
                                        placeholder="Thank you for your generous donation to {church_name}. Your support helps us continue our mission and ministry."
                                        className="w-full min-h-[100px] p-3 border rounded-lg"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Use {'{church_name}'} to insert your church name
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="receipt_template_footer">Footer Message</Label>
                                    <textarea
                                        id="receipt_template_footer"
                                        value={settings.receipt_template_footer || ''}
                                        onChange={(e) => handleChange('receipt_template_footer', e.target.value)}
                                        placeholder="This receipt is for tax purposes. Please retain for your records. No goods or services were provided in exchange for this donation."
                                        className="w-full min-h-[100px] p-3 border rounded-lg"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="receipt_tax_id">Tax ID / EIN (Optional)</Label>
                                        <Input
                                            id="receipt_tax_id"
                                            value={settings.receipt_tax_id || ''}
                                            onChange={(e) => handleChange('receipt_tax_id', e.target.value)}
                                            placeholder="12-3456789"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Your church's Employer Identification Number
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="receipt_address">Church Address (Optional)</Label>
                                        <textarea
                                            id="receipt_address"
                                            value={settings.receipt_address || ''}
                                            onChange={(e) => handleChange('receipt_address', e.target.value)}
                                            placeholder="123 Main Street&#10;City, State 12345"
                                            className="w-full h-[80px] p-3 border rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="font-semibold text-green-900 mb-2">📧 Receipt Preview</h4>
                                    <p className="text-sm text-green-800 mb-3">
                                        Receipts are sent automatically after each donation with:
                                    </p>
                                    <ul className="text-sm text-green-800 space-y-1 list-disc ml-5">
                                        <li>Donation amount and date</li>
                                        <li>Receipt number for tracking</li>
                                        <li>Donation type (tithe, offering, etc.)</li>
                                        <li>Tax deduction information</li>
                                        <li>Your church's branding and logo</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Content for Giving */}
                    <TabsContent value="giving">
                        {/* STRIPE SETUP WARNING - Update with clearer instructions */}
                        <Card className="mb-8 shadow-xl border-2 border-red-300 bg-red-50">
                            <CardHeader>
                                <CardTitle className="text-red-900 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6" />
                                    ⚠️ CRITICAL: Use SECRET Key, NOT Publishable Key
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Alert className="bg-yellow-100 border-yellow-400">
                                        <AlertDescription className="text-yellow-900 font-semibold">
                                            🚨 COMMON MISTAKE: Many users accidentally use their PUBLISHABLE key (pk_...) instead of SECRET key (sk_...)
                                        </AlertDescription>
                                    </Alert>

                                    <p className="text-red-900 font-semibold">
                                        Before you can accept donations or subscriptions, configure Stripe with your SECRET API key:
                                    </p>
                                    
                                    <div className="bg-white p-4 rounded-lg border-2 border-red-300">
                                        <h4 className="font-semibold text-red-900 mb-3">Setup Steps (5 minutes):</h4>
                                        <ol className="text-sm text-red-800 space-y-2 list-decimal ml-5">
                                            <li>
                                                <strong>Create Stripe Account:</strong>{" "}
                                                <a 
                                                    href="https://dashboard.stripe.com/register" 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline hover:text-blue-800"
                                                >
                                                    Sign up at stripe.com
                                                </a>
                                            </li>
                                            <li>
                                                <strong>Get Your SECRET API Key (NOT Publishable):</strong>
                                                <div className="mt-2 p-3 bg-yellow-50 rounded border border-yellow-300">
                                                    <p className="text-xs font-semibold text-red-900 mb-1">❌ DON'T USE THIS (Publishable Key):</p>
                                                    <code className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">pk_test_51...</code>
                                                    
                                                    <p className="text-xs font-semibold text-green-900 mb-1 mt-2">✅ USE THIS (Secret Key):</p>
                                                    <code className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">sk_test_51... or sk_live_51...</code>
                                                </div>
                                                <ul className="ml-5 mt-2 list-disc text-xs">
                                                    <li>Go to: Dashboard → Developers → API Keys</li>
                                                    <li>Look for "Secret key" section (NOT "Publishable key")</li>
                                                    <li>Click "Reveal test key" or "Reveal live key"</li>
                                                    <li>Copy the key that starts with <code className="bg-slate-200 px-1 rounded">sk_</code></li>
                                                </ul>
                                            </li>
                                            <li>
                                                <strong>Set Environment Variable:</strong>
                                                <div className="mt-2 p-2 bg-slate-100 rounded">
                                                    <p className="text-xs font-mono">Go to: <strong>Dashboard → Code → Environment Variables</strong></p>
                                                    <p className="text-xs mt-1">Add: <code className="bg-slate-200 px-1 py-0.5 rounded">STRIPE_API_KEY</code> = your SECRET key (sk_...)</p>
                                                </div>
                                            </li>
                                            <li>
                                                <strong>Click "Save & Deploy"</strong> to restart your app with the new key
                                            </li>
                                            <li>
                                                Test by trying to subscribe or donate!
                                            </li>
                                        </ol>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => window.open('https://dashboard.stripe.com/register', '_blank')}
                                            className="bg-purple-600 hover:bg-purple-700"
                                        >
                                            1. Create Stripe Account
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => window.open('https://dashboard.stripe.com/apikeys', '_blank')}
                                        >
                                            2. Get SECRET API Key
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                alert("CRITICAL REMINDER:\n\n✅ USE: Secret key (sk_test_... or sk_live_...)\n❌ DON'T USE: Publishable key (pk_...)\n\nGo to:\nDashboard → Code → Environment Variables\n\nAdd:\nSTRIPE_API_KEY = sk_test_... (your SECRET key)\n\nThen click 'Save & Deploy'");
                                            }}
                                        >
                                            3. Setup Instructions
                                        </Button>
                                    </div>

                                    <Alert className="bg-red-50 border-red-300">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <AlertDescription className="text-red-800">
                                            <strong>Cannot process payments until Stripe is configured with SECRET key!</strong> If you use the wrong key type (pk_ instead of sk_), you'll get errors.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Keep existing Kiosk Setup card */}
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6">
                            <CardHeader>
                                <CardTitle>Kiosk Giving Setup</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-2">📱 Set Up In-Church Giving Stations</h3>
                                    <p className="text-sm text-blue-800 mb-3">
                                        Place iPads or Android tablets around your church for easy, contactless giving.
                                    </p>
                                    <Button 
                                        onClick={() => {
                                            window.location.href = createPageUrl('KioskGivingSetup');
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        View Setup Instructions
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6">
                            <CardHeader>
                                <CardTitle>Donation Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="donation_goal">Monthly Donation Goal ($)</Label>
                                    <Input
                                        id="donation_goal"
                                        type="number"
                                        value={settings.donation_goal_monthly}
                                        onChange={(e) => handleChange('donation_goal_monthly', e.target.value)}
                                        placeholder="5000"
                                    />
                                    <p className="text-sm text-slate-500">
                                        This goal will be displayed on your donation pages and dashboard
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Bank Account Connection</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-2">How Bank Account Connection Works</h3>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Connect your church's bank account securely via Stripe</li>
                                        <li>• Donations made through your app go directly to your account</li>
                                        <li>• Funds are automatically transferred within 2-7 business days</li>
                                        <li>• You maintain full control over your banking information</li>
                                    </ul>
                                </div>

                                {settings.bank_account_connected ? (
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 text-green-800 mb-2">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">Bank Account Connected!</span>
                                        </div>
                                        <p className="text-sm text-green-700 mb-2">
                                            Your church can now receive donations directly to your bank account.
                                        </p>
                                        <p className="text-xs text-green-600">
                                            Payouts Status: {settings.payouts_enabled ? 'Enabled' : 'Pending Verification'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 border rounded-lg">
                                            <h3 className="font-semibold mb-2">Connect Your Bank Account</h3>
                                            <p className="text-sm text-slate-600 mb-4">
                                                Connect your church's bank account to start receiving donations through this app.
                                                You'll be taken to a secure Stripe page to complete the setup.
                                            </p>
                                            <Button 
                                                onClick={handleConnectBankAccount} 
                                                disabled={isConnecting}
                                                className="w-full"
                                            >
                                                {isConnecting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Connecting...
                                                    </>
                                                ) : (
                                                    "Connect Bank Account"
                                                )}
                                            </Button>
                                        </div>

                                        {connectResult?.success && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center gap-2 text-green-800">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="font-medium">Connection Successful!</span>
                                                </div>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Your bank account has been connected. You can now accept donations.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                                    <strong>Security Notice:</strong> Your banking information is processed and stored securely by Stripe, 
                                    an industry-leading payment processor. This app never has access to your sensitive banking details.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Content for SMS/Sinch */}
                    <TabsContent value="sms">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-green-600" />
                                    SMS / Sinch Configuration
                                </CardTitle>
                                <div className="mt-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full" 
                                        onClick={() => { window.location.href = createPageUrl('SinchSetupGuide'); }}
                                    >
                                        📚 View Complete Sinch Setup Guide
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-500">
                                    <h3 className="font-semibold text-red-900 mb-2 text-lg">🚨 WEBHOOK URL - CRITICAL!</h3>
                                    <p className="text-sm text-red-800 mb-3">
                                        If you're seeing TwiML/XML errors, you have the WRONG webhook URL configured!
                                    </p>
                                    <div className="bg-white p-3 rounded border border-red-300 mb-2">
                                        <p className="text-xs font-semibold text-green-900 mb-1">✅ CORRECT URL:</p>
                                        <code className="text-xs break-all block text-green-900 bg-green-50 p-2 rounded font-mono">
                                            https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 text-xs"
                                            onClick={() => {
                                                navigator.clipboard.writeText('https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS');
                                                alert('✅ Correct webhook URL copied!');
                                            }}
                                        >
                                            📋 Copy Correct URL
                                        </Button>
                                    </div>
                                    <p className="text-xs text-red-700 font-semibold">
                                        Notice it ends with "handleIncomingSinchSMS" (with "Sinch")
                                    </p>
                                </div>

                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Environment Variables Required</h3>
                                    <p className="text-sm text-yellow-800 mb-3">
                                        For SMS keywords to work, you MUST set these credentials as environment variables in the Dashboard:
                                    </p>
                                    <ol className="text-sm text-yellow-800 space-y-2 list-decimal ml-5">
                                        <li>Go to <strong>Dashboard → Code → Environment Variables</strong></li>
                                        <li>Add: <code className="bg-yellow-100 px-2 py-1 rounded">SINCH_SERVICE_PLAN_ID</code></li>
                                        <li>Add: <code className="bg-yellow-100 px-2 py-1 rounded">SINCH_API_TOKEN</code></li>
                                        <li>Add: <code className="bg-yellow-100 px-2 py-1 rounded">SINCH_PHONE_NUMBER</code></li>
                                        <li>Click "Save & Deploy"</li>
                                    </ol>
                                    <p className="text-xs text-yellow-700 mt-3">
                                        💡 <strong>Why?</strong> Webhooks from Sinch come from external servers and can't access your database settings. Environment variables solve this.
                                    </p>
                                </div>

                                {settings.sinch_configured ? (
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 text-green-800 mb-2">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">Sinch Connected!</span>
                                        </div>
                                        <p className="text-sm text-green-700 mb-2">
                                            Your SMS keyword system is active. Phone: {settings.sinch_phone_number}
                                        </p>
                                        <div className="bg-white p-3 rounded border border-green-200 mt-3">
                                            <p className="text-xs font-semibold text-green-900 mb-1">📋 Test Your Setup:</p>
                                            <ol className="text-xs text-green-800 space-y-1 list-decimal ml-4">
                                                <li>Create a keyword in SMS Keywords page</li>
                                                <li>Text that keyword to: <strong>{settings.sinch_phone_number}</strong></li>
                                                <li>Check TextMessaging → Message History tab for logs</li>
                                                <li>If no response, check Dashboard → Code → Functions → handleIncomingSinchSMS for errors</li>
                                            </ol>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setSettings(prev => ({ ...prev, sinch_configured: false }))}
                                            className="mt-3"
                                        >
                                            Update Credentials
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="sinch_service_plan_id">
                                                    Service Plan ID
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="sinch_service_plan_id"
                                                    value={settings.sinch_service_plan_id}
                                                    onChange={(e) => handleChange('sinch_service_plan_id', e.target.value)}
                                                    placeholder="abc123def456..."
                                                    type="text"
                                                />
                                                <p className="text-xs text-slate-500">
                                                    Find in Sinch Dashboard → SMS → Service Plans
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="sinch_api_token">
                                                    API Token
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="sinch_api_token"
                                                    value={settings.sinch_api_token}
                                                    onChange={(e) => handleChange('sinch_api_token', e.target.value)}
                                                    placeholder="Your API token"
                                                    type="password"
                                                />
                                                <p className="text-xs text-slate-500">
                                                    Find in Sinch Dashboard → SMS → API Tokens
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="sinch_phone_number">
                                                    Sinch Phone Number
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="sinch_phone_number"
                                                    value={settings.sinch_phone_number}
                                                    onChange={(e) => handleChange('sinch_phone_number', e.target.value)}
                                                    placeholder="+15551234567"
                                                    type="tel"
                                                />
                                                <p className="text-xs text-slate-500">
                                                    Must include country code (e.g., +1 for US). Find in Numbers → Active Numbers
                                                </p>
                                            </div>

                                            <Button 
                                                onClick={testSinchConnection}
                                                disabled={!settings.sinch_service_plan_id || !settings.sinch_api_token || !settings.sinch_phone_number || sinchTestResult?.status === 'testing' || isSaving}
                                                className="w-full"
                                            >
                                                {isSaving || sinchTestResult?.status === 'testing' ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        {isSaving ? "Saving..." : "Testing Connection..."}
                                                    </>
                                                ) : (
                                                    "Save & Test Connection"
                                                )}
                                            </Button>

                                            {sinchTestResult?.status === 'success' && (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center gap-2 text-green-800">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="font-medium">Success!</span>
                                                    </div>
                                                    <p className="text-sm text-green-700 mt-1">
                                                        {sinchTestResult.message}
                                                    </p>
                                                    {sinchTestResult.details?.next_steps && (
                                                        <div className="mt-3 space-y-1">
                                                            {sinchTestResult.details.next_steps.map((step, idx) => (
                                                                <p key={idx} className="text-xs text-green-700">{step}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {sinchTestResult?.status === 'error' && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <div className="flex items-center gap-2 text-red-800">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span className="font-medium">Connection Failed</span>
                                                    </div>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        {sinchTestResult.message}
                                                    </p>
                                                    {sinchTestResult.details?.next_steps && (
                                                        <div className="mt-3 space-y-1">
                                                            {sinchTestResult.details.next_steps.map((step, idx) => (
                                                                <p key={idx} className="text-xs text-red-700">{step}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="mt-3 p-2 bg-white rounded border border-red-200">
                                                        <p className="text-xs text-red-800 font-medium mb-1">Common Issues:</p>
                                                        <ul className="text-xs text-red-700 space-y-1 list-disc ml-4">
                                                            <li>Double-check your Service Plan ID is correct</li>
                                                            <li>Make sure API Token hasn't expired</li>
                                                            <li>Verify phone number format: +15551234567</li>
                                                            <li>Check your Sinch account is active</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-900 mb-2">🚀 Complete Setup Checklist</h4>
                                            <ol className="text-sm text-blue-800 space-y-2 list-decimal ml-4">
                                                <li>Sign up at <a href="https://www.sinch.com/sign-up/" target="_blank" rel="noopener noreferrer" className="underline font-medium">sinch.com/sign-up</a></li>
                                                <li>Get Service Plan ID, API Token, and Phone Number from Sinch dashboard</li>
                                                <li>Enter credentials above and click "Save & Test Connection"</li>
                                                <li><strong className="text-red-600">CRITICAL:</strong> Go to Dashboard → Code → Environment Variables and add all three credentials there too</li>
                                                <li>Configure webhook in Sinch Dashboard (see below)</li>
                                                <li>Create your first keyword in SMS Keywords page</li>
                                                <li>Text the keyword to test!</li>
                                            </ol>
                                        </div>

                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                            <h4 className="font-semibold text-purple-900 mb-2">🔗 Webhook Configuration</h4>
                                            <p className="text-sm text-purple-800 mb-3">
                                                In Sinch Dashboard → Numbers → Your Number → Webhooks → Set Inbound SMS URL to:
                                            </p>
                                            <div className="bg-white p-3 rounded border border-purple-300">
                                                <code className="text-xs break-all block text-purple-900 font-mono">
                                                    https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS
                                                </code>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 text-xs"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText('https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS');
                                                        alert('Webhook URL copied to clipboard!');
                                                    }}
                                                >
                                                    📋 Copy URL
                                                </Button>
                                            </div>
                                            <p className="text-xs text-purple-700 mt-2">
                                                ⚠️ <strong>Important:</strong> URL must end with <code>handleIncomingSinchSMS</code> (not handleIncomingSMS)
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Kiosk Setup Tab */}
                    <TabsContent value="kiosk">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <SettingsIcon className="w-5 h-5" />
                                    Kiosk Mode Setup
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Alert className="border-blue-200 bg-blue-50">
                                    <AlertDescription className="text-blue-800">
                                        <p className="font-semibold mb-2">📱 Set up iPads or Android tablets as kiosks</p>
                                        <p className="text-sm">Configure devices for giving, check-in, bookstore, or coffee shop.</p>
                                    </AlertDescription>
                                </Alert>

                                <div className="grid gap-4">
                                    <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                            ❤️ Giving Kiosk
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-3">Accept donations via tablet</p>
                                        <Button
                                            onClick={() => window.location.href = createPageUrl('KioskGivingSetup')}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Setup Giving Kiosk
                                        </Button>
                                    </div>

                                    <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                            👶 Kids Check-In
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-3">Check children in/out securely</p>
                                        <Button
                                            onClick={() => window.location.href = createPageUrl('KidsCheckIn')}
                                            variant="outline"
                                            className="border-blue-300"
                                        >
                                            Go to Kids Check-In
                                        </Button>
                                    </div>

                                    <div className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-amber-50">
                                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                            ☕ Coffee Shop
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-3">Run your café with tablet POS</p>
                                        <Button
                                            onClick={() => window.location.href = createPageUrl('CoffeeShopKiosk')}
                                            variant="outline"
                                            className="border-orange-300"
                                        >
                                            Setup Coffee Shop
                                        </Button>
                                    </div>

                                    <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                            📚 Bookstore
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-3">Sell books and resources</p>
                                        <Button
                                            onClick={() => window.location.href = createPageUrl('Bookstore')}
                                            variant="outline"
                                            className="border-purple-300"
                                        >
                                            Go to Bookstore
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-3">📖 Setup Guides</h3>
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => window.location.href = createPageUrl('HardwareSetupWizard')}
                                        >
                                            <SettingsIcon className="w-4 h-4 mr-2" />
                                            Hardware Setup Wizard
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => window.location.href = createPageUrl('PrinterSetup')}
                                        >
                                            ⚙️ Printer Setup Guide
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Custom Fields Tab */}
                    <TabsContent value="custom-fields">
                        <CustomFieldsManager />
                    </TabsContent>

                    {/* Member Groups Tab */}
                    <TabsContent value="member-groups">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Member Groups Management</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-slate-600">
                                    Manage your member groups, create small groups, ministries, and committees.
                                </p>
                                <Button onClick={() => window.location.href = createPageUrl("MemberGroups")} className="w-full">
                                    <Users className="w-4 h-4 mr-2" />
                                    Go to Member Groups Management
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* NEW: Subscription Tab Content */}
                    <TabsContent value="subscription">
                        <div className="space-y-6">
                            {/* Current Plan */}
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Subscription & Features</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Current Plan Display with Debug Info */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div>
                                                <p className="text-sm text-blue-600 font-medium">Current Plan</p>
                                                <p className="text-2xl font-bold text-blue-900">{getPlanName()}</p>
                                                {subscription && (
                                                    <div className="mt-2 space-y-1">
                                                        <Badge className={
                                                            subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }>
                                                            {subscription.status}
                                                        </Badge>
                                                        <p className="text-xs text-slate-600 mt-2">
                                                            Plan tier: <code className="bg-slate-100 px-1 rounded">{subscription.subscription_tier}</code>
                                                        </p>
                                                        {subscription.stripe_subscription_id && (
                                                            <p className="text-xs text-slate-600">
                                                                Stripe ID: <code className="bg-slate-100 px-1 rounded text-[10px]">{subscription.stripe_subscription_id}</code>
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    onClick={() => {window.location.href = createPageUrl('SubscriptionPlans');}}
                                                    variant="outline"
                                                >
                                                    Change Plan
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        refresh();
                                                        alert('Subscription refreshed! Check your plan above.');
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Refresh Status
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Feature Debug Panel */}
                                        {subscription && (
                                            <details className="p-4 bg-slate-50 rounded-lg border">
                                                <summary className="cursor-pointer font-semibold text-sm text-slate-700">
                                                    🔍 Debug: View Feature Flags
                                                </summary>
                                                <div className="mt-3 space-y-2 text-xs">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="p-2 bg-white rounded border">
                                                            <p className="font-semibold text-slate-600 mb-1">SMS Enabled:</p>
                                                            <p className={features?.sms_enabled ? 'text-green-600 font-bold' : 'text-red-600'}>
                                                                {features?.sms_enabled ? '✅ YES' : '❌ NO'}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-white rounded border">
                                                            <p className="font-semibold text-slate-600 mb-1">SMS Limit:</p>
                                                            <p className="font-bold">{features?.sms_monthly_limit || 0}</p>
                                                        </div>
                                                        <div className="p-2 bg-white rounded border">
                                                            <p className="font-semibold text-slate-600 mb-1">MMS Enabled:</p>
                                                            <p className={features?.mms_enabled ? 'text-green-600 font-bold' : 'text-red-600'}>
                                                                {features?.mms_enabled ? '✅ YES' : '❌ NO'}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-white rounded border">
                                                            <p className="font-semibold text-slate-600 mb-1">Video Enabled:</p>
                                                            <p className={features?.video_enabled ? 'text-green-600 font-bold' : 'text-red-600'}>
                                                                {features?.video_enabled ? '✅ YES' : '❌ NO'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-white rounded border mt-2">
                                                        <p className="font-semibold text-slate-600 mb-1">Full Features Object:</p>
                                                        <pre className="text-[10px] overflow-auto">{JSON.stringify(features, null, 2)}</pre>
                                                    </div>
                                                </div>
                                            </details>
                                        )}
                                    </div>

                                    {/* Add-Ons */}
                                    <AddOnsManager />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end mt-8">
                    <Button onClick={async () => { await handleSave(); alert("Settings saved successfully!");}} disabled={isSaving} size="lg">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Settings"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}