import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Monitor, Tv, Cast, Wifi, WifiOff, Play, Square, RefreshCw,
    Settings, Plus, ExternalLink, QrCode, Copy, CheckCircle,
    Volume2, Sun, Clock, MapPin, Smartphone, Info, Zap
} from "lucide-react";

export default function DisplayManagement() {
    const [displays, setDisplays] = useState([]);
    const [castingSessions, setCastingSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCastModal, setShowCastModal] = useState(false);
    const [selectedDisplays, setSelectedDisplays] = useState([]);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [newDisplay, setNewDisplay] = useState({
        display_name: "",
        display_type: "web_browser",
        location: "",
        supported_content: ["announcements"]
    });
    const [castConfig, setCastConfig] = useState({
        content_type: "announcement",
        content_url: "",
        duration_minutes: 60
    });

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [displaysData, sessionsData] = await Promise.all([
                base44.entities.Display.list('-last_ping'),
                base44.entities.CastingSession.filter({ status: 'active' })
            ]);
            setDisplays(displaysData);
            setCastingSessions(sessionsData);
        } catch (error) {
            console.error("Error loading display data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDisplay = async () => {
        try {
            const displayUrl = `${window.location.origin}/display-screen/${Date.now()}`;
            const display = await base44.entities.Display.create({
                ...newDisplay,
                display_url: displayUrl,
                status: 'offline',
                last_ping: new Date().toISOString()
            });
            setDisplays([...displays, display]);
            setShowAddModal(false);
            setNewDisplay({
                display_name: "",
                display_type: "web_browser",
                location: "",
                supported_content: ["announcements"]
            });
        } catch (error) {
            console.error("Error adding display:", error);
            alert("Failed to add display");
        }
    };

    const handleStartCasting = async () => {
        if (selectedDisplays.length === 0) {
            alert("Please select at least one display");
            return;
        }

        try {
            const user = await base44.auth.me();
            await base44.entities.CastingSession.create({
                session_name: `Cast to ${selectedDisplays.length} displays`,
                ...castConfig,
                target_displays: selectedDisplays,
                started_by: user.email,
                started_at: new Date().toISOString(),
                status: 'active'
            });

            // Update display statuses
            for (const displayId of selectedDisplays) {
                await base44.entities.Display.update(displayId, {
                    status: 'casting',
                    current_content_type: castConfig.content_type,
                    last_ping: new Date().toISOString()
                });
            }

            await loadData();
            setShowCastModal(false);
            setSelectedDisplays([]);
        } catch (error) {
            console.error("Error starting cast:", error);
            alert("Failed to start casting");
        }
    };

    const handleStopCasting = async (sessionId) => {
        try {
            await base44.entities.CastingSession.update(sessionId, {
                status: 'stopped',
                ended_at: new Date().toISOString()
            });
            await loadData();
        } catch (error) {
            console.error("Error stopping cast:", error);
        }
    };

    const copyDisplayUrl = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-100 text-green-800';
            case 'casting': return 'bg-blue-100 text-blue-800';
            case 'offline': return 'bg-gray-100 text-gray-800';
            case 'standby': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDisplayIcon = (type) => {
        switch (type) {
            case 'chromecast': return <Cast className="w-5 h-5" />;
            case 'smart_tv': return <Tv className="w-5 h-5" />;
            case 'web_browser': return <Monitor className="w-5 h-5" />;
            case 'kitchen_display': return <Monitor className="w-5 h-5" />;
            default: return <Monitor className="w-5 h-5" />;
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Cast className="w-8 h-8 text-blue-600" />
                            Display & Casting Management
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Manage screens, TVs, and multi-display casting
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setShowCastModal(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Play className="w-5 h-5 mr-2" />
                            Start Casting
                        </Button>
                        <Button onClick={() => setShowAddModal(true)} variant="outline">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Display
                        </Button>
                    </div>
                </div>

                {/* Setup Guide */}
                <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <Info className="w-5 h-5 text-blue-600" />
                    <AlertDescription>
                        <p className="font-bold text-blue-900 mb-2">🖥️ How to Set Up Displays:</p>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
                            <div>
                                <p className="font-semibold mb-1">Web Browser (Easiest):</p>
                                <ol className="list-decimal ml-4 space-y-1">
                                    <li>Add a display above</li>
                                    <li>Copy the display URL</li>
                                    <li>Open URL on any device/TV</li>
                                    <li>Bookmark for easy access</li>
                                </ol>
                            </div>
                            <div>
                                <p className="font-semibold mb-1">Chromecast:</p>
                                <ol className="list-decimal ml-4 space-y-1">
                                    <li>Connect Chromecast to TV</li>
                                    <li>Get device name from TV</li>
                                    <li>Add display with device ID</li>
                                    <li>Cast from Chrome browser</li>
                                </ol>
                            </div>
                            <div>
                                <p className="font-semibold mb-1">Smart TV (Samsung/LG):</p>
                                <ol className="list-decimal ml-4 space-y-1">
                                    <li>Open Smart TV browser</li>
                                    <li>Navigate to display URL</li>
                                    <li>Set as homepage</li>
                                    <li>Enable auto-start</li>
                                </ol>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="displays" className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="displays">
                            <Monitor className="w-4 h-4 mr-2" />
                            Displays ({displays.length})
                        </TabsTrigger>
                        <TabsTrigger value="active">
                            <Play className="w-4 h-4 mr-2" />
                            Active Sessions ({castingSessions.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Displays Tab */}
                    <TabsContent value="displays">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displays.map(display => (
                                <Card key={display.id} className="hover:shadow-lg transition-all">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    {getDisplayIcon(display.display_type)}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{display.display_name}</CardTitle>
                                                    <p className="text-sm text-slate-600 capitalize">
                                                        {display.display_type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={getStatusColor(display.status)}>
                                                {display.status === 'online' ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                                                {display.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {display.location && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin className="w-4 h-4" />
                                                {display.location}
                                            </div>
                                        )}

                                        {display.display_url && (
                                            <div>
                                                <Label className="text-xs text-slate-500">Display URL</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        value={display.display_url}
                                                        readOnly
                                                        className="text-xs"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyDisplayUrl(display.display_url)}
                                                    >
                                                        {copiedUrl ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {display.current_content_type && (
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <p className="text-xs text-blue-600 font-semibold">Currently Showing:</p>
                                                <p className="text-sm text-blue-900 capitalize">{display.current_content_type}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => window.open(display.display_url, '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                Open
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedDisplays([display.id]);
                                                    setShowCastModal(true);
                                                }}
                                            >
                                                <Cast className="w-4 h-4 mr-1" />
                                                Cast
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {displays.length === 0 && (
                                <Card className="col-span-full">
                                    <CardContent className="p-12 text-center">
                                        <Monitor className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Displays Yet</h3>
                                        <p className="text-slate-600 mb-4">Add your first display to get started</p>
                                        <Button onClick={() => setShowAddModal(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Display
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Active Sessions Tab */}
                    <TabsContent value="active">
                        <div className="space-y-4">
                            {castingSessions.map(session => (
                                <Card key={session.id}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                                    <h3 className="text-lg font-semibold">{session.session_name}</h3>
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                        {session.content_type}
                                                    </Badge>
                                                </div>
                                                
                                                <p className="text-sm text-slate-600">
                                                    Casting to {session.target_displays?.length || 0} display(s)
                                                </p>
                                                
                                                {session.content_url && (
                                                    <p className="text-xs text-slate-500 truncate max-w-md">
                                                        URL: {session.content_url}
                                                    </p>
                                                )}

                                                <p className="text-xs text-slate-500">
                                                    Started: {new Date(session.started_at).toLocaleString()}
                                                </p>
                                            </div>

                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleStopCasting(session.id)}
                                            >
                                                <Square className="w-4 h-4 mr-2" />
                                                Stop Casting
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {castingSessions.length === 0 && (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Play className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Sessions</h3>
                                        <p className="text-slate-600 mb-4">Start casting to your displays</p>
                                        <Button onClick={() => setShowCastModal(true)}>
                                            <Play className="w-4 h-4 mr-2" />
                                            Start Casting
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Add Display Modal */}
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Display</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Display Name *</Label>
                                <Input
                                    value={newDisplay.display_name}
                                    onChange={(e) => setNewDisplay({...newDisplay, display_name: e.target.value})}
                                    placeholder="e.g., Main Lobby TV, Kitchen Display 1"
                                />
                            </div>

                            <div>
                                <Label>Display Type</Label>
                                <Select
                                    value={newDisplay.display_type}
                                    onValueChange={(value) => setNewDisplay({...newDisplay, display_type: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="web_browser">Web Browser (Recommended)</SelectItem>
                                        <SelectItem value="chromecast">Chromecast</SelectItem>
                                        <SelectItem value="smart_tv">Smart TV</SelectItem>
                                        <SelectItem value="kitchen_display">Kitchen Display</SelectItem>
                                        <SelectItem value="airplay">AirPlay</SelectItem>
                                        <SelectItem value="miracast">Miracast</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Location</Label>
                                <Input
                                    value={newDisplay.location}
                                    onChange={(e) => setNewDisplay({...newDisplay, location: e.target.value})}
                                    placeholder="e.g., Main Sanctuary, Coffee Shop"
                                />
                            </div>

                            <Alert>
                                <Zap className="w-4 h-4" />
                                <AlertDescription>
                                    <p className="font-semibold mb-1">Next Steps:</p>
                                    <p className="text-sm">After creating, you'll get a unique URL. Open this URL on your TV/display device to connect it.</p>
                                </AlertDescription>
                            </Alert>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button onClick={handleAddDisplay} disabled={!newDisplay.display_name}>
                                Add Display
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Cast Modal */}
                <Dialog open={showCastModal} onOpenChange={setShowCastModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Start Casting Session</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Select Displays to Cast To</Label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {displays.filter(d => d.status !== 'offline').map(display => (
                                        <div
                                            key={display.id}
                                            onClick={() => {
                                                if (selectedDisplays.includes(display.id)) {
                                                    setSelectedDisplays(selectedDisplays.filter(id => id !== display.id));
                                                } else {
                                                    setSelectedDisplays([...selectedDisplays, display.id]);
                                                }
                                            }}
                                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                selectedDisplays.includes(display.id)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {getDisplayIcon(display.display_type)}
                                                <div>
                                                    <p className="font-medium text-sm">{display.display_name}</p>
                                                    <p className="text-xs text-slate-500">{display.location}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {selectedDisplays.length} display(s) selected
                                </p>
                            </div>

                            <div>
                                <Label>Content Type</Label>
                                <Select
                                    value={castConfig.content_type}
                                    onValueChange={(value) => setCastConfig({...castConfig, content_type: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="announcement">Announcement</SelectItem>
                                        <SelectItem value="sermon">Sermon Video</SelectItem>
                                        <SelectItem value="live_stream">Live Stream</SelectItem>
                                        <SelectItem value="event">Event Info</SelectItem>
                                        <SelectItem value="slideshow">Slideshow</SelectItem>
                                        <SelectItem value="website">Website/URL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Content URL (Optional)</Label>
                                <Input
                                    value={castConfig.content_url}
                                    onChange={(e) => setCastConfig({...castConfig, content_url: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <Label>Duration (minutes)</Label>
                                <Input
                                    type="number"
                                    value={castConfig.duration_minutes}
                                    onChange={(e) => setCastConfig({...castConfig, duration_minutes: parseInt(e.target.value)})}
                                    min="1"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCastModal(false)}>Cancel</Button>
                            <Button onClick={handleStartCasting} className="bg-blue-600 hover:bg-blue-700">
                                <Play className="w-4 h-4 mr-2" />
                                Start Casting
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}