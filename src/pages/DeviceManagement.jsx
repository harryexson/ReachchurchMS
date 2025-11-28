import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Monitor, Smartphone, Laptop, Tablet, AlertCircle,
    CheckCircle, XCircle, Printer, Settings, Zap,
    RefreshCw, Search, MapPin, Activity, Clock, Plus,
    Cable, Wifi, Bluetooth, Trash2, Edit, Speaker, Camera
} from "lucide-react";
import RemoteDeviceControl from "../components/devices/RemoteDeviceControl";
import WiredDeviceForm from "../components/devices/WiredDeviceForm";

const LOCATIONS = [
    { value: "sanctuary", label: "Sanctuary" },
    { value: "lobby", label: "Lobby" },
    { value: "welcome_center", label: "Welcome Center" },
    { value: "cafe", label: "Café" },
    { value: "bookstore", label: "Bookstore" },
    { value: "kitchen", label: "Kitchen" },
    { value: "patio", label: "Patio" },
    { value: "lounge", label: "Lounge" },
    { value: "porch", label: "Porch" },
    { value: "dining", label: "Dining Area" },
    { value: "sunday_school", label: "Sunday School" },
    { value: "kids_area", label: "Kids Area" },
    { value: "youth_room", label: "Youth Room" },
    { value: "nursery", label: "Nursery" },
    { value: "fellowship_hall", label: "Fellowship Hall" },
    { value: "office", label: "Office" },
    { value: "conference_room", label: "Conference Room" },
    { value: "media_booth", label: "Media / AV Booth" },
    { value: "stage", label: "Stage" },
    { value: "parking_lot", label: "Parking Lot" },
    { value: "outdoor", label: "Outdoor Area" },
    { value: "other", label: "Other" }
];

export default function DeviceManagement() {
    const [currentUser, setCurrentUser] = useState(null);
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [filterLocation, setFilterLocation] = useState("all");
    const [filterType, setFilterType] = useState("all");

    useEffect(() => {
        checkAccess();
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadDevices();
            
            let interval;
            if (autoRefresh) {
                interval = setInterval(loadDevices, 5000);
            }
            
            return () => {
                if (interval) clearInterval(interval);
            };
        }
    }, [autoRefresh, currentUser]);

    const checkAccess = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            if (user.role !== 'admin') {
                alert('Access denied. This feature is only available to administrators.');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Access check failed:', error);
            window.location.href = '/';
        }
    };

    const loadDevices = async () => {
        try {
            const devicesList = await base44.entities.ConnectedDevice.list('-last_seen');
            
            // Update status based on last_seen
            const now = new Date();
            const updatedDevices = devicesList.map(device => {
                const lastSeen = new Date(device.last_seen);
                const secondsSinceLastSeen = (now - lastSeen) / 1000;
                
                let status = device.status;
                if (secondsSinceLastSeen > 30) {
                    status = 'offline';
                } else if (device.status === 'offline') {
                    status = 'online';
                }
                
                return { ...device, status };
            });
            
            setDevices(updatedDevices);
        } catch (error) {
            console.error('Error loading devices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDeviceIcon = (type) => {
        switch (type) {
            case 'kiosk': return <Monitor className="w-5 h-5" />;
            case 'tablet': return <Tablet className="w-5 h-5" />;
            case 'desktop': return <Monitor className="w-5 h-5" />;
            case 'laptop': return <Laptop className="w-5 h-5" />;
            case 'mobile': return <Smartphone className="w-5 h-5" />;
            case 'display': return <Monitor className="w-5 h-5" />;
            case 'printer': return <Printer className="w-5 h-5" />;
            case 'audio': return <Speaker className="w-5 h-5" />;
            case 'camera': return <Camera className="w-5 h-5" />;
            case 'computer': return <Laptop className="w-5 h-5" />;
            default: return <Monitor className="w-5 h-5" />;
        }
    };

    const getConnectionIcon = (type) => {
        switch (type) {
            case 'wifi': return <Wifi className="w-4 h-4" />;
            case 'bluetooth': return <Bluetooth className="w-4 h-4" />;
            default: return <Cable className="w-4 h-4" />;
        }
    };

    const handleAddDevice = async (deviceData) => {
        try {
            await base44.entities.ConnectedDevice.create(deviceData);
            loadDevices();
            setShowAddForm(false);
        } catch (err) {
            console.error("Error adding device:", err);
        }
    };

    const handleUpdateDevice = async (deviceData) => {
        try {
            await base44.entities.ConnectedDevice.update(editingDevice.id, deviceData);
            loadDevices();
            setEditingDevice(null);
        } catch (err) {
            console.error("Error updating device:", err);
        }
    };

    const handleDeleteDevice = async (deviceId) => {
        if (!confirm("Are you sure you want to remove this device?")) return;
        try {
            await base44.entities.ConnectedDevice.delete(deviceId);
            loadDevices();
        } catch (err) {
            console.error("Error deleting device:", err);
        }
    };

    const getStatusBadge = (status) => {
        const configs = {
            online: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Online' },
            offline: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Offline' },
            idle: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Idle' },
            printing: { color: 'bg-blue-100 text-blue-800', icon: Printer, label: 'Printing' },
            error: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Error' }
        };
        
        const config = configs[status] || configs.offline;
        const Icon = config.icon;
        
        return (
            <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.assigned_location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = filterLocation === "all" || device.assigned_location === filterLocation;
        const matchesType = filterType === "all" || device.device_type === filterType;
        return matchesSearch && matchesLocation && matchesType;
    });

    const stats = {
        total: devices.length,
        online: devices.filter(d => d.status === 'online').length,
        offline: devices.filter(d => d.status === 'offline').length,
        withPrinter: devices.filter(d => d.connected_printer).length
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-600" />
                            Remote Device Management
                        </h1>
                        <p className="text-slate-600">
                            Monitor and control devices across all locations
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Device
                        </Button>
                        <Button
                            variant={autoRefresh ? "default" : "outline"}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
                        </Button>
                        <Button onClick={loadDevices} variant="outline">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Devices</p>
                                    <p className="text-3xl font-bold">{stats.total}</p>
                                </div>
                                <Monitor className="w-10 h-10 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Online</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.online}</p>
                                </div>
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Offline</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.offline}</p>
                                </div>
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">With Printer</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.withPrinter}</p>
                                </div>
                                <Printer className="w-10 h-10 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Device Form */}
                {showAddForm && (
                    <WiredDeviceForm
                        onSubmit={handleAddDevice}
                        onCancel={() => setShowAddForm(false)}
                    />
                )}

                {/* Edit Device Form */}
                {editingDevice && (
                    <WiredDeviceForm
                        initialData={editingDevice}
                        onSubmit={handleUpdateDevice}
                        onCancel={() => setEditingDevice(null)}
                    />
                )}

                {/* Search & Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    placeholder="Search devices by name or location..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filterLocation} onValueChange={setFilterLocation}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter by location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {LOCATIONS.map(loc => (
                                        <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="display">Displays</SelectItem>
                                    <SelectItem value="printer">Printers</SelectItem>
                                    <SelectItem value="computer">Computers</SelectItem>
                                    <SelectItem value="audio">Audio</SelectItem>
                                    <SelectItem value="camera">Cameras</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Devices Grid */}
                {isLoading ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                            <p className="text-slate-600">Loading devices...</p>
                        </CardContent>
                    </Card>
                ) : filteredDevices.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Monitor className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-600 mb-2">No devices found</p>
                            <p className="text-sm text-slate-500">
                                Devices will appear here once they register with the system
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredDevices.map((device) => (
                            <Card key={device.id} className="hover:shadow-lg transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                {getDeviceIcon(device.device_type)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{device.device_name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {(device.assigned_location || device.location) && (
                                                        <span className="text-sm text-slate-600 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {LOCATIONS.find(l => l.value === device.assigned_location)?.label || device.location}
                                                        </span>
                                                    )}
                                                    {device.connection_type && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {getConnectionIcon(device.connection_type)}
                                                            <span className="ml-1">{device.connection_type?.toUpperCase()}</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {getStatusBadge(device.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Device Info */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-600">OS</p>
                                            <p className="font-medium">{device.os_type || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Browser</p>
                                            <p className="font-medium">{device.browser_type || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">IP Address</p>
                                            <p className="font-medium">{device.ip_address || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Last Seen</p>
                                            <p className="font-medium">
                                                {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Connected Printer */}
                                    {device.connected_printer && (
                                        <Alert className="bg-blue-50 border-blue-200">
                                            <Printer className="w-4 h-4 text-blue-600" />
                                            <AlertDescription>
                                                <p className="font-semibold text-blue-900">Connected Printer</p>
                                                <p className="text-sm text-blue-800">
                                                    {device.connected_printer.name} ({device.connected_printer.type})
                                                </p>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Metrics */}
                                    {device.metrics && (
                                        <div className="flex gap-4 text-xs text-slate-600">
                                            <span>📊 {device.metrics.total_prints || 0} prints</span>
                                            <span>⏱️ {device.metrics.uptime_hours || 0}h uptime</span>
                                            {device.metrics.failed_prints > 0 && (
                                                <span className="text-red-600">
                                                    ⚠️ {device.metrics.failed_prints} failed
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Device Details */}
                                    {(device.brand || device.model || device.port_number) && (
                                        <div className="text-xs text-slate-500 pt-2 border-t">
                                            {device.brand && <span>{device.brand} </span>}
                                            {device.model && <span>{device.model} </span>}
                                            {device.port_number && <span className="text-blue-600">({device.port_number})</span>}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedDevice(device)}
                                            className="flex-1"
                                        >
                                            <Zap className="w-4 h-4 mr-2" />
                                            Control
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingDevice(device)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() => handleDeleteDevice(device.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Remote Control Modal */}
            {selectedDevice && (
                <RemoteDeviceControl
                    device={selectedDevice}
                    onClose={() => setSelectedDevice(null)}
                    onRefresh={loadDevices}
                />
            )}
        </div>
    );
}