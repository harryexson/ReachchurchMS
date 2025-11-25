import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
    Printer, Monitor, Tv, Wifi, Bluetooth, Settings, 
    CheckCircle, Plus, Trash2, RefreshCw, Coffee,
    Baby, ChefHat, Presentation, Info
} from "lucide-react";
import DeviceDiscovery from "../components/devices/DeviceDiscovery";

export default function AutoDeviceSetupPage() {
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [activeTab, setActiveTab] = useState("discover");
    const [selectedPurpose, setSelectedPurpose] = useState(null);

    useEffect(() => {
        loadSavedDevices();
    }, []);

    const loadSavedDevices = async () => {
        try {
            const devices = await base44.entities.ConnectedDevice.list("-created_date");
            setConnectedDevices(devices);
        } catch (err) {
            console.error("Failed to load devices:", err);
        }
    };

    const handleDeviceConnected = async (device) => {
        try {
            // Save to database
            const savedDevice = await base44.entities.ConnectedDevice.create({
                device_name: device.name,
                device_type: device.type,
                device_subtype: device.subType,
                connection_type: device.connectionType,
                ip_address: device.ipAddress || null,
                mac_address: device.macAddress || null,
                bluetooth_id: device.connectionType === "bluetooth" ? device.id : null,
                status: "connected",
                purpose: selectedPurpose,
                capabilities: device.capabilities || [],
                last_seen: new Date().toISOString()
            });

            setConnectedDevices(prev => [savedDevice, ...prev]);
            setActiveTab("connected");
        } catch (err) {
            console.error("Failed to save device:", err);
        }
    };

    const removeDevice = async (deviceId) => {
        try {
            await base44.entities.ConnectedDevice.delete(deviceId);
            setConnectedDevices(prev => prev.filter(d => d.id !== deviceId));
        } catch (err) {
            console.error("Failed to remove device:", err);
        }
    };

    const updateDevicePurpose = async (deviceId, purpose) => {
        try {
            await base44.entities.ConnectedDevice.update(deviceId, { purpose });
            setConnectedDevices(prev => 
                prev.map(d => d.id === deviceId ? { ...d, purpose } : d)
            );
        } catch (err) {
            console.error("Failed to update device:", err);
        }
    };

    const purposes = [
        { id: "receipt_printer", label: "Receipt Printer", icon: Coffee, description: "Coffee shop, bookstore receipts" },
        { id: "label_printer", label: "Label Printer", icon: Baby, description: "Kids check-in labels" },
        { id: "kitchen_display", label: "Kitchen Display", icon: ChefHat, description: "Order display for kitchen" },
        { id: "lobby_display", label: "Lobby Display", icon: Presentation, description: "Welcome screens, announcements" },
        { id: "sanctuary_display", label: "Sanctuary Display", icon: Tv, description: "Main worship area display" },
        { id: "kids_display", label: "Kids Area Display", icon: Baby, description: "Children's ministry display" }
    ];

    const getDeviceIcon = (type) => {
        switch (type) {
            case "printer": return <Printer className="w-5 h-5" />;
            case "display": return <Monitor className="w-5 h-5" />;
            default: return <Settings className="w-5 h-5" />;
        }
    };

    const getPurposeInfo = (purposeId) => {
        return purposes.find(p => p.id === purposeId);
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Auto Device Setup</h1>
                    <p className="text-slate-600 mt-1">
                        Automatically discover and connect printers and displays on your network
                    </p>
                </div>

                {/* Info Banner */}
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="w-4 h-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">Easy Device Connection</AlertTitle>
                    <AlertDescription className="text-blue-800">
                        No more typing IP addresses! Just click scan and we'll find all printers and displays 
                        connected to your WiFi network or available via Bluetooth.
                    </AlertDescription>
                </Alert>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="discover">
                            <Wifi className="w-4 h-4 mr-2" />
                            Discover
                        </TabsTrigger>
                        <TabsTrigger value="connected">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Connected ({connectedDevices.length})
                        </TabsTrigger>
                        <TabsTrigger value="purposes">
                            <Settings className="w-4 h-4 mr-2" />
                            Assign Purpose
                        </TabsTrigger>
                    </TabsList>

                    {/* Discover Tab */}
                    <TabsContent value="discover" className="mt-6">
                        <div className="space-y-6">
                            {/* Purpose Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">What are you connecting?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {purposes.map(purpose => {
                                            const Icon = purpose.icon;
                                            return (
                                                <button
                                                    key={purpose.id}
                                                    onClick={() => setSelectedPurpose(purpose.id)}
                                                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                                                        selectedPurpose === purpose.id
                                                            ? "border-blue-500 bg-blue-50"
                                                            : "border-slate-200 hover:border-slate-300"
                                                    }`}
                                                >
                                                    <Icon className={`w-6 h-6 mb-2 ${
                                                        selectedPurpose === purpose.id ? "text-blue-600" : "text-slate-600"
                                                    }`} />
                                                    <p className="font-medium text-slate-900">{purpose.label}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{purpose.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Device Discovery */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Scan for Devices</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DeviceDiscovery
                                        deviceType={selectedPurpose?.includes("printer") ? "printer" : 
                                                   selectedPurpose?.includes("display") ? "display" : "all"}
                                        onDeviceConnected={handleDeviceConnected}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Connected Devices Tab */}
                    <TabsContent value="connected" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Connected Devices</CardTitle>
                                <Button variant="outline" size="sm" onClick={loadSavedDevices}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Refresh
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {connectedDevices.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Plus className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-600 mb-2">No devices connected yet</p>
                                        <Button onClick={() => setActiveTab("discover")}>
                                            Discover Devices
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {connectedDevices.map(device => {
                                            const purposeInfo = getPurposeInfo(device.purpose);
                                            return (
                                                <div 
                                                    key={device.id}
                                                    className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-3 rounded-lg ${
                                                                device.device_type === "printer"
                                                                    ? "bg-purple-100 text-purple-600"
                                                                    : "bg-blue-100 text-blue-600"
                                                            }`}>
                                                                {getDeviceIcon(device.device_type)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-900">
                                                                    {device.device_name}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {device.connection_type === "wifi" ? (
                                                                            <>
                                                                                <Wifi className="w-3 h-3 mr-1" />
                                                                                {device.ip_address}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Bluetooth className="w-3 h-3 mr-1" />
                                                                                Bluetooth
                                                                            </>
                                                                        )}
                                                                    </Badge>
                                                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                        {device.status}
                                                                    </Badge>
                                                                </div>
                                                                {purposeInfo && (
                                                                    <div className="mt-2">
                                                                        <Badge className="bg-slate-100 text-slate-700">
                                                                            {React.createElement(purposeInfo.icon, { className: "w-3 h-3 mr-1 inline" })}
                                                                            {purposeInfo.label}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => removeDevice(device.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Assign Purpose Tab */}
                    <TabsContent value="purposes" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Assign Device Purposes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {connectedDevices.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            Connect devices first to assign purposes
                                        </div>
                                    ) : (
                                        connectedDevices.map(device => (
                                            <div key={device.id} className="p-4 border rounded-lg">
                                                <div className="flex items-center gap-3 mb-4">
                                                    {getDeviceIcon(device.device_type)}
                                                    <span className="font-semibold">{device.device_name}</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {purposes
                                                        .filter(p => 
                                                            (device.device_type === "printer" && p.id.includes("printer")) ||
                                                            (device.device_type === "display" && p.id.includes("display"))
                                                        )
                                                        .map(purpose => {
                                                            const Icon = purpose.icon;
                                                            return (
                                                                <button
                                                                    key={purpose.id}
                                                                    onClick={() => updateDevicePurpose(device.id, purpose.id)}
                                                                    className={`p-3 rounded-lg border text-left text-sm ${
                                                                        device.purpose === purpose.id
                                                                            ? "border-blue-500 bg-blue-50"
                                                                            : "border-slate-200 hover:border-slate-300"
                                                                    }`}
                                                                >
                                                                    <Icon className="w-4 h-4 mb-1" />
                                                                    {purpose.label}
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}