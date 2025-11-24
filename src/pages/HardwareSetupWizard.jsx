import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
    Printer, Tablet, Monitor, Tv, Bluetooth, Usb, 
    CheckCircle, XCircle, AlertTriangle, ArrowRight, 
    ArrowLeft, Settings, Wifi, Smartphone, Package,
    Loader2, Play, RotateCw, Download, ExternalLink,
    Zap, Info, MessageSquare, Phone
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function HardwareSetupWizardPage() {
    const [selectedHardware, setSelectedHardware] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [connectionType, setConnectionType] = useState(null); // 'bluetooth' or 'usb'
    const [testResults, setTestResults] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    const hardwareCategories = [
        {
            id: 'thermal_printer',
            name: 'Bluetooth Receipt Printer',
            icon: Printer,
            description: 'For Kids Check-In tags, receipts, and labels',
            color: 'from-blue-500 to-indigo-600',
            features: ['Kids Check-In', 'Event Registration', 'Donation Receipts'],
            connectivity: ['bluetooth', 'usb'],
            estimatedTime: '10-15 minutes'
        },
        {
            id: 'kiosk_tablet',
            name: 'Kiosk Tablet (iPad/Android)',
            icon: Tablet,
            description: 'For Giving Kiosk or Coffee Shop ordering',
            color: 'from-green-500 to-emerald-600',
            features: ['Kiosk Giving', 'Coffee Shop Orders', 'Event Registration'],
            connectivity: ['wifi'],
            estimatedTime: '5-10 minutes'
        },
        {
            id: 'kitchen_display',
            name: 'Kitchen/Café Display',
            icon: Monitor,
            description: 'Tablet or monitor for kitchen order management',
            color: 'from-orange-500 to-amber-600',
            features: ['Coffee Shop Kitchen Display', 'Order Management'],
            connectivity: ['wifi', 'ethernet'],
            estimatedTime: '5-10 minutes'
        },
        {
            id: 'large_display',
            name: 'Large Display TV',
            icon: Tv,
            description: 'For announcements, sermons, and event info',
            color: 'from-purple-500 to-pink-600',
            features: ['Announcements', 'Event Info', 'Sermon Display'],
            connectivity: ['wifi', 'hdmi'],
            estimatedTime: '10-15 minutes'
        }
    ];

    const setupSteps = {
        thermal_printer: {
            bluetooth: [
                {
                    title: 'Unbox and Power On',
                    description: 'Remove printer from packaging and connect to power',
                    icon: Package,
                    instructions: [
                        'Remove printer from box and remove all protective materials',
                        'Load paper roll (thermal side facing up)',
                        'Connect power adapter to printer and plug into outlet',
                        'Press and hold power button for 2-3 seconds',
                        'Wait for printer to initialize (usually 5-10 seconds)',
                        'You should see a green LED light indicating power'
                    ],
                    tips: [
                        '💡 The thermal side of paper is usually shinier and feels smoother',
                        '⚠️ Some printers auto-power on when plugged in',
                        '📄 Test by closing the paper compartment - it should print a test receipt'
                    ],
                    video: null
                },
                {
                    title: 'Enable Bluetooth on Printer',
                    description: 'Activate Bluetooth pairing mode',
                    icon: Bluetooth,
                    instructions: [
                        'Locate the Bluetooth button on your printer (usually has a 🔵 icon)',
                        'Press and hold the Bluetooth button for 3-5 seconds',
                        'Watch for a flashing blue LED light (indicates pairing mode)',
                        'Some printers may beep to confirm pairing mode is active',
                        'Leave printer in this mode while you set up the tablet/computer'
                    ],
                    tips: [
                        '💡 Pairing mode usually lasts 60-120 seconds before timing out',
                        '⚠️ If it times out, just press the Bluetooth button again',
                        '📱 Make sure your tablet/computer Bluetooth is turned ON'
                    ],
                    troubleshooting: [
                        {
                            issue: 'No flashing blue light',
                            solution: 'Try holding button for 5+ seconds, or check if Bluetooth is already enabled in printer settings'
                        },
                        {
                            issue: 'Printer not responding',
                            solution: 'Power cycle printer (turn off, wait 10 seconds, turn on)'
                        }
                    ]
                },
                {
                    title: 'Connect from Your Device',
                    description: 'Pair printer with tablet or computer',
                    icon: Smartphone,
                    instructions: [
                        'On iPad: Settings → Bluetooth → Turn ON',
                        'On Android: Settings → Connected Devices → Bluetooth → Turn ON',
                        'On Windows: Settings → Bluetooth & Devices → Turn ON Bluetooth',
                        'Wait for printer to appear in "Available Devices" list',
                        'Printer name usually includes brand (e.g., "Zebra-1234" or "Star-5678")',
                        'Tap the printer name to connect',
                        'You may see "Pairing" or "Connecting..." message',
                        'Wait for status to change to "Connected"'
                    ],
                    tips: [
                        '💡 If you don\'t see the printer, tap "Scan" or "Search for devices"',
                        '⚠️ Some printers require a PIN code (usually 0000 or 1234)',
                        '📱 Keep devices within 10 feet during pairing'
                    ],
                    troubleshooting: [
                        {
                            issue: 'Printer not showing in list',
                            solution: 'Ensure printer is in pairing mode (flashing blue light). Try turning Bluetooth OFF then ON again on your device.'
                        },
                        {
                            issue: 'Pairing failed',
                            solution: 'Forget/Remove the printer from your device Bluetooth settings, then restart both devices and try again'
                        }
                    ]
                },
                {
                    title: 'Test Print',
                    description: 'Verify printer is working correctly',
                    icon: Play,
                    instructions: [
                        'Go to Kids Check-In page in REACH ChurchConnect',
                        'Click "Printer Setup" or "Test Print" button',
                        'Select your printer from the dropdown list',
                        'Click "Print Test Page"',
                        'You should see a test label print within 2-3 seconds',
                        'Verify that text is clear and QR code is scannable'
                    ],
                    tips: [
                        '💡 If text is too light, your paper may be loaded backwards',
                        '⚠️ If nothing prints, check printer is still connected in Bluetooth settings',
                        '📱 Test QR codes by scanning with your phone camera'
                    ]
                }
            ],
            usb: [
                {
                    title: 'Connect USB Cable',
                    description: 'Physical connection setup',
                    icon: Usb,
                    instructions: [
                        'Power on the printer',
                        'Locate USB port on back or side of printer',
                        'Connect USB Type-B cable to printer',
                        'Connect USB Type-A end to computer/tablet',
                        'Wait 10-15 seconds for device to recognize printer',
                        'You should hear a "device connected" sound (Windows/Mac)'
                    ],
                    tips: [
                        '💡 Use the USB cable that came with your printer if possible',
                        '⚠️ Some computers may require driver installation',
                        '📱 Not all tablets support USB printers - check compatibility first'
                    ]
                },
                {
                    title: 'Install Drivers (if needed)',
                    description: 'Install printer software',
                    icon: Download,
                    instructions: [
                        'Most modern printers are plug-and-play (no drivers needed)',
                        'If prompted, download drivers from manufacturer website',
                        'Common brands: Zebra, Star Micronics, Epson, Brother',
                        'Run the driver installer and follow on-screen instructions',
                        'Restart your computer after installation'
                    ],
                    tips: [
                        '💡 Google "[Printer Brand] [Model] driver download"',
                        '⚠️ Download only from official manufacturer websites',
                        '🔍 Check Device Manager (Windows) or System Preferences (Mac) to verify printer is recognized'
                    ]
                },
                {
                    title: 'Configure Printer',
                    description: 'Set up printer in REACH ChurchConnect',
                    icon: Settings,
                    instructions: [
                        'Open REACH ChurchConnect → Kids Check-In page',
                        'Click "Printer Setup"',
                        'Select your printer from the list of available printers',
                        'Set paper size (usually 4" x 6" or 2.25" x 1.25" for labels)',
                        'Click "Save Settings"'
                    ]
                },
                {
                    title: 'Test Print',
                    description: 'Verify printer is working',
                    icon: Play,
                    instructions: [
                        'Click "Print Test Page" button',
                        'Verify test label prints clearly',
                        'Check QR code is scannable',
                        'Adjust print darkness if needed in printer settings'
                    ]
                }
            ]
        },
        kiosk_tablet: {
            wifi: [
                {
                    title: 'Unbox and Power On',
                    description: 'Initial tablet setup',
                    icon: Package,
                    instructions: [
                        'Remove tablet from packaging',
                        'Charge tablet to at least 50% (recommended)',
                        'Power on tablet by holding power button',
                        'Complete initial setup wizard (language, WiFi, account)',
                        'Update to latest OS version (Settings → System Update)'
                    ],
                    tips: [
                        '💡 iPad: You\'ll need an Apple ID for initial setup',
                        '💡 Android: You can skip Google account for kiosk mode',
                        '⚠️ Keep charging cable and power adapter handy'
                    ]
                },
                {
                    title: 'Connect to WiFi',
                    description: 'Network setup',
                    icon: Wifi,
                    instructions: [
                        'Open Settings → WiFi',
                        'Select your church WiFi network',
                        'Enter WiFi password',
                        'Wait for "Connected" status',
                        'Test internet by opening a web browser'
                    ],
                    tips: [
                        '💡 Use a strong, stable WiFi network near your kiosk location',
                        '⚠️ Avoid public guest networks - use secure church network',
                        '📡 Signal strength should be at least 3/4 bars for best performance'
                    ]
                },
                {
                    title: 'Open Kiosk Page',
                    description: 'Navigate to your kiosk URL',
                    icon: ExternalLink,
                    instructions: [
                        'Open Safari (iPad) or Chrome (Android) browser',
                        'Go to your REACH ChurchConnect dashboard',
                        'Navigate to Settings → Kiosk Setup',
                        'Copy the Kiosk URL or scan the QR code',
                        'Paste URL in browser or tap the QR code link',
                        'Bookmark the page for easy access'
                    ],
                    tips: [
                        '💡 The kiosk URL looks like: yourchurch.reach.app/kiosk-giving',
                        '⚠️ Make sure you\'re using the KIOSK url, not the admin dashboard',
                        '📱 Test the page loads correctly before enabling kiosk mode'
                    ]
                },
                {
                    title: 'Enable Kiosk Mode',
                    description: 'Lock tablet to single app',
                    icon: Settings,
                    instructions: [
                        '📱 iPad: Enable Guided Access (Settings → Accessibility → Guided Access)',
                        '📱 Android: Enable Screen Pinning (Settings → Security → Screen Pinning)',
                        'Open your kiosk page in the browser',
                        'Activate kiosk mode (Triple-click side button on iPad, Recent Apps → Pin on Android)',
                        'Tablet is now locked to kiosk page only'
                    ],
                    tips: [
                        '💡 Set a PIN to exit kiosk mode so staff can manage it',
                        '⚠️ Test exiting and re-entering kiosk mode before deploying',
                        '🔒 This prevents users from accessing other apps or settings'
                    ]
                },
                {
                    title: 'Mount and Secure',
                    description: 'Physical installation',
                    icon: Tablet,
                    instructions: [
                        'Place tablet in secure stand or wall mount',
                        'Position at comfortable height (42-48 inches from floor)',
                        'Ensure charging cable is connected and secure',
                        'Add signage: "Give Here" or "Place Your Order"',
                        'Test that tablet is stable and screen is visible'
                    ],
                    tips: [
                        '💡 Place near entrance/exit for giving kiosks',
                        '💡 Place at counter for coffee shop ordering',
                        '⚠️ Use anti-theft cable lock for added security',
                        '🔌 Hide cables to prevent tripping hazards'
                    ]
                },
                {
                    title: 'Test Complete Flow',
                    description: 'End-to-end testing',
                    icon: Play,
                    instructions: [
                        'Test making a $1 donation (for giving kiosk)',
                        'Or test placing a coffee order (for coffee shop kiosk)',
                        'Verify payment processes correctly',
                        'Check that receipt prints or confirmation shows',
                        'Ensure kiosk returns to home screen after transaction',
                        'Test with multiple payment methods if supported'
                    ]
                }
            ]
        },
        kitchen_display: {
            wifi: [
                {
                    title: 'Choose Your Display Device',
                    description: 'Select appropriate hardware',
                    icon: Monitor,
                    instructions: [
                        'Option A: Android Tablet (10-12 inch recommended)',
                        'Option B: iPad (10-12 inch recommended)',
                        'Option C: Computer monitor + small computer/Raspberry Pi',
                        'Ensure device has WiFi capability',
                        'Mount or place in kitchen line-of-sight area'
                    ],
                    tips: [
                        '💡 Tablets are easiest - no additional hardware needed',
                        '💡 Larger screens (12"+) are better for busy kitchens',
                        '⚠️ Ensure device can stay on 24/7 without overheating'
                    ]
                },
                {
                    title: 'Connect to Network',
                    description: 'Setup WiFi connection',
                    icon: Wifi,
                    instructions: [
                        'Power on device',
                        'Open Settings → WiFi',
                        'Connect to your church network',
                        'Verify internet connectivity',
                        'Test by loading a web page'
                    ]
                },
                {
                    title: 'Open Kitchen Display URL',
                    description: 'Load the kitchen display page',
                    icon: ExternalLink,
                    instructions: [
                        'Open browser (Chrome recommended)',
                        'Go to your REACH ChurchConnect dashboard',
                        'Navigate to Coffee Shop → Kitchen Display',
                        'Copy the Kitchen Display URL',
                        'Open URL in browser on display device',
                        'You should see the order management screen'
                    ],
                    tips: [
                        '💡 Bookmark the URL for easy access',
                        '⚠️ This is a different URL than the customer ordering kiosk',
                        '🔄 Page auto-refreshes every 10 seconds to show new orders'
                    ]
                },
                {
                    title: 'Enable Full Screen',
                    description: 'Optimize display view',
                    icon: Tv,
                    instructions: [
                        'Press F11 (Windows/Android) or ⌘+Ctrl+F (Mac) for full screen',
                        'Or use browser menu → Full Screen',
                        'Hide browser toolbars and address bar',
                        'Adjust zoom level if needed (Ctrl + or Ctrl -)',
                        'Set display to never sleep: Settings → Display → Screen Timeout → Never'
                    ]
                },
                {
                    title: 'Configure Display Settings',
                    description: 'Optimize for kitchen environment',
                    icon: Settings,
                    instructions: [
                        'Increase screen brightness to 100% (kitchens are bright!)',
                        'Enable "Stay Awake" mode',
                        'Disable screen rotation/lock orientation',
                        'Turn off notifications and pop-ups',
                        'Test visibility from different angles in kitchen'
                    ]
                },
                {
                    title: 'Test with Real Orders',
                    description: 'Verify order flow',
                    icon: Play,
                    instructions: [
                        'Place a test order from the customer kiosk',
                        'Verify order appears on kitchen display within 2-3 seconds',
                        'Test marking order as "Preparing"',
                        'Test marking order as "Ready"',
                        'Verify notifications work (if enabled)',
                        'Test with multiple orders to ensure sorting works'
                    ]
                }
            ]
        },
        large_display: {
            wifi: [
                {
                    title: 'TV and Streaming Device Setup',
                    description: 'Initial hardware setup',
                    icon: Tv,
                    instructions: [
                        'Mount or place TV in desired location',
                        'Connect power cable',
                        'Option A: Use Smart TV built-in browser',
                        'Option B: Connect streaming stick (Chromecast, Fire Stick, Roku)',
                        'Option C: Connect laptop/computer via HDMI',
                        'Power on TV and select correct HDMI input'
                    ],
                    tips: [
                        '💡 Smart TVs with web browsers are easiest',
                        '💡 Chromecast/Fire Stick cost $30-50 and work great',
                        '⚠️ Ensure streaming device has WiFi connectivity'
                    ]
                },
                {
                    title: 'Connect to WiFi',
                    description: 'Network configuration',
                    icon: Wifi,
                    instructions: [
                        'Access device settings using TV remote',
                        'Navigate to Network or WiFi settings',
                        'Select your church WiFi network',
                        'Enter WiFi password using on-screen keyboard',
                        'Wait for "Connected" confirmation',
                        'Test by opening a web browser or app'
                    ]
                },
                {
                    title: 'Open Display Page',
                    description: 'Load your content',
                    icon: ExternalLink,
                    instructions: [
                        'Open web browser on TV (or connected device)',
                        'Navigate to your REACH ChurchConnect dashboard',
                        'Go to Communications → Announcements → Display View',
                        'Or go to Sermons → Display View',
                        'Bookmark the URL for easy access',
                        'Content will auto-rotate/update'
                    ],
                    tips: [
                        '💡 You can display announcements, sermons, event info, or custom slides',
                        '⚠️ Content updates every 30 seconds automatically',
                        '🎨 Customize colors and branding in Settings'
                    ]
                },
                {
                    title: 'Configure Display Settings',
                    description: 'Optimize appearance',
                    icon: Settings,
                    instructions: [
                        'Set browser to full screen mode',
                        'Adjust TV picture settings: Brightness, Contrast, Color',
                        'Set TV to never sleep/turn off',
                        'Disable TV screensaver',
                        'Set correct aspect ratio (usually 16:9)',
                        'Test from various viewing distances'
                    ]
                },
                {
                    title: 'Content Management',
                    description: 'Add and schedule content',
                    icon: Play,
                    instructions: [
                        'From your admin dashboard, go to Communications',
                        'Create announcements with images/text',
                        'Schedule when content should display',
                        'Set transition effects and timing',
                        'Preview before publishing',
                        'Content appears on display automatically'
                    ]
                },
                {
                    title: 'Test and Verify',
                    description: 'Final checks',
                    icon: CheckCircle,
                    instructions: [
                        'Verify content is readable from back of room',
                        'Check that images display correctly',
                        'Ensure text is large enough',
                        'Test scheduled content changes',
                        'Verify auto-refresh works (add new announcement and watch it appear)',
                        'Document TV input settings for future reference'
                    ]
                }
            ]
        }
    };

    const selectedCategory = hardwareCategories.find(h => h.id === selectedHardware);
    const steps = selectedCategory && connectionType ? setupSteps[selectedHardware]?.[connectionType] : [];
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleReset = () => {
        setSelectedHardware(null);
        setConnectionType(null);
        setCurrentStep(0);
        setTestResults(null);
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        // Simulate testing
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTestResults({
            success: true,
            message: 'Connection successful! Your device is ready to use.',
            details: 'All tests passed.'
        });
        setIsTesting(false);
    };

    if (!selectedHardware) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">Hardware Setup Wizard</h1>
                        <p className="text-lg text-slate-600">
                            Interactive step-by-step guides for setting up your church hardware
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hardwareCategories.map((hardware) => {
                            const Icon = hardware.icon;
                            return (
                                <Card 
                                    key={hardware.id}
                                    className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500"
                                    onClick={() => setSelectedHardware(hardware.id)}
                                >
                                    <CardHeader>
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${hardware.color} flex items-center justify-center mb-4 shadow-lg`}>
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>
                                        <CardTitle className="text-2xl">{hardware.name}</CardTitle>
                                        <CardDescription className="text-base">
                                            {hardware.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 mb-2">Features:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {hardware.features.map(feature => (
                                                    <Badge key={feature} variant="outline" className="text-xs">
                                                        {feature}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 mb-2">Connectivity:</p>
                                            <div className="flex gap-2">
                                                {hardware.connectivity.map(conn => (
                                                    <Badge key={conn} className="bg-blue-100 text-blue-800">
                                                        {conn === 'bluetooth' && <Bluetooth className="w-3 h-3 mr-1" />}
                                                        {conn === 'usb' && <Usb className="w-3 h-3 mr-1" />}
                                                        {conn === 'wifi' && <Wifi className="w-3 h-3 mr-1" />}
                                                        {conn.toUpperCase()}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Setup time: {hardware.estimatedTime}</span>
                                        </div>

                                        <Button className="w-full mt-4">
                                            Start Setup Guide
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Quick Help */}
                    <Card className="mt-8 bg-blue-50 border-2 border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                <Info className="w-5 h-5" />
                                Need Help?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-3">
                                <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-900">Live Chat Support</p>
                                    <p className="text-sm text-blue-700">Available Mon-Fri 9am-5pm EST</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-900">Phone Support</p>
                                    <p className="text-sm text-blue-700">Call 1-800-REACH-US for assistance</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-900">Video Tutorials</p>
                                    <p className="text-sm text-blue-700">Watch step-by-step video guides on our YouTube channel</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!connectionType) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
                <div className="max-w-4xl mx-auto">
                    <Button onClick={handleReset} variant="outline" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Hardware Selection
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl">
                                Choose Connection Type for {selectedCategory.name}
                            </CardTitle>
                            <CardDescription className="text-base">
                                Select how you'll connect this device
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                {selectedCategory.connectivity.map(conn => (
                                    <Card 
                                        key={conn}
                                        className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500"
                                        onClick={() => setConnectionType(conn)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                                    {conn === 'bluetooth' && <Bluetooth className="w-8 h-8 text-blue-600" />}
                                                    {conn === 'usb' && <Usb className="w-8 h-8 text-blue-600" />}
                                                    {conn === 'wifi' && <Wifi className="w-8 h-8 text-blue-600" />}
                                                    {conn === 'hdmi' && <Monitor className="w-8 h-8 text-blue-600" />}
                                                    {conn === 'ethernet' && <Wifi className="w-8 h-8 text-blue-600" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold capitalize">{conn}</h3>
                                                    <p className="text-slate-600">
                                                        {conn === 'bluetooth' && 'Wireless connection via Bluetooth - Best for mobility'}
                                                        {conn === 'usb' && 'Wired connection via USB cable - Most reliable'}
                                                        {conn === 'wifi' && 'Wireless internet connection - Easy setup'}
                                                        {conn === 'hdmi' && 'Video cable connection to TV/Monitor'}
                                                        {conn === 'ethernet' && 'Wired network connection - Fastest and most stable'}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-6 h-6 text-slate-400" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const currentStepData = steps[currentStep];
    const StepIcon = currentStepData?.icon || Settings;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button onClick={handleReset} variant="outline" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Start Over
                    </Button>

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                {selectedCategory.name} Setup
                            </h1>
                            <p className="text-slate-600 capitalize">
                                {connectionType} Connection
                            </p>
                        </div>
                        <Badge className="text-lg px-4 py-2">
                            Step {currentStep + 1} of {totalSteps}
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <Progress value={progress} className="h-3" />
                        <p className="text-sm text-slate-600 text-center">
                            {Math.round(progress)}% Complete
                        </p>
                    </div>
                </div>

                {/* Current Step Content */}
                <Card className="shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                                <StepIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
                                <CardDescription className="text-base">
                                    {currentStepData.description}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {/* Instructions */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-blue-600" />
                                Step-by-Step Instructions:
                            </h3>
                            <ol className="space-y-3">
                                {currentStepData.instructions.map((instruction, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-blue-600 font-bold text-sm">{idx + 1}</span>
                                        </div>
                                        <p className="text-slate-700 leading-relaxed pt-1">{instruction}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Tips */}
                        {currentStepData.tips && currentStepData.tips.length > 0 && (
                            <Alert className="bg-yellow-50 border-yellow-200">
                                <Info className="w-5 h-5 text-yellow-600" />
                                <AlertDescription>
                                    <p className="font-semibold text-yellow-900 mb-2">💡 Helpful Tips:</p>
                                    <ul className="space-y-1 text-sm text-yellow-800">
                                        {currentStepData.tips.map((tip, idx) => (
                                            <li key={idx}>{tip}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Troubleshooting */}
                        {currentStepData.troubleshooting && currentStepData.troubleshooting.length > 0 && (
                            <details className="border border-red-200 rounded-lg p-4 bg-red-50">
                                <summary className="cursor-pointer font-bold text-red-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Troubleshooting Common Issues
                                </summary>
                                <div className="mt-4 space-y-3">
                                    {currentStepData.troubleshooting.map((item, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded border border-red-200">
                                            <p className="font-semibold text-red-900 mb-1">
                                                ❌ {item.issue}
                                            </p>
                                            <p className="text-sm text-red-700">
                                                ✅ {item.solution}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}

                        {/* Test Button for Last Step */}
                        {currentStep === totalSteps - 1 && (
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-3">Test Your Setup</h3>
                                <Button 
                                    onClick={handleTestConnection}
                                    disabled={isTesting}
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Testing Connection...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Run Connection Test
                                        </>
                                    )}
                                </Button>

                                {testResults && (
                                    <Alert className={`mt-4 ${testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        {testResults.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                        <AlertDescription>
                                            <p className={`font-semibold ${testResults.success ? 'text-green-900' : 'text-red-900'}`}>
                                                {testResults.message}
                                            </p>
                                            <p className={`text-sm mt-1 ${testResults.success ? 'text-green-700' : 'text-red-700'}`}>
                                                {testResults.details}
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-6 border-t">
                            <Button
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                variant="outline"
                                size="lg"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Previous Step
                            </Button>

                            {currentStep < totalSteps - 1 ? (
                                <Button onClick={handleNext} size="lg" className="bg-blue-600 hover:bg-blue-700">
                                    Next Step
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            ) : (
                                <Button onClick={handleReset} size="lg" className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Setup Complete!
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Support Card */}
                <Card className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-purple-900 mb-1">Need Assistance?</h3>
                                <p className="text-purple-700 text-sm mb-3">
                                    Our support team is here to help you with your hardware setup!
                                </p>
                                <div className="flex gap-3">
                                    <Button variant="outline" size="sm" className="border-purple-300">
                                        <Phone className="w-4 h-4 mr-2" />
                                        Call Support
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-purple-300">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Live Chat
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}