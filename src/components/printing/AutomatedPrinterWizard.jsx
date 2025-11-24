import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
    Wifi, Bluetooth, CheckCircle, AlertTriangle, Loader2,
    ChevronRight, ChevronLeft, Printer, Monitor, Smartphone,
    Tablet, Zap, Info
} from "lucide-react";

export default function AutomatedPrinterWizard({ isOpen, onClose, onComplete }) {
    const [step, setStep] = useState(0);
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [recommendedMethod, setRecommendedMethod] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [networkPrinters, setNetworkPrinters] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [bluetoothDevice, setBluetoothDevice] = useState(null);
    const [printerConfig, setPrinterConfig] = useState({
        name: '',
        type: 'thermal',
        connectionType: '',
        ipAddress: '',
        port: '9100'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            detectDeviceInfo();
        }
    }, [isOpen]);

    const detectDeviceInfo = () => {
        const ua = navigator.userAgent;
        const info = {
            os: detectOS(ua),
            browser: detectBrowser(ua),
            deviceType: detectDeviceType(ua),
            supportsWebBluetooth: !!navigator.bluetooth,
            supportsNetwork: true,
            isMobile: /iPhone|iPad|iPod|Android/i.test(ua)
        };
        
        setDeviceInfo(info);
        
        // Recommend connection method
        if (info.os === 'iOS' || info.os === 'iPadOS') {
            setRecommendedMethod('network');
        } else if (info.supportsWebBluetooth && !info.isMobile) {
            setRecommendedMethod('bluetooth');
        } else {
            setRecommendedMethod('network');
        }
        
        setStep(1);
    };

    const detectOS = (ua) => {
        if (/iPad/i.test(ua)) return 'iPadOS';
        if (/iPhone|iPod/i.test(ua)) return 'iOS';
        if (/Android/i.test(ua)) return 'Android';
        if (/Win/i.test(ua)) return 'Windows';
        if (/Mac/i.test(ua)) return 'macOS';
        if (/Linux/i.test(ua)) return 'Linux';
        return 'Unknown';
    };

    const detectBrowser = (ua) => {
        if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) return 'Chrome';
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
        if (/Firefox/i.test(ua)) return 'Firefox';
        if (/Edge/i.test(ua)) return 'Edge';
        return 'Unknown';
    };

    const detectDeviceType = (ua) => {
        if (/iPad/i.test(ua)) return 'tablet';
        if (/iPhone|iPod/i.test(ua)) return 'mobile';
        if (/Android/i.test(ua) && /Mobile/i.test(ua)) return 'mobile';
        if (/Android/i.test(ua)) return 'tablet';
        return 'desktop';
    };

    const scanNetwork = async () => {
        setIsScanning(true);
        setError('');
        
        try {
            const discovered = [];
            const commonIPs = [];
            
            // Get local IP range
            const localIP = await getLocalIP();
            if (localIP) {
                const baseIP = localIP.substring(0, localIP.lastIndexOf('.'));
                // Scan common printer IPs
                for (let i = 1; i <= 254; i++) {
                    commonIPs.push(`${baseIP}.${i}`);
                }
            }
            
            // Common printer ports
            const ports = [9100, 631, 515];
            
            // Test first 20 IPs (more is too slow)
            for (let i = 0; i < Math.min(commonIPs.length, 20); i++) {
                const ip = commonIPs[i];
                for (const port of ports) {
                    try {
                        const testResult = await testPrinterConnection(ip, port);
                        if (testResult) {
                            discovered.push({
                                name: `Printer at ${ip}`,
                                ipAddress: ip,
                                port: port.toString(),
                                type: 'network'
                            });
                            break;
                        }
                    } catch (e) {
                        // Continue scanning
                    }
                }
            }
            
            setNetworkPrinters(discovered);
            
            if (discovered.length === 0) {
                setError('No printers found. Try manual configuration.');
            }
        } catch (error) {
            setError('Network scan failed. Please try manual configuration.');
        } finally {
            setIsScanning(false);
        }
    };

    const getLocalIP = async () => {
        try {
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel('');
            await pc.createOffer().then(offer => pc.setLocalDescription(offer));
            
            return new Promise((resolve) => {
                pc.onicecandidate = (ice) => {
                    if (!ice || !ice.candidate || !ice.candidate.candidate) {
                        resolve(null);
                        return;
                    }
                    const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
                    if (ipMatch) {
                        resolve(ipMatch[1]);
                        pc.close();
                    }
                };
                
                setTimeout(() => resolve(null), 2000);
            });
        } catch (e) {
            return null;
        }
    };

    const testPrinterConnection = async (ip, port) => {
        return new Promise((resolve) => {
            const img = new Image();
            const timeout = setTimeout(() => {
                resolve(false);
            }, 1000);
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };
            
            img.src = `http://${ip}:${port}/favicon.ico?${Date.now()}`;
        });
    };

    const connectBluetooth = async () => {
        setError('');
        
        if (!navigator.bluetooth) {
            setError('Web Bluetooth is not supported on this browser/device. Please use network connection or try Chrome on Windows/Mac/Android.');
            return;
        }
        
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
                    { namePrefix: 'RONGTA' },
                    { namePrefix: 'Printer' }
                ],
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb',
                    '49535343-fe7d-4ae5-8fa9-9fafd205e455'
                ]
            });
            
            const server = await device.gatt.connect();
            
            setBluetoothDevice(device);
            setPrinterConfig({
                ...printerConfig,
                name: device.name || 'Bluetooth Printer',
                connectionType: 'bluetooth'
            });
            
            setStep(4);
        } catch (error) {
            if (error.message.includes('User cancelled')) {
                setError('Connection cancelled. Please try again.');
            } else if (error.message.includes('not found')) {
                setError('Printer not found. Make sure it is powered on and in pairing mode.');
            } else {
                setError(`Connection failed: ${error.message}`);
            }
        }
    };

    const saveConfiguration = () => {
        const config = {
            ...printerConfig,
            bluetoothDevice: bluetoothDevice?.id
        };
        
        // Save to localStorage
        const existingPrinters = JSON.parse(localStorage.getItem('churchConnectPrinters') || '[]');
        existingPrinters.push({
            id: Date.now().toString(),
            ...config,
            addedDate: new Date().toISOString()
        });
        localStorage.setItem('churchConnectPrinters', JSON.stringify(existingPrinters));
        
        onComplete(config);
        onClose();
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                        <p>Detecting your device...</p>
                    </div>
                );
            
            case 1:
                return (
                    <div className="space-y-6">
                        <Alert>
                            <Info className="w-4 h-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-2">Device Information</p>
                                <div className="text-sm space-y-1">
                                    <p>OS: {deviceInfo.os}</p>
                                    <p>Browser: {deviceInfo.browser}</p>
                                    <p>Type: {deviceInfo.deviceType}</p>
                                </div>
                            </AlertDescription>
                        </Alert>

                        <div>
                            <h3 className="font-semibold mb-4">Choose Connection Method</h3>
                            <div className="space-y-3">
                                {deviceInfo.supportsWebBluetooth && (
                                    <button
                                        onClick={() => {
                                            setSelectedMethod('bluetooth');
                                            setStep(2);
                                        }}
                                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                                            recommendedMethod === 'bluetooth' 
                                                ? 'border-blue-500 bg-blue-50' 
                                                : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Bluetooth className="w-8 h-8 text-blue-600" />
                                            <div className="flex-1">
                                                <p className="font-semibold">Bluetooth Connection</p>
                                                <p className="text-sm text-slate-600">Direct wireless connection</p>
                                            </div>
                                            {recommendedMethod === 'bluetooth' && (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                    Recommended
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                )}
                                
                                <button
                                    onClick={() => {
                                        setSelectedMethod('network');
                                        setStep(3);
                                    }}
                                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                                        recommendedMethod === 'network' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-slate-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Wifi className="w-8 h-8 text-green-600" />
                                        <div className="flex-1">
                                            <p className="font-semibold">Network Connection</p>
                                            <p className="text-sm text-slate-600">WiFi/Ethernet printer</p>
                                        </div>
                                        {recommendedMethod === 'network' && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {deviceInfo.os === 'iOS' || deviceInfo.os === 'iPadOS' ? (
                            <Alert className="bg-yellow-50 border-yellow-200">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800 text-sm">
                                    iOS/iPadOS does not support Web Bluetooth. Network connection is required.
                                </AlertDescription>
                            </Alert>
                        ) : null}
                    </div>
                );
            
            case 2:
                return (
                    <div className="space-y-6">
                        <Alert className="bg-blue-50 border-blue-200">
                            <Bluetooth className="w-4 h-4 text-blue-600" />
                            <AlertDescription>
                                <p className="font-semibold text-blue-900 mb-2">Bluetooth Setup Steps:</p>
                                <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                                    <li>Turn ON your printer</li>
                                    <li>Ensure Bluetooth LED is blinking (pairing mode)</li>
                                    <li>Click "Connect" below</li>
                                    <li>Select your printer from the list</li>
                                </ol>
                            </AlertDescription>
                        </Alert>

                        {error && (
                            <Alert className="bg-red-50 border-red-200">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <Button
                                onClick={connectBluetooth}
                                className="w-full"
                                size="lg"
                            >
                                <Bluetooth className="w-5 h-5 mr-2" />
                                Connect via Bluetooth
                            </Button>

                            <details className="text-sm">
                                <summary className="cursor-pointer text-blue-600 font-medium">
                                    Troubleshooting Tips
                                </summary>
                                <ul className="mt-2 space-y-1 text-slate-600 ml-4 list-disc">
                                    <li>Make sure printer is within 10 meters</li>
                                    <li>Close other apps that might use the printer</li>
                                    <li>Try turning printer off and on</li>
                                    <li>Check printer has paper loaded</li>
                                    <li>Enable location permissions (required for Bluetooth)</li>
                                </ul>
                            </details>
                        </div>
                    </div>
                );
            
            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Network Printer Discovery</h3>
                                <Button
                                    onClick={scanNetwork}
                                    disabled={isScanning}
                                    variant="outline"
                                    size="sm"
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 mr-2" />
                                            Auto-Discover
                                        </>
                                    )}
                                </Button>
                            </div>

                            {networkPrinters.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {networkPrinters.map((printer, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setPrinterConfig({
                                                    ...printerConfig,
                                                    name: printer.name,
                                                    ipAddress: printer.ipAddress,
                                                    port: printer.port,
                                                    connectionType: 'network'
                                                });
                                                setStep(4);
                                            }}
                                            className="w-full p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Printer className="w-6 h-6 text-green-600" />
                                                <div>
                                                    <p className="font-medium">{printer.name}</p>
                                                    <p className="text-sm text-slate-600">
                                                        {printer.ipAddress}:{printer.port}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 ml-auto text-slate-400" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {error && (
                                <Alert className="bg-yellow-50 border-yellow-200 mb-4">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800 text-sm">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-3">Manual Configuration</h4>
                            <div className="space-y-3">
                                <div>
                                    <Label>Printer Name</Label>
                                    <Input
                                        placeholder="e.g., Front Desk Printer"
                                        value={printerConfig.name}
                                        onChange={(e) => setPrinterConfig({
                                            ...printerConfig,
                                            name: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>IP Address</Label>
                                    <Input
                                        placeholder="e.g., 192.168.1.100"
                                        value={printerConfig.ipAddress}
                                        onChange={(e) => setPrinterConfig({
                                            ...printerConfig,
                                            ipAddress: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Port</Label>
                                    <Input
                                        placeholder="9100"
                                        value={printerConfig.port}
                                        onChange={(e) => setPrinterConfig({
                                            ...printerConfig,
                                            port: e.target.value
                                        })}
                                    />
                                </div>
                                <Button
                                    onClick={() => {
                                        if (!printerConfig.name || !printerConfig.ipAddress) {
                                            setError('Please fill in printer name and IP address');
                                            return;
                                        }
                                        setPrinterConfig({
                                            ...printerConfig,
                                            connectionType: 'network'
                                        });
                                        setStep(4);
                                    }}
                                    className="w-full"
                                >
                                    Continue
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            
            case 4:
                return (
                    <div className="space-y-6">
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <AlertDescription>
                                <p className="font-semibold text-green-900">Printer Configured!</p>
                                <p className="text-sm text-green-800 mt-1">
                                    {printerConfig.name} - {printerConfig.connectionType} connection
                                </p>
                            </AlertDescription>
                        </Alert>

                        <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Name:</span>
                                <span className="font-medium">{printerConfig.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Connection:</span>
                                <span className="font-medium capitalize">{printerConfig.connectionType}</span>
                            </div>
                            {printerConfig.ipAddress && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">IP Address:</span>
                                    <span className="font-medium">{printerConfig.ipAddress}</span>
                                </div>
                            )}
                        </div>

                        <Button onClick={saveConfiguration} className="w-full" size="lg">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Save & Complete Setup
                        </Button>
                    </div>
                );
        }
    };

    const progress = (step / 4) * 100;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-blue-600" />
                        Automated Printer Setup Wizard
                    </DialogTitle>
                </DialogHeader>

                <div className="mb-4">
                    <Progress value={progress} className="h-2" />
                </div>

                {renderStep()}

                {step > 1 && step < 4 && (
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setStep(step - 1)}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}