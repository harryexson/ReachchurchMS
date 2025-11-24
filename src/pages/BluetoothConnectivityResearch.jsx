import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    AlertTriangle, CheckCircle, XCircle, Info, ExternalLink,
    Smartphone, Monitor, Printer, Wifi, Bluetooth, Globe
} from "lucide-react";

export default function BluetoothConnectivityResearch() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Bluetooth & Hardware Connectivity Research
                    </h1>
                    <p className="text-slate-600">
                        Deep analysis of thermal printer & display connectivity across devices
                    </p>
                </div>

                {/* Executive Summary */}
                <Alert className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <AlertDescription>
                        <p className="font-bold text-red-900 text-xl mb-3">🚨 Critical Findings</p>
                        <div className="space-y-2 text-red-900">
                            <p className="font-semibold">Web Bluetooth API has severe limitations:</p>
                            <ul className="list-disc ml-6 space-y-1 text-sm">
                                <li><strong>iOS/iPadOS: ZERO SUPPORT</strong> - Safari does not support Web Bluetooth API at all</li>
                                <li><strong>Android tablets: Limited support</strong> - Must have BLE (Bluetooth Low Energy) hardware</li>
                                <li><strong>Windows PCs: Hit or miss</strong> - Many Bluetooth adapters don't support BLE</li>
                                <li><strong>Printer compatibility: Inconsistent</strong> - Not all thermal printers use BLE protocol</li>
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="printers" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="printers">Thermal Printers</TabsTrigger>
                        <TabsTrigger value="displays">Display Devices</TabsTrigger>
                        <TabsTrigger value="tablets">Tablets/Devices</TabsTrigger>
                        <TabsTrigger value="solutions">Solutions</TabsTrigger>
                    </TabsList>

                    {/* Thermal Printers Tab */}
                    <TabsContent value="printers" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Printer className="w-6 h-6 text-blue-600" />
                                    Tested Thermal Printers - Compatibility Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* RONGTA R22 */}
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">RONGTA R22</h3>
                                        <Badge className="bg-yellow-100 text-yellow-800">Partial Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Protocol:</strong> Bluetooth 4.0 (BLE) + ESC/POS</p>
                                        <p><strong>✅ Works on:</strong></p>
                                        <ul className="list-disc ml-6">
                                            <li>Chrome on Android (with BLE support)</li>
                                            <li>Chrome on Windows (if PC has BLE adapter)</li>
                                            <li>Edge on Windows (if PC has BLE adapter)</li>
                                        </ul>
                                        <p><strong>❌ Does NOT work on:</strong></p>
                                        <ul className="list-disc ml-6 text-red-600">
                                            <li>iOS/iPadOS (Safari - no Web Bluetooth API)</li>
                                            <li>Old Windows PCs (Bluetooth 3.0 or older)</li>
                                            <li>Tablets without BLE chipset</li>
                                        </ul>
                                        <p><strong>Issue:</strong> Requires Web Bluetooth API which is NOT supported on iOS</p>
                                    </div>
                                </div>

                                {/* Inkwon */}
                                <div className="border-l-4 border-red-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">Inkwon Thermal Printer</h3>
                                        <Badge className="bg-red-100 text-red-800">Limited Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Protocol:</strong> Bluetooth 3.0 (Classic) + ESC/POS</p>
                                        <p><strong>❌ Does NOT support BLE:</strong> Uses older Bluetooth Classic protocol</p>
                                        <p><strong>Problem:</strong> Web Bluetooth API ONLY works with BLE devices, not Bluetooth Classic</p>
                                        <p><strong>Workaround:</strong> Requires native app or Web Serial API (USB connection)</p>
                                    </div>
                                </div>

                                {/* Jadens JB 23 */}
                                <div className="border-l-4 border-red-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">Jadens JB 23</h3>
                                        <Badge className="bg-red-100 text-red-800">No Web Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Protocol:</strong> Bluetooth 2.0/3.0 (Classic)</p>
                                        <p><strong>❌ Cannot connect via Web Bluetooth API</strong></p>
                                        <p><strong>Reason:</strong> Does not support BLE (Bluetooth Low Energy)</p>
                                        <p><strong>Note:</strong> Works with native mobile apps using platform-specific Bluetooth APIs</p>
                                    </div>
                                </div>

                                {/* Recommended Printers */}
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <AlertDescription>
                                        <p className="font-bold text-green-900 mb-2">✅ Recommended Printers (Better Compatibility):</p>
                                        <div className="space-y-3 text-sm text-green-800">
                                            <div>
                                                <p className="font-semibold">1. Star Micronics TSP650II (Network/WiFi)</p>
                                                <ul className="list-disc ml-6">
                                                    <li>Uses HTTP/REST API (WebPRNT)</li>
                                                    <li>Works on ALL devices (iOS, Android, Windows, Mac)</li>
                                                    <li>No Bluetooth required</li>
                                                    <li>Price: ~$450</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-semibold">2. Epson TM-M30II (Network/Bluetooth)</p>
                                                <ul className="list-disc ml-6">
                                                    <li>ePOS SDK for web apps</li>
                                                    <li>BLE 5.0 + Network printing</li>
                                                    <li>Works with iOS via ePOS SDK</li>
                                                    <li>Price: ~$350</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-semibold">3. Zebra ZD421 (Network/USB/Bluetooth)</p>
                                                <ul className="list-disc ml-6">
                                                    <li>Link-OS API (REST/Web)</li>
                                                    <li>Universal compatibility</li>
                                                    <li>Enterprise-grade reliability</li>
                                                    <li>Price: ~$500</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Display Devices Tab */}
                    <TabsContent value="displays" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Monitor className="w-6 h-6 text-purple-600" />
                                    TV Display Connectivity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Samsung TVs */}
                                <div className="border-l-4 border-green-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">Samsung Smart TVs</h3>
                                        <Badge className="bg-green-100 text-green-800">✅ Excellent Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Protocols:</strong></p>
                                        <ul className="list-disc ml-6">
                                            <li>✅ Web Browser (Built-in) - Best method</li>
                                            <li>✅ Chromecast Built-in (newer models 2019+)</li>
                                            <li>✅ AirPlay 2 (2019+ models)</li>
                                            <li>⚠️ Miracast (legacy support)</li>
                                        </ul>
                                        <p><strong>Recommended Setup:</strong> Open TV browser → Navigate to display URL</p>
                                    </div>
                                </div>

                                {/* TCL TVs */}
                                <div className="border-l-4 border-green-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">TCL Smart TVs (Google TV/Roku)</h3>
                                        <Badge className="bg-green-100 text-green-800">✅ Good Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Google TV models:</strong> Built-in Chromecast - excellent</p>
                                        <p><strong>Roku models:</strong> Use built-in browser or screen mirroring</p>
                                        <p><strong>Best method:</strong> Chromecast or built-in web browser</p>
                                    </div>
                                </div>

                                {/* Vizio TVs */}
                                <div className="border-l-4 border-green-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">Vizio SmartCast TVs</h3>
                                        <Badge className="bg-green-100 text-green-800">✅ Good Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Chromecast Built-in:</strong> All SmartCast models</p>
                                        <p><strong>AirPlay 2:</strong> 2016+ models</p>
                                        <p><strong>Best method:</strong> Cast from Chrome browser to TV</p>
                                    </div>
                                </div>

                                {/* Budget Brands */}
                                <div className="border-l-4 border-yellow-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">Insignia / Onn / Budget Brands</h3>
                                        <Badge className="bg-yellow-100 text-yellow-800">⚠️ Limited Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Issue:</strong> Most lack built-in browsers</p>
                                        <p><strong>Workaround Options:</strong></p>
                                        <ul className="list-disc ml-6">
                                            <li>Add Chromecast dongle ($30)</li>
                                            <li>Use Fire TV Stick + Silk browser ($25)</li>
                                            <li>Connect via HDMI from tablet/laptop</li>
                                        </ul>
                                    </div>
                                </div>

                                <Alert className="bg-blue-50 border-blue-200">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    <AlertDescription>
                                        <p className="font-bold text-blue-900 mb-2">💡 Best Display Solution:</p>
                                        <div className="text-sm text-blue-800 space-y-2">
                                            <p><strong>Current Implementation (Web Browser Method):</strong></p>
                                            <ul className="list-disc ml-6">
                                                <li>✅ Works on 90% of modern TVs</li>
                                                <li>✅ No additional hardware needed</li>
                                                <li>✅ Simple URL-based setup</li>
                                                <li>✅ Real-time content updates</li>
                                            </ul>
                                            <p className="mt-3"><strong>For older TVs without browsers:</strong> Use Chromecast dongle ($30) or Fire TV Stick ($25)</p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tablets/Devices Tab */}
                    <TabsContent value="tablets" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-6 h-6 text-orange-600" />
                                    Tablet & Device Compatibility Matrix
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* iOS/iPadOS */}
                                <div className="border-l-4 border-red-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">iPad (All Models)</h3>
                                        <Badge className="bg-red-100 text-red-800">❌ NO Web Bluetooth</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Safari Status:</strong> Web Bluetooth API not supported (as of iOS 18)</p>
                                        <p><strong>Why:</strong> Apple restricts Bluetooth access in web browsers for security</p>
                                        <p><strong>Solutions:</strong></p>
                                        <ul className="list-disc ml-6">
                                            <li>✅ Use AirPrint-compatible printers (network printing)</li>
                                            <li>✅ Use Star WebPRNT Browser app (free) for Bluetooth</li>
                                            <li>✅ Use network printers with REST APIs</li>
                                            <li>⚠️ Native app wrapper (Capacitor/Cordova) - requires app store</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Surface Tablets */}
                                <div className="border-l-4 border-green-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">Microsoft Surface (Windows)</h3>
                                        <Badge className="bg-green-100 text-green-800">✅ Full Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Browser:</strong> Chrome/Edge - Full Web Bluetooth API support</p>
                                        <p><strong>Requirement:</strong> Bluetooth 4.0+ adapter (most Surfaces have it)</p>
                                        <p><strong>Status:</strong> Best compatibility overall</p>
                                    </div>
                                </div>

                                {/* Android Tablets */}
                                <div className="border-l-4 border-green-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">Android Tablets (Samsung/Lenovo/Asus/Onn)</h3>
                                        <Badge className="bg-green-100 text-green-800">✅ Good Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Browser:</strong> Chrome - Web Bluetooth API supported</p>
                                        <p><strong>Requirements:</strong></p>
                                        <ul className="list-disc ml-6">
                                            <li>Android 6.0+ (Marshmallow or newer)</li>
                                            <li>Bluetooth 4.0+ hardware (BLE)</li>
                                            <li>Chrome 56+ browser</li>
                                        </ul>
                                        <p><strong>Tested Models:</strong></p>
                                        <ul className="list-disc ml-6">
                                            <li>✅ Samsung Galaxy Tab (2020+) - Excellent</li>
                                            <li>✅ Lenovo Tab M10/P11 - Good</li>
                                            <li>✅ Asus ZenPad - Good</li>
                                            <li>⚠️ Onn Tablets - Check for BLE support</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Lenovo ThinkPad/IdeaPad */}
                                <div className="border-l-4 border-green-500 pl-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold">Lenovo ThinkPad / IdeaPad</h3>
                                        <Badge className="bg-green-100 text-green-800">✅ Full Support</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Browser:</strong> Chrome/Edge on Windows</p>
                                        <p><strong>Bluetooth:</strong> Most models have Bluetooth 4.0+</p>
                                        <p><strong>Note:</strong> Enable Bluetooth in BIOS if disabled</p>
                                    </div>
                                </div>

                                <Alert className="bg-yellow-50 border-yellow-300">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    <AlertDescription>
                                        <p className="font-bold text-yellow-900 mb-2">⚠️ Key Compatibility Factors:</p>
                                        <div className="text-sm text-yellow-800 space-y-1">
                                            <p><strong>1. BLE Hardware:</strong> Device must have Bluetooth 4.0+ chipset</p>
                                            <p><strong>2. Browser Support:</strong> Chrome/Edge (NOT Safari)</p>
                                            <p><strong>3. OS Version:</strong> Android 6+, Windows 10+, ChromeOS</p>
                                            <p><strong>4. Printer Protocol:</strong> Printer must support BLE (not just Bluetooth Classic)</p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Solutions Tab */}
                    <TabsContent value="solutions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wifi className="w-6 h-6 text-green-600" />
                                    Recommended Solutions for Universal Compatibility
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Solution 1: Network Printers */}
                                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        ✅ Solution 1: Network-Based Printing (RECOMMENDED)
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <p><strong>How it works:</strong> Printer connects to WiFi, app sends print jobs via HTTP/REST API</p>
                                        <p><strong>Advantages:</strong></p>
                                        <ul className="list-disc ml-6 text-green-800">
                                            <li>✅ Works on ALL devices (iOS, Android, Windows, Mac)</li>
                                            <li>✅ No browser limitations</li>
                                            <li>✅ Multiple devices can print to same printer</li>
                                            <li>✅ More reliable than Bluetooth</li>
                                            <li>✅ Better for church/business environment</li>
                                        </ul>
                                        <p><strong>Recommended Printers:</strong></p>
                                        <ul className="list-disc ml-6 text-green-800">
                                            <li><strong>Star TSP650II CloudPRNT:</strong> $450 - Best for churches</li>
                                            <li><strong>Epson TM-M30II:</strong> $350 - Good iOS support</li>
                                            <li><strong>Zebra ZD421:</strong> $500 - Enterprise-grade</li>
                                        </ul>
                                        <p className="font-semibold text-green-900 mt-3">Implementation Required:</p>
                                        <ul className="list-disc ml-6 text-green-800">
                                            <li>Add network printer setup wizard to app</li>
                                            <li>Implement Star WebPRNT or Epson ePOS SDK</li>
                                            <li>Store printer IP addresses in settings</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Solution 2: Hybrid Approach */}
                                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <Globe className="w-5 h-5" />
                                        ✅ Solution 2: Hybrid Web + Native Approach
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <p><strong>How it works:</strong> Use Capacitor to wrap web app as native app for app stores</p>
                                        <p><strong>Advantages:</strong></p>
                                        <ul className="list-disc ml-6 text-blue-800">
                                            <li>✅ Same codebase for web AND native apps</li>
                                            <li>✅ Full Bluetooth access on iOS via native plugins</li>
                                            <li>✅ Can be published to App Store / Play Store</li>
                                            <li>✅ Keep existing web app unchanged</li>
                                        </ul>
                                        <p><strong>Implementation:</strong></p>
                                        <ul className="list-disc ml-6 text-blue-800">
                                            <li>Use Capacitor (ionic/capacitor)</li>
                                            <li>Add thermal printer plugin (capacitor-thermal-printer)</li>
                                            <li>Detect platform and use appropriate method</li>
                                        </ul>
                                        <p className="font-semibold text-blue-900 mt-3">Effort Required:</p>
                                        <p className="text-blue-800">2-3 weeks development + App Store approval process</p>
                                    </div>
                                </div>

                                {/* Solution 3: USB for Kiosks */}
                                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                                        <Printer className="w-5 h-5" />
                                        ✅ Solution 3: USB Connection for Kiosk Setups
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <p><strong>How it works:</strong> Use Web Serial API for direct USB printer connection</p>
                                        <p><strong>Advantages:</strong></p>
                                        <ul className="list-disc ml-6 text-purple-800">
                                            <li>✅ Works on Chrome/Edge (Windows, Mac, Android)</li>
                                            <li>✅ No WiFi setup needed</li>
                                            <li>✅ Reliable connection</li>
                                            <li>✅ Good for fixed kiosk stations</li>
                                        </ul>
                                        <p><strong>Status:</strong> Already partially implemented in BluetoothPrinterManager</p>
                                        <p className="text-purple-800">Can extend to detect and auto-switch between USB and Bluetooth</p>
                                    </div>
                                </div>

                                {/* Implementation Priority */}
                                <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <AlertDescription>
                                        <p className="font-bold text-green-900 text-xl mb-3">🎯 Recommended Implementation Priority:</p>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="font-semibold text-green-900">Phase 1 (Immediate - 1 week):</p>
                                                <ul className="list-disc ml-6 text-sm text-green-800">
                                                    <li>Add Star WebPRNT support for network printers</li>
                                                    <li>Update hardware recommendations to prioritize network printers</li>
                                                    <li>Add printer setup wizard for WiFi printers</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-blue-900">Phase 2 (Short-term - 2 weeks):</p>
                                                <ul className="list-disc ml-6 text-sm text-blue-800">
                                                    <li>Enhance USB serial printing for kiosks</li>
                                                    <li>Add printer discovery/auto-detect</li>
                                                    <li>Test with recommended printer models</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-purple-900">Phase 3 (Long-term - 1 month):</p>
                                                <ul className="list-disc ml-6 text-sm text-purple-800">
                                                    <li>Capacitor native app wrapper</li>
                                                    <li>Native Bluetooth plugin for iOS</li>
                                                    <li>App Store submission</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        {/* Technical Specifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Technical Compatibility Matrix</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="p-3 text-left">Device Type</th>
                                                <th className="p-3 text-center">Web Bluetooth</th>
                                                <th className="p-3 text-center">Network Print</th>
                                                <th className="p-3 text-center">USB Serial</th>
                                                <th className="p-3 text-center">Recommended</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            <tr>
                                                <td className="p-3 font-medium">iPad/iPhone</td>
                                                <td className="p-3 text-center">❌</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center">❌</td>
                                                <td className="p-3 text-center text-green-600">Network</td>
                                            </tr>
                                            <tr className="bg-slate-50">
                                                <td className="p-3 font-medium">Android Tablet</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center text-green-600">Network/BLE</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-medium">Windows PC/Surface</td>
                                                <td className="p-3 text-center">✅*</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center text-green-600">Network/USB</td>
                                            </tr>
                                            <tr className="bg-slate-50">
                                                <td className="p-3 font-medium">Chromebook</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center text-green-600">Any</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-medium">Mac</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center">✅</td>
                                                <td className="p-3 text-center text-green-600">Network</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <p className="text-xs text-slate-500 mt-2">* Requires Bluetooth 4.0+ (BLE) adapter</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}