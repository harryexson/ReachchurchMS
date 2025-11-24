
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Tablet, 
    Smartphone, 
    CheckCircle, 
    AlertCircle, 
    Copy, 
    ExternalLink,
    Lock,
    Wifi,
    Battery,
    Settings,
    Shield,
    QrCode,
    Home,
    Eye,
    EyeOff,
    MonitorSmartphone,
    Mail,
    X,
    FileText,
    Video
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function KioskGivingSetup() {
    const [showUrl, setShowUrl] = useState(false);
    const kioskUrl = `${window.location.origin}/kiosk-giving`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(kioskUrl);
        alert("Kiosk URL copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/2ca3c03b0_ReachLOGOEdited08_44_18AM.png"
                            alt="REACH ChurchConnect Logo"
                            className="h-16 w-auto"
                        />
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900">Kiosk Giving Setup Guide</h1>
                            <p className="text-lg text-slate-600">Set up iPad or Android tablets for in-church donations</p>
                        </div>
                    </div>
                </div>

                {/* Quick Start Alert */}
                <Alert className="mb-8 border-2 border-green-200 bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription>
                        <p className="font-semibold text-green-900 mb-2">⚡ Quick Start (5 Minutes):</p>
                        <ol className="text-sm text-green-800 space-y-1 list-decimal ml-5">
                            <li>Scan the QR code below with your tablet's camera</li>
                            <li>Open the link in Safari (iPad) or Chrome (Android)</li>
                            <li>Enable Guided Access (iPad) or Screen Pinning (Android)</li>
                            <li>Place tablet in a secure stand near the entrance - Done! ✅</li>
                        </ol>
                    </AlertDescription>
                </Alert>

                {/* Kiosk URL Card */}
                <Card className="mb-8 shadow-xl border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle className="flex items-center gap-2">
                            <ExternalLink className="w-5 h-5" />
                            Your Kiosk Giving URL
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px] bg-slate-100 rounded-lg p-4 font-mono text-sm break-all">
                                {showUrl ? kioskUrl : '••••••••••••••••••••••••••'}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowUrl(!showUrl)}
                            >
                                {showUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button onClick={copyToClipboard} className="bg-blue-600 hover:bg-blue-700">
                                <Copy className="w-4 h-4 mr-2" />
                                Copy URL
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-700 mb-3">📱 Scan with Tablet Camera</p>
                                <div className="bg-white p-6 rounded-xl border-2 border-slate-200 inline-block shadow-lg">
                                    <div className="bg-white p-4">
                                        {/* QR Code Placeholder - using a simple generated one */}
                                        <svg width="200" height="200" viewBox="0 0 200 200">
                                            <rect width="200" height="200" fill="white"/>
                                            <rect x="20" y="20" width="40" height="40" fill="black"/>
                                            <rect x="140" y="20" width="40" height="40" fill="black"/>
                                            <rect x="20" y="140" width="40" height="40" fill="black"/>
                                            <rect x="80" y="60" width="40" height="40" fill="black"/>
                                            <rect x="100" y="100" width="60" height="60" fill="black"/>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3">
                                    1. Open your tablet's camera<br/>
                                    2. Point at this QR code<br/>
                                    3. Tap the link that appears
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-3">✉️ Or Email to Your Tech Team</p>
                                <div className="space-y-3">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => window.location.href = `mailto:?subject=Kiosk Giving Setup&body=Here's the kiosk giving URL for setup: ${kioskUrl}%0A%0ASetup instructions: ${window.location.href}`}
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Email Setup Link
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={() => window.open(kioskUrl, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Test Kiosk Page
                                    </Button>
                                </div>
                                <Alert className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        <strong>Tip:</strong> Bookmark this page on your tablet for quick access during setup
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Setup Instructions Tabs */}
                <Tabs defaultValue="ipad" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 h-auto">
                        <TabsTrigger value="ipad" className="flex flex-col gap-2 py-3">
                            <Tablet className="w-5 h-5" />
                            <span>iPad Setup</span>
                        </TabsTrigger>
                        <TabsTrigger value="android" className="flex flex-col gap-2 py-3">
                            <Smartphone className="w-5 h-5" />
                            <span>Android Setup</span>
                        </TabsTrigger>
                        <TabsTrigger value="tips" className="flex flex-col gap-2 py-3">
                            <Shield className="w-5 h-5" />
                            <span>Best Practices</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* iPad Setup */}
                    <TabsContent value="ipad">
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Tablet className="w-6 h-6 text-blue-600" />
                                    iPad Setup Instructions (5-10 minutes)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Step 1 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        1
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Open Safari Browser</h3>
                                        <p className="text-slate-600 mb-3">
                                            ⚠️ Important: You MUST use Safari (not Chrome) for kiosk mode to work properly on iPad.
                                        </p>
                                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                            <p className="text-sm font-semibold text-blue-900 mb-2">Option A: Scan QR Code</p>
                                            <p className="text-sm text-blue-800">1. Open Camera app → 2. Point at QR code above → 3. Tap the link</p>
                                            <hr className="my-3 border-blue-300" />
                                            <p className="text-sm font-semibold text-blue-900 mb-2">Option B: Type URL</p>
                                            <p className="text-sm font-mono text-blue-800 break-all bg-white p-2 rounded">{kioskUrl}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        2
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Add to Home Screen</h3>
                                        <ol className="text-slate-600 space-y-2 list-decimal ml-5">
                                            <li>Tap the <strong>Share button</strong> (square with ↑ arrow) at the bottom</li>
                                            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                                            <li>Name it <strong>"Give"</strong> or <strong>"Kiosk"</strong></li>
                                            <li>Tap <strong>"Add"</strong> in the top right</li>
                                        </ol>
                                        <Alert className="mt-4 bg-amber-50 border-amber-300">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <AlertDescription className="text-sm text-amber-900">
                                                <strong>Why this step?</strong> This creates a full-screen app without the Safari browser UI, giving a cleaner kiosk experience.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        3
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Enable Guided Access (Kiosk Mode)</h3>
                                        <div className="space-y-4 text-slate-600">
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <p className="font-semibold text-slate-900 mb-2">🔧 First-Time Setup (One-Time Only):</p>
                                                <ol className="space-y-2 list-decimal ml-5 text-sm">
                                                    <li>Go to <strong>Settings → Accessibility → Guided Access</strong></li>
                                                    <li>Turn ON <strong>"Guided Access"</strong></li>
                                                    <li>Tap <strong>"Passcode Settings"</strong> and set a PIN (you'll need this to exit)</li>
                                                    <li>Turn ON <strong>"Display Auto-Lock"</strong> and set to <strong>"Never"</strong></li>
                                                </ol>
                                            </div>

                                            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                                                <p className="font-semibold text-green-900 mb-2">✅ Activate Kiosk Mode (Every Time):</p>
                                                <ol className="space-y-2 list-decimal ml-5 text-sm text-green-800">
                                                    <li>Open the "Give" app from your home screen</li>
                                                    <li><strong>Triple-click</strong> the Side Button (or Home Button on older iPads)</li>
                                                    <li>Tap <strong>"Options"</strong> in the bottom left</li>
                                                    <li>Turn OFF: Touch, Motion, Volume Buttons, Keyboards</li>
                                                    <li>Tap <strong>"Done"</strong>, then tap <strong>"Start"</strong> in top right</li>
                                                </ol>
                                            </div>

                                            <Alert className="bg-purple-50 border-purple-300">
                                                <Shield className="h-4 w-4 text-purple-600" />
                                                <AlertDescription className="text-sm text-purple-900">
                                                    <strong>🔒 To Exit Kiosk Mode Later:</strong><br/>
                                                    Triple-click Side Button → Enter your passcode → Tap "End"
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        4
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Additional Settings</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Battery className="w-5 h-5 text-green-600" />
                                                    <p className="font-semibold text-sm">Power Settings</p>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Settings → Display & Brightness → Auto-Lock → <strong>Never</strong>
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Wifi className="w-5 h-5 text-blue-600" />
                                                    <p className="font-semibold text-sm">WiFi Connection</p>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Ensure strong, stable WiFi connection for payment processing
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 shadow-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                        <p className="font-bold text-lg text-green-900">Setup Complete! 🎉</p>
                                    </div>
                                    <p className="text-sm text-green-800">
                                        Your iPad is now locked in kiosk mode. Members can give donations without accessing other apps or settings. Test it by trying to swipe up or press the home button - it should stay on the giving page!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Android Setup */}
                    <TabsContent value="android">
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-6 h-6 text-green-600" />
                                    Android Tablet Setup (5-10 minutes)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Step 1 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        1
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Open Chrome Browser</h3>
                                        <p className="text-slate-600 mb-3">
                                            Open Google Chrome and navigate to your kiosk URL:
                                        </p>
                                        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                                            <p className="text-sm font-semibold text-green-900 mb-2">Option A: Scan QR Code</p>
                                            <p className="text-sm text-green-800">Open Camera → Point at QR above → Tap link</p>
                                            <hr className="my-3 border-green-300" />
                                            <p className="text-sm font-semibold text-green-900 mb-2">Option B: Type URL</p>
                                            <p className="text-sm font-mono text-green-800 break-all bg-white p-2 rounded">{kioskUrl}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        2
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Install as App</h3>
                                        <ol className="text-slate-600 space-y-2 list-decimal ml-5">
                                            <li>Tap the <strong>Menu</strong> button (⋮ three dots in top right)</li>
                                            <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                                            <li>Name it <strong>"Give"</strong> or <strong>"Kiosk"</strong></li>
                                            <li>Tap <strong>"Add"</strong> or <strong>"Install"</strong></li>
                                        </ol>
                                    </div>
                                </div>

                                {/* Step 3 - Method A */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        3A
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Method A: Built-in Screen Pinning (Free)</h3>
                                        <div className="space-y-4 text-slate-600">
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <p className="font-semibold text-slate-900 mb-2">🔧 One-Time Setup:</p>
                                                <ol className="space-y-2 list-decimal ml-5 text-sm">
                                                    <li>Go to <strong>Settings → Security → Screen Pinning</strong></li>
                                                    <li>Turn ON <strong>"Screen Pinning"</strong></li>
                                                    <li>Enable <strong>"Ask for PIN before unpinning"</strong></li>
                                                    <li>Set a PIN code</li>
                                                </ol>
                                            </div>

                                            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                                                <p className="font-semibold text-green-900 mb-2">✅ Activate Kiosk Mode:</p>
                                                <ol className="space-y-2 list-decimal ml-5 text-sm text-green-800">
                                                    <li>Open the "Give" app from home screen</li>
                                                    <li>Tap the <strong>Recent Apps</strong> button (square ⊡ icon)</li>
                                                    <li>Tap the app icon at the top of the card</li>
                                                    <li>Select <strong>"Pin"</strong> 📌</li>
                                                </ol>
                                            </div>

                                            <Alert className="bg-purple-50 border-purple-300">
                                                <Shield className="h-4 w-4 text-purple-600" />
                                                <AlertDescription className="text-sm text-purple-900">
                                                    <strong>🔒 To Unpin Later:</strong> Hold Back ◁ & Recent Apps ⊡ buttons together → Enter PIN
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 - Method B */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        3B
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Method B: Kiosk App (Recommended for Samsung)</h3>
                                        <Badge className="mb-3 bg-purple-100 text-purple-800">More Secure & Feature-Rich</Badge>
                                        <p className="text-slate-600 mb-3">
                                            For better security and advanced features, install a dedicated kiosk app:
                                        </p>
                                        <div className="grid gap-3">
                                            <div className="bg-slate-50 p-4 rounded-lg border hover:border-purple-500 transition">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <Tablet className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold mb-1">📱 Fully Kiosk Browser (Best Option)</p>
                                                        <p className="text-sm text-slate-600 mb-2">
                                                            Professional kiosk mode with auto-reload, motion detection, and remote management
                                                        </p>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => window.open('https://play.google.com/store/apps/details?id=de.ozerov.fully', '_blank')}
                                                        >
                                                            <ExternalLink className="w-3 h-3 mr-1" />
                                                            Get from Play Store
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border hover:border-purple-500 transition">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <Lock className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold mb-1">🔒 Kiosk Browser Lockdown</p>
                                                        <p className="text-sm text-slate-600 mb-2">
                                                            Simple and effective kiosk lockdown with password protection
                                                        </p>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => window.open('https://play.google.com/store/apps/details?id=com.procoit.kioskbrowser', '_blank')}
                                                        >
                                                            <ExternalLink className="w-3 h-3 mr-1" />
                                                            Get from Play Store
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Alert className="mt-4">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                                <strong>Setup:</strong> Install app → Open it → Enter your kiosk URL → Enable lockdown mode → Done!
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        4
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2 text-slate-900">Additional Settings</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Battery className="w-5 h-5 text-green-600" />
                                                    <p className="font-semibold text-sm">Screen Timeout</p>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Settings → Display → Screen timeout → <strong>30 minutes</strong> or <strong>Never</strong>
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Wifi className="w-5 h-5 text-blue-600" />
                                                    <p className="font-semibold text-sm">Stay Connected</p>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Keep WiFi always connected for seamless payment processing
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 shadow-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                        <p className="font-bold text-lg text-green-900">Setup Complete! 🎉</p>
                                    </div>
                                    <p className="text-sm text-green-800">
                                        Your Android tablet is now in kiosk mode and ready to accept donations!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Best Practices */}
                    <TabsContent value="tips">
                        <div className="grid gap-6">
                            {/* Physical Setup */}
                            <Card className="shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                                    <CardTitle>🏛️ Physical Setup & Placement</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                ✅ Do This:
                                            </h4>
                                            <ul className="space-y-2 text-sm text-slate-600">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>Place near entrance/exit for high visibility</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>Use a secure tablet stand or wall mount</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>Position at comfortable standing height (42-48 inches)</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>Ensure power outlet nearby or use charged device</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>Add clear signage: "Digital Giving" or "Give Here"</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>Keep area well-lit and accessible</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                                <X className="w-5 h-5 text-red-600" />
                                                ❌ Avoid This:
                                            </h4>
                                            <ul className="space-y-2 text-sm text-slate-600">
                                                <li className="flex items-start gap-2">
                                                    <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Don't leave tablet unsecured or portable</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Don't place in dark corners or hidden areas</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Don't block walkways or emergency exits</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Don't use damaged or outdated tablets</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <span>Don't forget to test before Sunday service</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Security */}
                            <Card className="shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="w-6 h-6 text-red-600" />
                                        🔒 Security Best Practices
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-lg border">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Lock className="w-5 h-5 text-red-600" />
                                                <h4 className="font-semibold">Physical Security</h4>
                                            </div>
                                            <ul className="text-sm text-slate-600 space-y-2">
                                                <li>• Use anti-theft cable lock or secure mount</li>
                                                <li>• Anchor tablet stand to wall or heavy furniture</li>
                                                <li>• Consider security case with lock</li>
                                                <li>• Monitor during services (place near staff)</li>
                                                <li>• Store securely when not in use</li>
                                            </ul>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Shield className="w-5 h-5 text-blue-600" />
                                                <h4 className="font-semibold">Digital Security</h4>
                                            </div>
                                            <ul className="text-sm text-slate-600 space-y-2">
                                                <li>• Always enable kiosk mode/guided access</li>
                                                <li>• Use strong passcode for unlocking (6+ digits)</li>
                                                <li>• Keep iOS/Android updated monthly</li>
                                                <li>• Disable notifications in kiosk mode</li>
                                                <li>• Test security weekly by trying to exit</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Maintenance */}
                            <Card className="shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="w-6 h-6 text-blue-600" />
                                        🔧 Maintenance & Troubleshooting
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-900 mb-3">📋 Weekly Checklist:</h4>
                                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-blue-800">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-4 h-4" />
                                                    <span>Test donation flow start-to-finish</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-4 h-4" />
                                                    <span>Check WiFi connection strength</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-4 h-4" />
                                                    <span>Verify battery level/power connection</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-4 h-4" />
                                                    <span>Clean screen with microfiber cloth</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-4 h-4" />
                                                    <span>Ensure kiosk mode is still active</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" className="w-4 h-4" />
                                                    <span>Check for software updates</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                            <h4 className="font-semibold text-amber-900 mb-3">🔍 Common Issues & Solutions:</h4>
                                            <div className="space-y-3">
                                                <div className="border-l-4 border-amber-500 pl-3">
                                                    <p className="text-sm font-semibold text-amber-900">❌ Problem: Kiosk exits to home screen</p>
                                                    <p className="text-sm text-amber-800">✅ Solution: Re-enable Guided Access (iPad) or Screen Pinning (Android)</p>
                                                </div>
                                                <div className="border-l-4 border-amber-500 pl-3">
                                                    <p className="text-sm font-semibold text-amber-900">❌ Problem: "Payment failed" error</p>
                                                    <p className="text-sm text-amber-800">✅ Solution: Check WiFi connection, verify Stripe is connected in Settings → Giving tab</p>
                                                </div>
                                                <div className="border-l-4 border-amber-500 pl-3">
                                                    <p className="text-sm font-semibold text-amber-900">❌ Problem: Screen dims or locks</p>
                                                    <p className="text-sm text-amber-800">✅ Solution: Set auto-lock to "Never" in device settings</p>
                                                </div>
                                                <div className="border-l-4 border-amber-500 pl-3">
                                                    <p className="text-sm font-semibold text-amber-900">❌ Problem: Page won't load</p>
                                                    <p className="text-sm text-amber-800">✅ Solution: Check internet connection, clear browser cache, restart tablet</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recommended Hardware */}
                            <Card className="shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <MonitorSmartphone className="w-6 h-6 text-green-600" />
                                        🛒 Recommended Hardware
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 p-5 rounded-xl border-2 text-center hover:border-blue-500 hover:shadow-lg transition">
                                            <Badge className="mb-3 bg-blue-600">Budget-Friendly</Badge>
                                            <h4 className="font-bold text-lg mb-2">Basic Setup</h4>
                                            <p className="text-3xl font-bold text-slate-900 mb-3">~$300</p>
                                            <ul className="text-sm text-slate-600 space-y-2 text-left">
                                                <li>• Amazon Fire HD 10 ($150)</li>
                                                <li>• Basic tablet stand ($30)</li>
                                                <li>• Cable lock ($20)</li>
                                                <li>• Printed signage ($100)</li>
                                            </ul>
                                            <Badge className="mt-3 bg-slate-200 text-slate-700">Good for small churches</Badge>
                                        </div>
                                        <div className="bg-blue-50 p-5 rounded-xl border-4 border-blue-500 text-center shadow-xl relative">
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                <Badge className="bg-green-600 text-white px-4 py-1 shadow-lg">⭐ Recommended</Badge>
                                            </div>
                                            <h4 className="font-bold text-lg mb-2 mt-2">Standard Setup</h4>
                                            <p className="text-3xl font-bold text-blue-900 mb-3">~$600</p>
                                            <ul className="text-sm text-slate-700 space-y-2 text-left">
                                                <li>• iPad 10.2" 64GB ($350)</li>
                                                <li>• Security stand + mount ($150)</li>
                                                <li>• Anti-theft cable ($50)</li>
                                                <li>• Custom signage ($50)</li>
                                            </ul>
                                            <Badge className="mt-3 bg-blue-600 text-white">Best value & reliability</Badge>
                                        </div>
                                        <div className="bg-slate-50 p-5 rounded-xl border-2 text-center hover:border-purple-500 hover:shadow-lg transition">
                                            <Badge className="mb-3 bg-purple-600">Premium</Badge>
                                            <h4 className="font-bold text-lg mb-2">Professional Setup</h4>
                                            <p className="text-3xl font-bold text-slate-900 mb-3">~$1,200</p>
                                            <ul className="text-sm text-slate-600 space-y-2 text-left">
                                                <li>• iPad Pro 12.9" ($800)</li>
                                                <li>• Premium kiosk enclosure ($300)</li>
                                                <li>• Built-in security ($100)</li>
                                                <li>• Professional installation</li>
                                            </ul>
                                            <Badge className="mt-3 bg-slate-200 text-slate-700">Enterprise-grade</Badge>
                                        </div>
                                    </div>
                                    <Alert className="mt-6">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-sm">
                                            <strong>💡 Shopping Links:</strong> 
                                            <a href="https://www.amazon.com/s?k=tablet+kiosk+stand" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                                Amazon Tablet Stands
                                            </a> | 
                                            <a href="https://www.amazon.com/s?k=tablet+security+lock" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                                Security Locks
                                            </a>
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Quick Actions */}
                <Card className="mt-8 shadow-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-lg mb-4 text-slate-900">🚀 Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => window.open(kioskUrl, '_blank')} className="bg-green-600 hover:bg-green-700">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Test Kiosk Page Now
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = createPageUrl('Settings')}>
                                <Settings className="w-4 h-4 mr-2" />
                                Customize Branding
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = createPageUrl('Giving')}>
                                <Home className="w-4 h-4 mr-2" />
                                View Donations
                            </Button>
                            <Button variant="outline" onClick={() => window.print()}>
                                <FileText className="w-4 h-4 mr-2" />
                                Print Instructions
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Video Tutorial Placeholder */}
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                    <CardContent className="p-8 text-center">
                        <Video className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">🎥 Video Tutorial Coming Soon!</h3>
                        <p className="text-slate-600 mb-4">
                            We're creating a step-by-step video guide to make setup even easier.
                        </p>
                        <p className="text-sm text-slate-500">
                            Need help? Email us at support@churchconnect.app
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
