import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Video, Calendar, Clock, Plus, Trash2, Edit, 
    Youtube, Facebook, Radio, Check, AlertTriangle,
    ExternalLink, Bell, Settings, Eye
} from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function StreamSchedulerPage() {
    const [scheduledStreams, setScheduledStreams] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStream, setEditingStream] = useState(null);
    const [churchSettings, setChurchSettings] = useState(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduled_start: '',
        scheduled_end: '',
        duration_minutes: 60,
        platforms: [],
        thumbnail_url: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const [streams, settings] = await Promise.all([
                base44.entities.ScheduledStream.list("-scheduled_start"),
                base44.entities.ChurchSettings.list()
            ]);

            setScheduledStreams(streams);
            if (settings.length > 0) {
                setChurchSettings(settings[0]);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.scheduled_start) {
            alert('Please fill in required fields');
            return;
        }

        try {
            const streamData = {
                ...formData,
                created_by: currentUser.email,
                created_by_name: currentUser.full_name,
                stream_status: 'scheduled'
            };

            if (editingStream) {
                await base44.entities.ScheduledStream.update(editingStream.id, streamData);
            } else {
                await base44.entities.ScheduledStream.create(streamData);
            }

            resetForm();
            loadData();
        } catch (error) {
            console.error("Error saving stream:", error);
            alert("Failed to save stream: " + error.message);
        }
    };

    const handleDelete = async (streamId) => {
        if (!confirm('Delete this scheduled stream?')) return;
        
        try {
            await base44.entities.ScheduledStream.delete(streamId);
            loadData();
        } catch (error) {
            console.error("Error deleting stream:", error);
            alert("Failed to delete stream");
        }
    };

    const handleEdit = (stream) => {
        setEditingStream(stream);
        setFormData({
            title: stream.title,
            description: stream.description || '',
            scheduled_start: stream.scheduled_start,
            scheduled_end: stream.scheduled_end || '',
            duration_minutes: stream.duration_minutes || 60,
            platforms: stream.platforms || [],
            thumbnail_url: stream.thumbnail_url || ''
        });
        setShowForm(true);
    };

    const handleGoLive = async (stream) => {
        if (!confirm('Mark this stream as LIVE?')) return;

        try {
            await base44.entities.ScheduledStream.update(stream.id, {
                stream_status: 'live',
                actual_start_time: new Date().toISOString()
            });

            if (churchSettings) {
                await base44.entities.ChurchSettings.update(churchSettings.id, {
                    stream_status: 'live',
                    last_stream_check: new Date().toISOString()
                });
            }

            loadData();
        } catch (error) {
            console.error("Error updating stream:", error);
            alert("Failed to update stream status");
        }
    };

    const handleEndStream = async (stream) => {
        if (!confirm('End this live stream?')) return;

        try {
            await base44.entities.ScheduledStream.update(stream.id, {
                stream_status: 'ended',
                actual_end_time: new Date().toISOString()
            });

            if (churchSettings) {
                await base44.entities.ChurchSettings.update(churchSettings.id, {
                    stream_status: 'offline',
                    last_stream_check: new Date().toISOString()
                });
            }

            loadData();
        } catch (error) {
            console.error("Error ending stream:", error);
            alert("Failed to end stream");
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            scheduled_start: '',
            scheduled_end: '',
            duration_minutes: 60,
            platforms: [],
            thumbnail_url: ''
        });
        setEditingStream(null);
        setShowForm(false);
    };

    const togglePlatform = (platform) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform]
        }));
    };

    const getAvailablePlatforms = () => {
        const platforms = [];
        if (churchSettings?.youtube_stream_key) platforms.push('youtube');
        if (churchSettings?.facebook_stream_key) platforms.push('facebook');
        if (churchSettings?.restream_enabled) platforms.push('restream');
        return platforms;
    };

    const availablePlatforms = getAvailablePlatforms();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                            <Video className="w-10 h-10 text-red-600" />
                            Stream Scheduler
                        </h1>
                        <p className="text-lg text-slate-600 mt-2">
                            Schedule and manage your live stream broadcasts
                        </p>
                    </div>
                    <Button onClick={() => setShowForm(true)} className="gap-2">
                        <Plus className="w-5 h-5" />
                        Schedule Stream
                    </Button>
                </div>

                {availablePlatforms.length === 0 && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <AlertDescription>
                            <p className="font-semibold text-yellow-900 mb-1">No Streaming Platforms Configured</p>
                            <p className="text-sm text-yellow-800 mb-3">
                                Configure your YouTube, Facebook, or Restream credentials in Settings before scheduling streams
                            </p>
                            <Button
                                onClick={() => window.location.href = createPageUrl('Settings')}
                                size="sm"
                                className="bg-yellow-600 hover:bg-yellow-700"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Go to Settings
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {churchSettings && availablePlatforms.length > 0 && (
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-lg">🔑 Your Stream Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {churchSettings.youtube_stream_key && (
                                    <div className="p-4 bg-white rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Youtube className="w-5 h-5 text-red-600" />
                                            <span className="font-semibold">YouTube</span>
                                            <Badge className="bg-green-100 text-green-800 ml-auto">Configured</Badge>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-1">Server URL:</p>
                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded block truncate">
                                            {churchSettings.youtube_stream_url || 'rtmp://a.rtmp.youtube.com/live2'}
                                        </code>
                                    </div>
                                )}

                                {churchSettings.facebook_stream_key && (
                                    <div className="p-4 bg-white rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Facebook className="w-5 h-5 text-blue-600" />
                                            <span className="font-semibold">Facebook</span>
                                            <Badge className="bg-green-100 text-green-800 ml-auto">Configured</Badge>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-1">Server URL:</p>
                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded block truncate">
                                            {churchSettings.facebook_stream_url || 'rtmps://live-api-s.facebook.com:443/rtmp/'}
                                        </code>
                                    </div>
                                )}

                                {churchSettings.restream_enabled && (
                                    <div className="p-4 bg-white rounded-lg border md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Video className="w-5 h-5 text-purple-600" />
                                            <span className="font-semibold">Restream (Multi-Platform)</span>
                                            <Badge className="bg-green-100 text-green-800 ml-auto">Configured</Badge>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-1">Server URL:</p>
                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded block truncate">
                                            {churchSettings.restream_stream_url || 'rtmp://live.restream.io/live'}
                                        </code>
                                        <p className="text-xs text-purple-700 mt-2">
                                            ✨ Streaming to YouTube + Facebook + other platforms simultaneously
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {showForm && (
                    <Card className="border-2 border-blue-300 shadow-xl">
                        <CardHeader>
                            <CardTitle>{editingStream ? 'Edit' : 'Schedule New'} Live Stream</CardTitle>
                            <CardDescription>Configure your upcoming live broadcast</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Stream Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="Sunday Service - Week 1"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Join us for worship and the Word..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="scheduled_start">Start Date & Time *</Label>
                                        <Input
                                            id="scheduled_start"
                                            type="datetime-local"
                                            value={formData.scheduled_start}
                                            onChange={(e) => setFormData({...formData, scheduled_start: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                                        <Input
                                            id="duration_minutes"
                                            type="number"
                                            value={formData.duration_minutes}
                                            onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                                            placeholder="60"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Streaming Platforms</Label>
                                    <div className="grid md:grid-cols-3 gap-3 mt-2">
                                        {availablePlatforms.includes('youtube') && (
                                            <div
                                                onClick={() => togglePlatform('youtube')}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                    formData.platforms.includes('youtube')
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-slate-200 hover:border-red-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <Youtube className="w-6 h-6 text-red-600" />
                                                    {formData.platforms.includes('youtube') && (
                                                        <Check className="w-5 h-5 text-red-600" />
                                                    )}
                                                </div>
                                                <p className="font-semibold text-sm">YouTube</p>
                                            </div>
                                        )}

                                        {availablePlatforms.includes('facebook') && (
                                            <div
                                                onClick={() => togglePlatform('facebook')}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                    formData.platforms.includes('facebook')
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-slate-200 hover:border-blue-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <Facebook className="w-6 h-6 text-blue-600" />
                                                    {formData.platforms.includes('facebook') && (
                                                        <Check className="w-5 h-5 text-blue-600" />
                                                    )}
                                                </div>
                                                <p className="font-semibold text-sm">Facebook</p>
                                            </div>
                                        )}

                                        {availablePlatforms.includes('restream') && (
                                            <div
                                                onClick={() => togglePlatform('restream')}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                    formData.platforms.includes('restream')
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-slate-200 hover:border-purple-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <Video className="w-6 h-6 text-purple-600" />
                                                    {formData.platforms.includes('restream') && (
                                                        <Check className="w-5 h-5 text-purple-600" />
                                                    )}
                                                </div>
                                                <p className="font-semibold text-sm">Restream</p>
                                                <p className="text-xs text-slate-600">Multi-platform</p>
                                            </div>
                                        )}
                                    </div>
                                    {formData.platforms.includes('restream') && (
                                        <p className="text-sm text-purple-700 mt-2">
                                            ✨ This will stream to all platforms connected to your Restream account
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1">
                                        {editingStream ? 'Update Stream' : 'Schedule Stream'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900">Scheduled & Live Streams</h2>
                    
                    {scheduledStreams.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Radio className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-600 mb-4">No streams scheduled</p>
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Schedule Your First Stream
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        scheduledStreams.map(stream => {
                            const scheduledDate = new Date(stream.scheduled_start);
                            const isLive = stream.stream_status === 'live';
                            const isPast = stream.stream_status === 'ended';
                            const isUpcoming = stream.stream_status === 'scheduled' && scheduledDate > new Date();
                            
                            return (
                                <Card key={stream.id} className={`
                                    ${isLive ? 'border-2 border-red-500 shadow-xl' : ''}
                                    ${isPast ? 'opacity-60' : ''}
                                `}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-slate-900">{stream.title}</h3>
                                                    {isLive && (
                                                        <Badge className="bg-red-500 text-white animate-pulse">
                                                            🔴 LIVE NOW
                                                        </Badge>
                                                    )}
                                                    {isPast && (
                                                        <Badge variant="outline" className="bg-slate-100">
                                                            Ended
                                                        </Badge>
                                                    )}
                                                    {isUpcoming && (
                                                        <Badge className="bg-blue-500">
                                                            Upcoming
                                                        </Badge>
                                                    )}
                                                </div>

                                                <p className="text-slate-600 mb-3">{stream.description}</p>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{format(scheduledDate, 'MMM d, yyyy')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{format(scheduledDate, 'h:mm a')}</span>
                                                    </div>
                                                    {stream.duration_minutes && (
                                                        <div className="flex items-center gap-2">
                                                            <Video className="w-4 h-4" />
                                                            <span>{stream.duration_minutes} min</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {stream.platforms && stream.platforms.length > 0 && (
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="text-sm text-slate-500">Streaming to:</span>
                                                        {stream.platforms.map(platform => (
                                                            <Badge key={platform} variant="outline" className="capitalize">
                                                                {platform === 'youtube' && <Youtube className="w-3 h-3 mr-1" />}
                                                                {platform === 'facebook' && <Facebook className="w-3 h-3 mr-1" />}
                                                                {platform === 'restream' && <Video className="w-3 h-3 mr-1" />}
                                                                {platform}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                {!isPast && (
                                                    <>
                                                        {!isLive && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(stream)}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                    onClick={() => handleGoLive(stream)}
                                                                >
                                                                    <Radio className="w-4 h-4 mr-2" />
                                                                    Go Live
                                                                </Button>
                                                            </>
                                                        )}
                                                        {isLive && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleEndStream(stream)}
                                                            >
                                                                End Stream
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(stream.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                <Card className="bg-slate-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            OBS Studio Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-slate-700">
                            Copy the stream credentials above and configure them in OBS Studio:
                        </p>
                        <ol className="text-sm text-slate-700 list-decimal ml-5 space-y-2">
                            <li>Open OBS Studio</li>
                            <li>Go to Settings → Stream</li>
                            <li>Select "Custom" as the Service</li>
                            <li>Paste the Server URL from your chosen platform</li>
                            <li>Paste the Stream Key (from Settings page)</li>
                            <li>Click "OK" to save</li>
                            <li>Click "Start Streaming" when you're ready to go live</li>
                        </ol>
                        <Button
                            variant="outline"
                            onClick={() => window.open('https://obsproject.com/download', '_blank')}
                            className="w-full"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Download OBS Studio (Free)
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}