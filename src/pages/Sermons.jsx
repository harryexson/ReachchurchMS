
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlayCircle, Calendar, User, Search, Eye, Settings, Share2, Users, Plus, Radio, Video, Clock } from "lucide-react";
import SermonPlayerModal from "../components/sermons/SermonPlayerModal";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function SermonsPage() {
    const [sermons, setSermons] = useState([]);
    const [churchSettings, setChurchSettings] = useState(null);
    const [scheduledStreams, setScheduledStreams] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSermon, setSelectedSermon] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [communitySharing, setCommunitySharing] = useState(false);
    const [streamStatus, setStreamStatus] = useState('offline');

    useEffect(() => {
        loadData();
        // Check stream status every 30 seconds
        const statusInterval = setInterval(checkStreamStatus, 30000);
        return () => clearInterval(statusInterval);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const [sermonList, settingsList, streamsList] = await Promise.all([
                base44.entities.Sermon.list("-sermon_date"),
                base44.entities.ChurchSettings.list(),
                base44.entities.ScheduledStream.filter({ stream_status: ["scheduled", "live"] })
            ]);
            
            setSermons(sermonList);
            setScheduledStreams(streamsList.sort((a, b) => 
                new Date(a.scheduled_start) - new Date(b.scheduled_start)
            ));
            
            if (settingsList.length > 0) {
                setChurchSettings(settingsList[0]);
                setCommunitySharing(settingsList[0].enable_community_sharing || false);
                setStreamStatus(settingsList[0].stream_status || 'offline');
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setIsLoading(false);
    };

    const checkStreamStatus = async () => {
        if (!churchSettings) return;
        
        // Update last check time
        try {
            await base44.entities.ChurchSettings.update(churchSettings.id, {
                last_stream_check: new Date().toISOString()
            });
        } catch (error) {
            console.error("Failed to update stream check:", error);
        }
    };

    const handlePlaySermon = async (sermon) => {
        const newViewCount = (sermon.view_count || 0) + 1;
        
        setSermons(sermons.map(s => s.id === sermon.id ? { ...s, view_count: newViewCount } : s));
        setSelectedSermon({ ...sermon, view_count: newViewCount });
        setIsModalOpen(true);
        
        try {
            await base44.entities.Sermon.update(sermon.id, { view_count: newViewCount });
        } catch (error) {
            console.error("Failed to update view count:", error);
        }
    };

    const handleDeleteSermon = (sermonId) => {
        setSermons(sermons.filter(s => s.id !== sermonId));
        setIsModalOpen(false);
    };

    const handleToggleCommunitySharing = async (sermonId, currentStatus) => {
        try {
            await base44.entities.Sermon.update(sermonId, {
                is_shared_in_community: !currentStatus,
                church_id: currentUser.church_id,
                church_name: churchSettings?.church_name || currentUser.church_name || 'My Church'
            });
            
            setSermons(sermons.map(s => 
                s.id === sermonId ? { ...s, is_shared_in_community: !currentStatus } : s
            ));
        } catch (error) {
            console.error("Failed to toggle sharing:", error);
            alert("Failed to update sharing settings");
        }
    };

    const handleGlobalSharingToggle = async (enabled) => {
        try {
            if (churchSettings) {
                await base44.entities.ChurchSettings.update(churchSettings.id, {
                    enable_community_sharing: enabled
                });
            } else {
                await base44.entities.ChurchSettings.create({
                    church_name: currentUser.church_name || 'My Church',
                    enable_community_sharing: enabled
                });
            }
            setCommunitySharing(enabled);
        } catch (error) {
            console.error("Failed to update sharing settings:", error);
        }
    };

    const liveStreamUrl = churchSettings?.live_stream_url || "";

    // Check if user can manage sermons
    const canManageSermons = currentUser && (
        currentUser.role === 'admin' ||
        currentUser.access_level === 'pastor' ||
        currentUser.access_level === 'leader' ||
        currentUser.permissions?.can_manage_content
    );

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Livestream & Sermons</h1>
                        <p className="text-slate-600 mt-1">Watch live services and catch up on past messages.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to={createPageUrl("Community")}>
                            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                                <Users className="w-5 h-5 mr-2" />
                                Community Library
                            </Button>
                        </Link>
                        {canManageSermons && (
                            <>
                                <Link to={createPageUrl("Settings")}>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <Video className="w-4 h-4" />
                                        Streaming Setup
                                    </Button>
                                </Link>
                                <Link to={createPageUrl("Settings")}>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Configure
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Community Sharing Settings */}
                {canManageSermons && (
                    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-purple-600" />
                                Community Sharing Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                                <div>
                                    <Label className="text-base font-semibold">Enable Community Sharing</Label>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Share your sermons with other REACH Connect churches
                                    </p>
                                </div>
                                <Switch
                                    checked={communitySharing}
                                    onCheckedChange={handleGlobalSharingToggle}
                                />
                            </div>
                            {communitySharing && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        ✨ Community sharing is enabled! You can now toggle individual sermons to share with the community.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Upcoming Scheduled Streams */}
                {scheduledStreams.length > 0 && (
                    <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-600" />
                                Upcoming Streams
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {scheduledStreams.slice(0, 3).map(stream => {
                                    const isLive = stream.stream_status === 'live';
                                    const scheduledDate = new Date(stream.scheduled_start);
                                    const now = new Date();
                                    const isToday = scheduledDate.toDateString() === now.toDateString();
                                    const hoursUntil = Math.round((scheduledDate - now) / (1000 * 60 * 60));
                                    
                                    return (
                                        <div key={stream.id} className="p-4 bg-white rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-slate-900">{stream.title}</h3>
                                                        {isLive && (
                                                            <Badge className="bg-red-500 text-white animate-pulse">
                                                                🔴 LIVE NOW
                                                            </Badge>
                                                        )}
                                                        {!isLive && isToday && hoursUntil < 12 && (
                                                            <Badge className="bg-yellow-500 text-white">
                                                                📅 Today
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">{stream.description}</p>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{format(scheduledDate, 'MMM d, h:mm a')}</span>
                                                        </div>
                                                        {stream.platforms && stream.platforms.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Video className="w-4 h-4" />
                                                                <span>{stream.platforms.join(', ')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Live Stream Section with Status Indicator */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                    streamStatus === 'live' ? 'bg-red-600 animate-pulse' :
                                    streamStatus === 'scheduled' ? 'bg-yellow-500' :
                                    'bg-slate-300'
                                }`} />
                                {streamStatus === 'live' ? (
                                    <span className="text-red-600">LIVE STREAM</span>
                                ) : streamStatus === 'scheduled' ? (
                                    <span className="text-yellow-600">STREAM SCHEDULED</span>
                                ) : (
                                    <span className="text-slate-600">LIVE STREAM</span>
                                )}
                            </CardTitle>
                            {canManageSermons && (
                                <Link to={createPageUrl("Settings")}>
                                    <Button variant="outline" size="sm">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Configure Stream
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {liveStreamUrl ? (
                            <AspectRatio ratio={16 / 9}>
                                <iframe
                                    src={liveStreamUrl}
                                    title="Live Stream"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                    allowFullScreen
                                    className="w-full h-full rounded-lg"
                                ></iframe>
                            </AspectRatio>
                        ) : (
                            <div className="bg-slate-100 rounded-lg p-12 text-center">
                                <Radio className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                                    No Live Stream Configured
                                </h3>
                                <p className="text-slate-600 mb-4">
                                    Connect your YouTube, Facebook, or Restream account to broadcast services
                                </p>
                                {canManageSermons && (
                                    <Link to={createPageUrl("Settings")}>
                                        <Button>
                                            <Settings className="w-4 h-4 mr-2" />
                                            Setup Live Streaming
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                        
                        {/* Multi-Platform Indicator */}
                        {churchSettings?.restream_enabled && (
                            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-purple-800">
                                    <Video className="w-4 h-4" />
                                    <span className="font-semibold">Streaming to multiple platforms via Restream</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sermon Archive Section */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Sermon Archive</CardTitle>
                        {churchSettings && (
                            <div className="text-sm text-slate-500">
                                {churchSettings.last_sync_date && (
                                    <span>Last synced: {new Date(churchSettings.last_sync_date).toLocaleDateString()}</span>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-40 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                ))
                            ) : sermons.length > 0 ? (
                                sermons.map(sermon => (
                                    <Card key={sermon.id} className="overflow-hidden flex flex-col">
                                        <AspectRatio ratio={16 / 9}>
                                            <img
                                                src={sermon.thumbnail_url || 'https://images.unsplash.com/photo-1594799099951-58c739b6b785?w=640'}
                                                alt={sermon.title}
                                                className="object-cover w-full h-full"
                                            />
                                        </AspectRatio>
                                        <CardHeader className="flex-grow">
                                            <CardTitle className="text-lg">{sermon.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm text-slate-600 flex-grow space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span>{sermon.speaker}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(sermon.sermon_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500">
                                                    <Eye className="w-4 h-4" />
                                                    <span>{sermon.view_count || 0}</span>
                                                </div>
                                            </div>
                                            {sermon.series && (
                                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                    {sermon.series}
                                                </div>
                                            )}
                                            {canManageSermons && communitySharing && (
                                                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                                                    <div className="flex items-center gap-2">
                                                        <Share2 className="w-4 h-4 text-purple-600" />
                                                        <span className="text-xs font-medium">Community</span>
                                                    </div>
                                                    <Switch
                                                        checked={sermon.is_shared_in_community || false}
                                                        onCheckedChange={() => handleToggleCommunitySharing(sermon.id, sermon.is_shared_in_community)}
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" onClick={() => handlePlaySermon(sermon)}>
                                                <PlayCircle className="w-5 h-5 mr-2" />
                                                Watch Now
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 text-slate-500">
                                    <PlayCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <h3 className="text-lg font-semibold mb-2">No Sermons Yet</h3>
                                    <p className="mb-4">Connect your YouTube or Facebook channels to automatically sync sermons.</p>
                                    {canManageSermons && (
                                        <Link to={createPageUrl("Settings")}>
                                            <Button>
                                                <Settings className="w-4 h-4 mr-2" />
                                                Set Up Integration
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedSermon && (
                <SermonPlayerModal
                    sermon={selectedSermon}
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    onDelete={handleDeleteSermon}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}
