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
    EyeOff
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function KioskSetupInstructions() {
    const [showUrl, setShowUrl] = useState(false);
    const kioskUrl = `${window.location.origin}/kioskgiving`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(kioskUrl);
        alert("Kiosk URL copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Tablet className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">Kiosk Giving Setup Guide</h1>
                        <p className="text-lg text-slate-600">Set up iPad or Android tablets for in-church donations</p>
                    </div>
                </div>

                {/* Quick Start Alert */}
                <Alert className="mb-8 border-2 border-green-200 bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription>
                        <p className="font-semibold text-green-900 mb-2">Quick Start Summary:</p>
                        <ol className="text-sm text-green-800 space-y-1 list-decimal ml-5">
                            <li>Open the kiosk URL on your tablet's browser</li>
                            <li>Enable Guided Access (iPad) or Kiosk Mode (Android)</li>
                            <li>Place tablet in a secure stand near the entrance</li>
                            <li>Done! Members can now give easily</li>
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
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-slate-100 rounded-lg p-4 font-mono text-sm">
                                {showUrl ? kioskUrl : '••••••••••••••••••••••••••'}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowUrl(!showUrl)}
                            >
                                {showUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button onClick={copyToClipboard}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy URL
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">📱 Scan QR Code</p>
                                <div className="bg-white p-4 rounded-lg border-2 border-slate-200 inline-block">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(kioskUrl)}`}
                                        alt="Kiosk QR Code"
                                        width={200}
                                        height={200}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Scan this with your tablet's camera to open the kiosk page</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">✉️ Email Instructions</p>
                                <p className="text-sm text-slate-600 mb-3">Send the setup link to yourself or your tech team</p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => window.location.href = `mailto:?subject=Kiosk Giving Setup&body=Here's the kiosk giving URL: ${kioskUrl}`}
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Email Link
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Setup Instructions Tabs */}
                <Tabs defaultValue="ipad" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="ipad">
                            <Tablet className="w-4 h-4 mr-2" />
                            iPad Setup
                        </TabsTrigger>
                        <TabsTrigger value="android">
                            <Smartphone className="w-4 h-4 mr-2" />
                            Android Setup
                        </TabsTrigger>
                        <TabsTrigger value="tips">
                            <Shield className="w-4 h-4 mr-2" />
                            Best Practices
                        </TabsTrigger>
                    </TabsList>

                    {/* iPad Setup */}
                    <TabsContent value="ipad">
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardTitle>iPad Setup Instructions</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Step 1 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                        1
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Open Safari Browser</h3>
                                        <p className="text-slate-600 mb-3">
                                            Open Safari (not Chrome) and navigate to your kiosk URL or scan the QR code above.
                                        </p>
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <p className="text-sm font-mono break-all">{kioskUrl}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                        2
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Add to Home Screen</h3>
                                        <ol className="text-slate-600 space-y-2 list-disc ml-5">
                                            <li>Tap the <strong>Share</strong> button (square with arrow pointing up)</li>
                                            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                                            <li>Name it "Give" or "Kiosk"</li>
                                            <li>Tap <strong>"Add"</strong></li>
                                        </ol>
                                        <Alert className="mt-3">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-sm">
                                                This creates a full-screen app without browser UI
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                        3
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Enable Guided Access (Kiosk Mode)</h3>
                                        <div className="space-y-3 text-slate-600">
                                            <p className="font-semibold">Go to Settings → Accessibility → Guided Access:</p>
                                            <ol className="space-y-2 list-decimal ml-5">
                                                <li>Turn on <strong>Guided Access</strong></li>
                                                <li>Set a <strong>Passcode</strong> (you'll need this to exit kiosk mode)</li>
                                                <li>Enable <strong>"Display Auto-Lock"</strong> → Never</li>
                                                <li>Open the kiosk app from home screen</li>
                                                <li>Triple-click the <strong>Side Button</strong></li>
                                                <li>Tap <strong>"Start"</strong> in the top right</li>
                                            </ol>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-3">
                                            <p className="text-sm font-semibold text-amber-900 mb-1">💡 Pro Tip:</p>
                                            <p className="text-sm text-amber-800">
                                                To exit Guided Access later: Triple-click Side Button → Enter passcode → Tap "End"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                        4
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Additional Settings</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Battery className="w-4 h-4 text-green-600" />
                                                    <p className="font-semibold text-sm">Power Settings</p>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Settings → Display & Brightness → Auto-Lock → <strong>Never</strong>
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Wifi className="w-4 h-4 text-blue-600" />
                                                    <p className="font-semibold text-sm">WiFi Connection</p>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Ensure strong, stable WiFi connection for payment processing
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <p className="font-semibold text-green-900">Setup Complete!</p>
                                    </div>
                                    <p className="text-sm text-green-800">
                                        Your iPad is now locked in kiosk mode. Members can give donations without accessing other apps or settings.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Android Setup */}
                    <TabsContent value="android">
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                <CardTitle>Android Tablet Setup Instructions</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Step 1 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                        1
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Open Chrome Browser</h3>
                                        <p className="text-slate-600 mb-3">
                                            Open Google Chrome and navigate to your kiosk URL or scan the QR code above.
                                        </p>
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <p className="text-sm font-mono break-all">{kioskUrl}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                        2
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Install as App</h3>
                                        <ol className="text-slate-600 space-y-2 list-disc ml-5">
                                            <li>Tap the <strong>Menu</strong> button (three dots in top right)</li>
                                            <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                                            <li>Name it "Give" or "Kiosk"</li>
                                            <li>Tap <strong>"Add"</strong> or <strong>"Install"</strong></li>
                                        </ol>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                        3
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Enable Screen Pinning (Kiosk Mode)</h3>
                                        <div className="space-y-3 text-slate-600">
                                            <p className="font-semibold">Go to Settings → Security → Screen Pinning:</p>
                                            <ol className="space-y-2 list-decimal ml-5">
                                                <li>Turn on <strong>Screen Pinning</strong></li>
                                                <li>Enable <strong>"Ask for PIN before unpinning"</strong></li>
                                                <li>Open the kiosk app from home screen</li>
                                                <li>Tap the <strong>Recent Apps</strong> button (square icon)</li>
                                                <li>Tap the app icon at the top of the card</li>
                                                <li>Select <strong>"Pin"</strong></li>
                                            </ol>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-3">
                                            <p className="text-sm font-semibold text-amber-900 mb-1">💡 Pro Tip:</p>
                                            <p className="text-sm text-amber-800">
                                                To unpin: Hold Back & Recent Apps buttons together → Enter PIN
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Alternative Option */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                                        ALT
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Alternative: Use a Kiosk App (Recommended for Samsung)</h3>
                                        <p className="text-slate-600 mb-3">
                                            For better security and features, install a dedicated kiosk app:
                                        </p>
                                        <div className="grid gap-3">
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <p className="font-semibold mb-1">📱 Fully Kiosk Browser (Free)</p>
                                                <p className="text-sm text-slate-600 mb-2">Best for tablets - locks device, hides navigation, auto-reload</p>
                                                <Button variant="outline" size="sm" onClick={() => window.open('https://play.google.com/store/apps/details?id=de.ozerov.fully', '_blank')}>
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    Get from Play Store
                                                </Button>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <p className="font-semibold mb-1">🔒 Kiosk Browser Lockdown (Free)</p>
                                                <p className="text-sm text-slate-600 mb-2">Simple and effective kiosk mode solution</p>
                                                <Button variant="outline" size="sm" onClick={() => window.open('https://play.google.com/store/apps/details?id=com.procoit.kioskbrowser', '_blank')}>
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    Get from Play Store
                                                </Button>
                                            </div>
                                        </div>
                                        <Alert className="mt-3">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-sm">
                                                After installing, open the app, enter your kiosk URL, and enable lockdown mode
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                                        4
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">Additional Settings</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Battery className="w-4 h-4 text-green-600" />
                                                    <p className="font-semibold text-sm">Screen Timeout</p>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Settings → Display → Screen timeout → <strong>30 minutes</strong> or <strong>Never</strong>
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Wifi className="w-4 h-4 text-blue-600" />
                                                    <p className="font-semibold text-sm">Stay Connected</p>
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Keep WiFi always connected for seamless payment processing
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <p className="font-semibold text-green-900">Setup Complete!</p>
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
                                            <h4 className="font-semibold text-slate-900">✅ Do This:</h4>
                                            <ul className="space-y-2 text-sm text-slate-600">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                    <span>Place near entrance/exit for visibility</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                    <span>Use a secure tablet stand or mount</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                    <span>Position at comfortable standing height</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                    <span>Ensure power outlet nearby or use charged device</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                    <span>Add clear signage: "Give Here" or "Digital Giving"</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                    <span>Keep area well-lit and accessible</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-900">❌ Avoid This:</h4>
                                            <ul className="space-y-2 text-sm text-slate-600">
                                                <li className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                                    <span>Don't leave tablet unsecured or portable</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                                    <span>Don't place in dark corners or hidden areas</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                                    <span>Don't block walkways or emergency exits</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                                    <span>Don't use damaged or outdated tablets</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
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
                                    <CardTitle>🔒 Security Best Practices</CardTitle>
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
                                            </ul>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Shield className="w-5 h-5 text-blue-600" />
                                                <h4 className="font-semibold">Digital Security</h4>
                                            </div>
                                            <ul className="text-sm text-slate-600 space-y-2">
                                                <li>• Always enable kiosk mode/guided access</li>
                                                <li>• Use strong passcode for unlocking</li>
                                                <li>• Keep iOS/Android updated</li>
                                                <li>• Disable notifications in kiosk mode</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Maintenance */}
                            <Card className="shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                    <CardTitle>🔧 Maintenance & Troubleshooting</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-900 mb-2">Weekly Checklist:</h4>
                                            <ul className="text-sm text-blue-800 space-y-1">
                                                <li>☐ Test donation flow from start to finish</li>
                                                <li>☐ Check WiFi connection strength</li>
                                                <li>☐ Verify battery level or power connection</li>
                                                <li>☐ Clean screen with microfiber cloth</li>
                                                <li>☐ Ensure kiosk mode is still active</li>
                                            </ul>
                                        </div>

                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                            <h4 className="font-semibold text-amber-900 mb-2">Common Issues & Solutions:</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900">Problem: Kiosk resets to home screen</p>
                                                    <p className="text-sm text-amber-800">Solution: Re-enable Guided Access (iPad) or Screen Pinning (Android)</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900">Problem: "Payment failed" error</p>
                                                    <p className="text-sm text-amber-800">Solution: Check WiFi connection, verify Stripe account is connected in Settings</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900">Problem: Screen dims or locks</p>
                                                    <p className="text-sm text-amber-800">Solution: Adjust auto-lock settings to "Never" in device settings</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recommended Hardware */}
                            <Card className="shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                    <CardTitle>🛒 Recommended Hardware</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-lg border text-center">
                                            <Badge className="mb-2 bg-blue-600">Budget</Badge>
                                            <h4 className="font-semibold mb-2">Basic Setup</h4>
                                            <p className="text-2xl font-bold text-slate-900 mb-2">~$300</p>
                                            <ul className="text-sm text-slate-600 space-y-1 text-left">
                                                <li>• Amazon Fire HD 10 ($150)</li>
                                                <li>• Basic tablet stand ($30)</li>
                                                <li>• Cable lock ($20)</li>
                                                <li>• Signage ($100)</li>
                                            </ul>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-500 text-center">
                                            <Badge className="mb-2 bg-green-600">Recommended</Badge>
                                            <h4 className="font-semibold mb-2">Standard Setup</h4>
                                            <p className="text-2xl font-bold text-slate-900 mb-2">~$600</p>
                                            <ul className="text-sm text-slate-600 space-y-1 text-left">
                                                <li>• iPad 10.2" ($350)</li>
                                                <li>• Security stand ($150)</li>
                                                <li>• Anti-theft mount ($50)</li>
                                                <li>• Custom signage ($50)</li>
                                            </ul>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border text-center">
                                            <Badge className="mb-2 bg-purple-600">Premium</Badge>
                                            <h4 className="font-semibold mb-2">Professional Setup</h4>
                                            <p className="text-2xl font-bold text-slate-900 mb-2">~$1,200</p>
                                            <ul className="text-sm text-slate-600 space-y-1 text-left">
                                                <li>• iPad Pro 12.9" ($800)</li>
                                                <li>• Premium kiosk stand ($300)</li>
                                                <li>• Built-in security ($100)</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <Alert className="mt-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-sm">
                                            Links to purchase stands: 
                                            <a href="https://www.amazon.com/s?k=tablet+kiosk+stand" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                                Amazon Tablet Stands
                                            </a>
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Quick Actions */}
                <Card className="mt-8 shadow-lg border-2 border-blue-200">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => window.open(kioskUrl, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Test Kiosk Page
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = createPageUrl('Settings')}>
                                <Settings className="w-4 h-4 mr-2" />
                                Customize Branding
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = createPageUrl('Giving')}>
                                <Home className="w-4 h-4 mr-2" />
                                View Donations
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}