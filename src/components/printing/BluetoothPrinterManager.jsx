import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
    Bluetooth, CheckCircle, AlertTriangle, Loader2, 
    Printer, RefreshCw, Zap 
} from "lucide-react";

/**
 * Bluetooth Printer Manager for RONGTA R22 and similar ESC/POS thermal printers
 * Uses Web Bluetooth API for direct printer communication
 */
export default function BluetoothPrinterManager({ onPrinterConnected }) {
    const [isSupported, setIsSupported] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState(null);
    const [printerCharacteristic, setPrinterCharacteristic] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [errorMessage, setErrorMessage] = useState('');
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        // Check if Web Bluetooth is supported
        if (navigator.bluetooth) {
            setIsSupported(true);
        } else {
            setIsSupported(false);
        }

        // Try to reconnect to previously connected device
        const savedDeviceId = localStorage.getItem('bluetooth_printer_id');
        if (savedDeviceId && navigator.bluetooth) {
            // Note: Auto-reconnection requires user gesture in most browsers
            console.log('Previously connected printer:', savedDeviceId);
        }
    }, []);

    const connectToPrinter = async () => {
        if (!navigator.bluetooth) {
            setErrorMessage('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
            return;
        }

        setIsConnecting(true);
        setErrorMessage('');
        setConnectionStatus('connecting');

        try {
            console.log('Requesting Bluetooth Device...');
            
            // Request device with printer service
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common thermal printer service
                    { namePrefix: 'RONGTA' },
                    { namePrefix: 'R22' },
                    { namePrefix: 'BlueTooth Printer' },
                    { namePrefix: 'Printer' }
                ],
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb', // Thermal printer service
                    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Alternative service UUID
                    '0000ff00-0000-1000-8000-00805f9b34fb'  // Generic service
                ]
            });

            console.log('Device selected:', device.name);
            setConnectedDevice(device);

            // Connect to GATT Server
            console.log('Connecting to GATT Server...');
            const server = await device.gatt.connect();
            console.log('Connected to GATT Server');

            // Get printer service
            let service;
            try {
                service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            } catch (e) {
                // Try alternative service UUID
                try {
                    service = await server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455');
                } catch (e2) {
                    service = await server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
                }
            }

            console.log('Got printer service');

            // Get write characteristic
            let characteristic;
            try {
                characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            } catch (e) {
                // Try alternative characteristic UUIDs
                try {
                    characteristic = await service.getCharacteristic('49535343-8841-43f4-a8d4-ecbe34729bb3');
                } catch (e2) {
                    characteristic = await service.getCharacteristic('0000ff01-0000-1000-8000-00805f9b34fb');
                }
            }

            console.log('Got write characteristic');
            setPrinterCharacteristic(characteristic);

            // Save device ID for future reconnections
            localStorage.setItem('bluetooth_printer_id', device.id);
            localStorage.setItem('bluetooth_printer_name', device.name);

            setConnectionStatus('connected');
            setIsConnecting(false);

            // Test print
            await testPrint(characteristic);

            if (onPrinterConnected) {
                onPrinterConnected({ device, characteristic });
            }

        } catch (error) {
            console.error('Bluetooth connection error:', error);
            setConnectionStatus('disconnected');
            setIsConnecting(false);
            
            if (error.message.includes('User cancelled')) {
                setErrorMessage('Connection cancelled by user');
            } else if (error.message.includes('not found')) {
                setErrorMessage('Printer service not found. Make sure your RONGTA R22 is in pairing mode.');
            } else if (error.message.includes('GATT operation')) {
                setErrorMessage('Printer is busy. Please wait a moment and try again.');
            } else {
                setErrorMessage(`Connection failed: ${error.message}`);
            }
        }
    };

    const testPrint = async (characteristic) => {
        if (isPrinting) {
            console.log('Printer is busy, skipping test print');
            return;
        }

        setIsPrinting(true);
        
        try {
            // ESC/POS commands for test print
            const encoder = new TextEncoder();
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            // Initialize printer
            const init = new Uint8Array([0x1B, 0x40]); // ESC @
            await characteristic.writeValue(init);
            await delay(150); // Increased delay

            // Set alignment to center
            const centerAlign = new Uint8Array([0x1B, 0x61, 0x01]); // ESC a 1
            await characteristic.writeValue(centerAlign);
            await delay(100); // Increased delay

            // Print test text
            const text = encoder.encode('✓ BLUETOOTH CONNECTED\n\nRONGTA R22\nTest Print Success\n\n');
            await characteristic.writeValue(text);
            await delay(150); // Increased delay

            // Feed and cut
            const feed = new Uint8Array([0x1B, 0x64, 0x03]); // ESC d 3 (feed 3 lines)
            await characteristic.writeValue(feed);
            await delay(150); // Increased delay

            const cut = new Uint8Array([0x1D, 0x56, 0x00]); // GS V 0 (full cut)
            await characteristic.writeValue(cut);
            await delay(100);

            console.log('Test print sent successfully');
        } catch (error) {
            console.error('Test print failed:', error);
            if (error.message.includes('GATT operation')) {
                setErrorMessage('Printer is busy. Please wait a moment before printing again.');
            }
            throw error;
        } finally {
            setIsPrinting(false);
        }
    };

    const disconnect = () => {
        if (connectedDevice && connectedDevice.gatt.connected) {
            connectedDevice.gatt.disconnect();
        }
        setConnectedDevice(null);
        setPrinterCharacteristic(null);
        setConnectionStatus('disconnected');
        setIsPrinting(false);
    };

    return (
        <div className="space-y-6">
            {/* Browser Support Check */}
            {!isSupported && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <AlertDescription>
                        <p className="font-bold text-red-900">Web Bluetooth Not Supported</p>
                        <p className="text-red-800 text-sm mt-1">
                            Please use Chrome, Edge, or Opera browser on Windows, Mac, Android, or ChromeOS.
                            Safari and iOS do not support Web Bluetooth.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {/* RONGTA R22 Bluetooth Setup Guide */}
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <Bluetooth className="w-6 h-6 text-blue-600" />
                <AlertDescription>
                    <p className="font-bold text-blue-900 text-lg mb-3">🔵 RONGTA R22 Bluetooth Setup</p>
                    <div className="space-y-4 text-sm text-blue-800">
                        <div>
                            <p className="font-semibold mb-2">Step 1: Prepare Your RONGTA R22 Printer</p>
                            <ol className="list-decimal ml-5 space-y-1">
                                <li>Turn ON the RONGTA R22 printer</li>
                                <li>Load thermal paper (black side facing up)</li>
                                <li>Make sure Bluetooth indicator is blinking (pairing mode)</li>
                                <li>If not blinking, press and hold power button for 3 seconds</li>
                                <li>Printer should show "Bluetooth" or blue LED flashing</li>
                            </ol>
                        </div>

                        <div className="bg-white p-3 rounded border border-blue-300">
                            <p className="font-semibold text-blue-900 mb-2">Step 2: Enable Bluetooth on Your Device</p>
                            <ul className="list-disc ml-5 space-y-1">
                                <li><strong>Windows:</strong> Settings → Bluetooth & devices → Turn ON</li>
                                <li><strong>Mac:</strong> System Preferences → Bluetooth → Turn ON</li>
                                <li><strong>Android:</strong> Settings → Connections → Bluetooth → Turn ON</li>
                                <li><strong>ChromeOS:</strong> Settings → Bluetooth → Turn ON</li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                            <p className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</p>
                            <ul className="list-disc ml-5 space-y-1">
                                <li><strong>DO NOT pair via system Bluetooth settings</strong> - We'll connect directly</li>
                                <li>Keep printer within 10 meters (30 feet) of your device</li>
                                <li>Close other Bluetooth printer apps that might interfere</li>
                                <li>Make sure no other device is connected to the R22</li>
                                <li>Wait for test print to complete before printing again</li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-semibold mb-2">Step 3: Connect via This App</p>
                            <ol className="list-decimal ml-5 space-y-1">
                                <li>Click "Connect to RONGTA R22" button below</li>
                                <li>Browser will show available Bluetooth devices</li>
                                <li>Look for "RONGTA R22" or "BlueTooth Printer"</li>
                                <li>Click on it and press "Pair"</li>
                                <li>Wait for connection (5-10 seconds)</li>
                                <li>You'll see a test print come out! ✅</li>
                            </ol>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>

            {/* Connection Status Card */}
            <Card className={`border-2 ${
                connectionStatus === 'connected' ? 'border-green-500 bg-green-50' :
                connectionStatus === 'connecting' ? 'border-blue-500 bg-blue-50' :
                'border-slate-200'
            }`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Bluetooth className={`w-6 h-6 ${
                            connectionStatus === 'connected' ? 'text-green-600' :
                            connectionStatus === 'connecting' ? 'text-blue-600 animate-pulse' :
                            'text-slate-400'
                        }`} />
                        Bluetooth Printer Connection
                        {connectionStatus === 'connected' && (
                            <Badge className="bg-green-600 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Connected
                            </Badge>
                        )}
                        {isPrinting && (
                            <Badge className="bg-blue-600 text-white">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Printing...
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {connectionStatus === 'disconnected' && (
                        <div className="text-center py-6">
                            <Printer className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-600 mb-4">
                                No printer connected. Follow the steps above to connect your RONGTA R22.
                            </p>
                            <Button
                                onClick={connectToPrinter}
                                disabled={!isSupported || isConnecting}
                                className="bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Bluetooth className="w-5 h-5 mr-2" />
                                        Connect to RONGTA R22
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {connectionStatus === 'connecting' && (
                        <div className="text-center py-6">
                            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
                            <p className="text-blue-900 font-semibold text-lg">Connecting to Printer...</p>
                            <p className="text-blue-700 text-sm mt-2">
                                Select your RONGTA R22 from the browser dialog
                            </p>
                        </div>
                    )}

                    {connectionStatus === 'connected' && connectedDevice && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-green-900">
                                            ✅ {connectedDevice.name}
                                        </p>
                                        <p className="text-sm text-green-700">
                                            Bluetooth printer ready for printing
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={disconnect}
                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => testPrint(printerCharacteristic)}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={isPrinting}
                                >
                                    {isPrinting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Printing...
                                        </>
                                    ) : (
                                        <>
                                            <Printer className="w-4 h-4 mr-2" />
                                            Test Print
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={connectToPrinter}
                                    variant="outline"
                                    disabled={isPrinting}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <Alert className="bg-red-50 border-red-200">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <AlertDescription>
                                <p className="font-semibold text-red-900">Connection Error</p>
                                <p className="text-red-800 text-sm mt-1">{errorMessage}</p>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Alert>
                <Zap className="w-5 h-5 text-orange-600" />
                <AlertDescription>
                    <p className="font-bold text-slate-900 mb-2">🔧 Troubleshooting Tips:</p>
                    <ul className="text-sm text-slate-700 space-y-1 list-disc ml-5">
                        <li><strong>Can't find printer?</strong> Make sure R22 is in pairing mode (blue LED blinking)</li>
                        <li><strong>Connection fails?</strong> Turn printer OFF, wait 5 seconds, turn ON, try again</li>
                        <li><strong>Already paired?</strong> Forget device in system Bluetooth settings first</li>
                        <li><strong>"GATT operation in progress"?</strong> Wait for current print to finish, then try again</li>
                        <li><strong>Using iOS/Safari?</strong> Web Bluetooth not supported - use Chrome on Android/Windows/Mac</li>
                        <li><strong>Permissions denied?</strong> Check browser permissions for Bluetooth access</li>
                        <li><strong>Still not working?</strong> Try refreshing the page and reconnecting</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}

// Export helper function for printing
export async function printToBluetoothPrinter(characteristic, content) {
    if (!characteristic) {
        throw new Error('No printer connected');
    }

    const encoder = new TextEncoder();
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Initialize printer
        await characteristic.writeValue(new Uint8Array([0x1B, 0x40])); // ESC @
        await delay(150);

        // Ensure content is a string
        const contentStr = String(content || '');
        
        // Process content line by line
        const lines = contentStr.split('\n');
        
        for (const line of lines) {
            // Skip if line is undefined or null
            if (!line && line !== '') continue;
            
            const lineStr = String(line);
            
            if (lineStr.includes('[CENTER]')) {
                // Center alignment
                await characteristic.writeValue(new Uint8Array([0x1B, 0x61, 0x01]));
                await delay(80);
                const text = lineStr.replace('[CENTER]', '').trim();
                if (text) {
                    await characteristic.writeValue(encoder.encode(text + '\n'));
                    await delay(80);
                }
            } else if (lineStr.includes('[BOLD]')) {
                // Bold text
                await characteristic.writeValue(new Uint8Array([0x1B, 0x45, 0x01])); // Bold ON
                await delay(80);
                const text = lineStr.replace('[BOLD]', '').trim();
                if (text) {
                    await characteristic.writeValue(encoder.encode(text + '\n'));
                    await delay(80);
                }
                await characteristic.writeValue(new Uint8Array([0x1B, 0x45, 0x00])); // Bold OFF
                await delay(80);
            } else if (lineStr.includes('[LARGE]')) {
                // Large text
                await characteristic.writeValue(new Uint8Array([0x1D, 0x21, 0x11])); // Double size
                await delay(80);
                const text = lineStr.replace('[LARGE]', '').trim();
                if (text) {
                    await characteristic.writeValue(encoder.encode(text + '\n'));
                    await delay(80);
                }
                await characteristic.writeValue(new Uint8Array([0x1D, 0x21, 0x00])); // Normal size
                await delay(80);
            } else if (lineStr.includes('[QR:')) {
                // QR Code - simplified version
                const match = lineStr.match(/\[QR:(.*?)\]/);
                const qrData = match ? match[1] : null;
                if (qrData) {
                    // This is a simplified implementation
                    // Full QR code printing requires more complex ESC/POS commands
                    await characteristic.writeValue(encoder.encode(`QR: ${qrData}\n`));
                    await delay(80);
                }
            } else if (lineStr.includes('[CUT]')) {
                // Paper cut
                await characteristic.writeValue(new Uint8Array([0x1D, 0x56, 0x00]));
                await delay(150);
            } else if (lineStr.includes('[FEED]')) {
                // Feed lines
                await characteristic.writeValue(new Uint8Array([0x1B, 0x64, 0x03]));
                await delay(150);
            } else if (lineStr.trim()) {
                // Regular text (only if not empty)
                await characteristic.writeValue(encoder.encode(lineStr + '\n'));
                await delay(80);
            }
        }

        // Feed and cut at end
        await characteristic.writeValue(new Uint8Array([0x1B, 0x64, 0x03])); // Feed 3 lines
        await delay(150);
        await characteristic.writeValue(new Uint8Array([0x1D, 0x56, 0x00])); // Full cut
        await delay(100);

        return { success: true };
    } catch (error) {
        console.error('Bluetooth print error:', error);
        if (error.message.includes('GATT operation')) {
            throw new Error('Printer is busy. Please wait a moment before printing again.');
        }
        throw error;
    }
}