import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Wifi, Bluetooth, Printer, Monitor, Tv, RefreshCw, 
    CheckCircle, XCircle, Loader2, Search, Signal, 
    Coffee, Baby, ChefHat, Presentation
} from "lucide-react";

export default function DeviceDiscovery({ 
    deviceType = "all", // "printer", "display", "all"
    onDeviceSelected,
    onDeviceConnected 
}) {
    const [isScanning, setIsScanning] = useState(false);
    const [scanMethod, setScanMethod] = useState(null); // "wifi", "bluetooth"
    const [discoveredDevices, setDiscoveredDevices] = useState([]);
    const [connectingDevice, setConnectingDevice] = useState(null);
    const [error, setError] = useState(null);
    const [bluetoothSupported, setBluetoothSupported] = useState(false);

    useEffect(() => {
        // Check if Web Bluetooth API is available
        if (navigator.bluetooth) {
            setBluetoothSupported(true);
        }
    }, []);

    const scanForWifiDevices = async () => {
        setIsScanning(true);
        setScanMethod("wifi");
        setError(null);
        setDiscoveredDevices([]);

        try {
            // Simulate network device discovery
            // In production, this would use mDNS/Bonjour or SSDP protocols
            const mockDevices = await simulateNetworkScan(deviceType);
            setDiscoveredDevices(mockDevices);
        } catch (err) {
            setError("Failed to scan network. Please check your connection.");
            console.error("Network scan error:", err);
        }

        setIsScanning(false);
    };

    const scanForBluetoothDevices = async () => {
        if (!bluetoothSupported) {
            setError("Bluetooth is not supported on this browser. Try Chrome or Edge.");
            return;
        }

        setIsScanning(true);
        setScanMethod("bluetooth");
        setError(null);
        setDiscoveredDevices([]);

        try {
            // Request Bluetooth device with filters based on device type
            const filters = getBluetoothFilters(deviceType);
            
            const device = await navigator.bluetooth.requestDevice({
                filters: filters.length > 0 ? filters : undefined,
                acceptAllDevices: filters.length === 0,
                optionalServices: ['battery_service', 'device_information']
            });

            const discoveredDevice = {
                id: device.id,
                name: device.name || "Unknown Bluetooth Device",
                type: guessDeviceType(device.name),
                connectionType: "bluetooth",
                bluetoothDevice: device,
                signal: "strong",
                status: "available"
            };

            setDiscoveredDevices(prev => [...prev, discoveredDevice]);

        } catch (err) {
            if (err.name !== 'NotFoundError') {
                setError("Bluetooth scan cancelled or failed.");
            }
            console.error("Bluetooth scan error:", err);
        }

        setIsScanning(false);
    };

    const simulateNetworkScan = async (type) => {
        // Simulate scanning delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const allDevices = [
            {
                id: "printer-epson-001",
                name: "EPSON TM-T88VI",
                type: "printer",
                subType: "receipt",
                connectionType: "wifi",
                ipAddress: "192.168.1.105",
                macAddress: "00:1B:44:11:3A:B7",
                signal: "strong",
                status: "available",
                capabilities: ["receipt", "label"]
            },
            {
                id: "printer-brother-002",
                name: "Brother QL-820NWB",
                type: "printer",
                subType: "label",
                connectionType: "wifi",
                ipAddress: "192.168.1.112",
                macAddress: "00:1B:44:22:4C:D9",
                signal: "medium",
                status: "available",
                capabilities: ["label", "badge"]
            },
            {
                id: "printer-star-003",
                name: "Star TSP143IIILAN",
                type: "printer",
                subType: "receipt",
                connectionType: "wifi",
                ipAddress: "192.168.1.118",
                macAddress: "00:1B:44:33:5E:F1",
                signal: "strong",
                status: "available",
                capabilities: ["receipt"]
            },
            {
                id: "display-samsung-001",
                name: "Samsung Smart TV - Lobby",
                type: "display",
                subType: "tv",
                connectionType: "wifi",
                ipAddress: "192.168.1.150",
                macAddress: "00:1A:22:33:44:55",
                signal: "strong",
                status: "available",
                capabilities: ["cast", "hdmi"]
            },
            {
                id: "display-lg-002",
                name: "LG WebOS TV - Sanctuary",
                type: "display",
                subType: "tv",
                connectionType: "wifi",
                ipAddress: "192.168.1.155",
                macAddress: "00:1A:22:44:55:66",
                signal: "medium",
                status: "available",
                capabilities: ["cast", "miracast"]
            },
            {
                id: "display-chromecast-001",
                name: "Chromecast - Kitchen",
                type: "display",
                subType: "chromecast",
                connectionType: "wifi",
                ipAddress: "192.168.1.160",
                macAddress: "00:1A:22:55:66:77",
                signal: "strong",
                status: "available",
                capabilities: ["cast"]
            },
            {
                id: "display-fire-001",
                name: "Fire TV Stick - Kids Room",
                type: "display",
                subType: "firetv",
                connectionType: "wifi",
                ipAddress: "192.168.1.165",
                macAddress: "00:1A:22:66:77:88",
                signal: "strong",
                status: "available",
                capabilities: ["cast"]
            }
        ];

        if (type === "printer") {
            return allDevices.filter(d => d.type === "printer");
        } else if (type === "display") {
            return allDevices.filter(d => d.type === "display");
        }
        return allDevices;
    };

    const getBluetoothFilters = (type) => {
        const filters = [];
        
        if (type === "printer" || type === "all") {
            // Common printer service UUIDs
            filters.push(
                { services: ['0x1101'] }, // Serial Port Profile
                { namePrefix: 'EPSON' },
                { namePrefix: 'Brother' },
                { namePrefix: 'Star' },
                { namePrefix: 'Zebra' }
            );
        }
        
        return [];
    };

    const guessDeviceType = (name) => {
        if (!name) return "unknown";
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes('print') || lowerName.includes('epson') || 
            lowerName.includes('brother') || lowerName.includes('star') ||
            lowerName.includes('zebra')) {
            return "printer";
        }
        if (lowerName.includes('tv') || lowerName.includes('display') ||
            lowerName.includes('chromecast') || lowerName.includes('fire')) {
            return "display";
        }
        return "unknown";
    };

    const connectToDevice = async (device) => {
        setConnectingDevice(device.id);
        setError(null);

        try {
            if (device.connectionType === "bluetooth" && device.bluetoothDevice) {
                // Connect via Bluetooth
                const server = await device.bluetoothDevice.gatt.connect();
                console.log("Connected to Bluetooth device:", device.name);
            }

            // Simulate connection process
            await new Promise(resolve => setTimeout(resolve, 1500));

            const connectedDevice = {
                ...device,
                status: "connected",
                connectedAt: new Date().toISOString()
            };

            if (onDeviceConnected) {
                onDeviceConnected(connectedDevice);
            }

            // Update device status in list
            setDiscoveredDevices(prev => 
                prev.map(d => d.id === device.id ? connectedDevice : d)
            );

        } catch (err) {
            setError(`Failed to connect to ${device.name}`);
            console.error("Connection error:", err);
        }

        setConnectingDevice(null);
    };

    const getDeviceIcon = (device) => {
        if (device.type === "printer") {
            return <Printer className="w-6 h-6" />;
        }
        if (device.subType === "tv") {
            return <Tv className="w-6 h-6" />;
        }
        if (device.subType === "chromecast" || device.subType === "firetv") {
            return <Monitor className="w-6 h-6" />;
        }
        return <Monitor className="w-6 h-6" />;
    };

    const getSignalIcon = (signal) => {
        const colors = {
            strong: "text-green-500",
            medium: "text-yellow-500",
            weak: "text-red-500"
        };
        return <Signal className={`w-4 h-4 ${colors[signal] || colors.medium}`} />;
    };

    const getPurposeIcon = (subType) => {
        switch (subType) {
            case "receipt": return <Coffee className="w-4 h-4" />;
            case "label": return <Baby className="w-4 h-4" />;
            case "tv": return <Presentation className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Scan Buttons */}
            <div className="flex flex-wrap gap-4">
                <Button
                    onClick={scanForWifiDevices}
                    disabled={isScanning}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isScanning && scanMethod === "wifi" ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Wifi className="w-5 h-5 mr-2" />
                    )}
                    Scan WiFi Network
                </Button>

                <Button
                    onClick={scanForBluetoothDevices}
                    disabled={isScanning || !bluetoothSupported}
                    variant="outline"
                    className="border-2"
                >
                    {isScanning && scanMethod === "bluetooth" ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Bluetooth className="w-5 h-5 mr-2" />
                    )}
                    Scan Bluetooth
                </Button>

                {discoveredDevices.length > 0 && (
                    <Button
                        onClick={() => scanMethod === "wifi" ? scanForWifiDevices() : scanForBluetoothDevices()}
                        variant="ghost"
                        disabled={isScanning}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                        Rescan
                    </Button>
                )}
            </div>

            {/* Bluetooth Not Supported Warning */}
            {!bluetoothSupported && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-yellow-800">
                        Bluetooth scanning requires Chrome or Edge browser. WiFi scanning works on all browsers.
                    </AlertDescription>
                </Alert>
            )}

            {/* Error Message */}
            {error && (
                <Alert className="bg-red-50 border-red-200">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {/* Scanning Indicator */}
            {isScanning && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="w-8 h-8 text-blue-600" />
                                <div className="absolute inset-0 animate-ping">
                                    <Search className="w-8 h-8 text-blue-400 opacity-50" />
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-blue-900">
                                    Scanning {scanMethod === "wifi" ? "network" : "nearby Bluetooth devices"}...
                                </p>
                                <p className="text-sm text-blue-700">
                                    {scanMethod === "wifi" 
                                        ? "Looking for printers and displays on your network"
                                        : "Make sure your device is in pairing mode"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Discovered Devices */}
            {discoveredDevices.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">
                        Found {discoveredDevices.length} Device{discoveredDevices.length > 1 ? 's' : ''}
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                        {discoveredDevices.map(device => (
                            <Card 
                                key={device.id}
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    device.status === "connected" 
                                        ? "border-2 border-green-500 bg-green-50" 
                                        : "hover:border-blue-300"
                                }`}
                                onClick={() => onDeviceSelected && onDeviceSelected(device)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-3 rounded-lg ${
                                                device.type === "printer" 
                                                    ? "bg-purple-100 text-purple-600"
                                                    : "bg-blue-100 text-blue-600"
                                            }`}>
                                                {getDeviceIcon(device)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{device.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {device.connectionType === "wifi" ? (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Wifi className="w-3 h-3 mr-1" />
                                                            {device.ipAddress}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Bluetooth className="w-3 h-3 mr-1" />
                                                            Bluetooth
                                                        </Badge>
                                                    )}
                                                    {getSignalIcon(device.signal)}
                                                </div>
                                                {device.capabilities && (
                                                    <div className="flex gap-1 mt-2">
                                                        {device.capabilities.map(cap => (
                                                            <Badge key={cap} className="text-xs bg-slate-100 text-slate-700">
                                                                {cap}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            {device.status === "connected" ? (
                                                <Badge className="bg-green-600">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Connected
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        connectToDevice(device);
                                                    }}
                                                    disabled={connectingDevice === device.id}
                                                >
                                                    {connectingDevice === device.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        "Connect"
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isScanning && discoveredDevices.length === 0 && (
                <Card className="border-2 border-dashed">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">No Devices Found</h3>
                        <p className="text-slate-600 mb-4">
                            Click "Scan WiFi Network" or "Scan Bluetooth" to discover nearby devices
                        </p>
                        <div className="text-xs text-slate-500 space-y-1">
                            <p>• Make sure devices are powered on and connected to the same network</p>
                            <p>• For Bluetooth, ensure devices are in pairing mode</p>
                            <p>• Some devices may require manual IP configuration</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}