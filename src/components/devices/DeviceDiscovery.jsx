import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Wifi, Bluetooth, Printer, Monitor, Tv, RefreshCw, 
    CheckCircle, XCircle, Loader2, Search, Signal, 
    Coffee, Baby, ChefHat, Presentation, Unplug
} from "lucide-react";

export default function DeviceDiscovery({ 
    deviceType = "all", // "printer", "display", "all"
    onDeviceSelected,
    onDeviceConnected,
    onDeviceDisconnected
}) {
    const [isScanning, setIsScanning] = useState(false);
    const [scanMethod, setScanMethod] = useState(null); // "wifi", "bluetooth"
    const [discoveredDevices, setDiscoveredDevices] = useState([]);
    const [connectingDevice, setConnectingDevice] = useState(null);
    const [disconnectingDevice, setDisconnectingDevice] = useState(null);
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
        // Show scanning animation for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // No mock devices - return empty array
        // Real device discovery requires native APIs not available in browsers
        // Users should manually add devices or use Bluetooth scanning
        return [];
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

    const disconnectDevice = async (device) => {
        setDisconnectingDevice(device.id);
        setError(null);

        try {
            // If it's a Bluetooth device, disconnect from GATT
            if (device.connectionType === "bluetooth" && device.bluetoothDevice && device.bluetoothDevice.gatt?.connected) {
                device.bluetoothDevice.gatt.disconnect();
                console.log("Disconnected from Bluetooth device:", device.name);
            }

            // Update device status
            const disconnectedDevice = {
                ...device,
                status: "available",
                connectedAt: null
            };

            // Remove from discovered devices list
            setDiscoveredDevices(prev => prev.filter(d => d.id !== device.id));

            if (onDeviceDisconnected) {
                onDeviceDisconnected(disconnectedDevice);
            }

        } catch (err) {
            setError(`Failed to disconnect from ${device.name}`);
            console.error("Disconnect error:", err);
        }

        setDisconnectingDevice(null);
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
                    onClick={scanForBluetoothDevices}
                    disabled={isScanning || !bluetoothSupported}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isScanning && scanMethod === "bluetooth" ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Bluetooth className="w-5 h-5 mr-2" />
                    )}
                    Scan for Bluetooth Devices
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
                                        <div className="flex flex-col gap-2">
                                            {device.status === "connected" ? (
                                                <>
                                                    <Badge className="bg-green-600">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Connected
                                                    </Badge>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            disconnectDevice(device);
                                                        }}
                                                        disabled={disconnectingDevice === device.id}
                                                    >
                                                        {disconnectingDevice === device.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Unplug className="w-3 h-3 mr-1" />
                                                                Disconnect
                                                            </>
                                                        )}
                                                    </Button>
                                                </>
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
                            Use Bluetooth scanning to discover nearby devices, or add devices manually.
                        </p>
                        <div className="text-xs text-slate-500 space-y-1">
                            <p>• <strong>Bluetooth:</strong> Click "Scan Bluetooth" with device in pairing mode</p>
                            <p>• <strong>WiFi devices:</strong> Add manually via Settings → Printer Setup</p>
                            <p>• <strong>Note:</strong> Browser limitations prevent automatic WiFi network scanning</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}