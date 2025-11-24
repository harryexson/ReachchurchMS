import React, { useState, useEffect } from "react";
import { Sermon } from "@/entities/Sermon";
import { ChurchSettings } from "@/entities/ChurchSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, Search, Share2, Calendar, Eye, Youtube } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SermonPlayerModal from "../components/sermons/SermonPlayerModal";

export default function MemberSermonsPage() {
    const [sermons, setSermons] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSermon, setSelectedSermon] = useState(null);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [liveStreamUrl, setLiveStreamUrl] = useState("");

    useEffect(() => {
        loadSermons();
    }, []);

    const loadSermons = async () => {
        setIsLoading(true);
        try {
            const [sermonsList, settings] = await Promise.all([
                Sermon.list("-sermon_date"),
                ChurchSettings.list()
            ]);
            setSermons(sermonsList);
            if (settings.length > 0 && settings[0].live_stream_url) {
                setLiveStreamUrl(settings[0].live_stream_url);
            }
        } catch (error) {
            console.error("Failed to load sermons:", error);
        }
        setIsLoading(false);
    };

    const filteredSermons = sermons.filter(sermon =>
        sermon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sermon.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sermon.series?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePlaySermon = async (sermon) => {
        setSelectedSermon(sermon);
        setIsPlayerOpen(true);
        
        // Increment view count
        try {
            await Sermon.update(sermon.id, {
                view_count: (sermon.view_count || 0) + 1
            });
        } catch (error) {
            console.error("Failed to update view count:", error);
        }
    };

    const handleShareSermon = (sermon) => {
        const shareUrl = sermon.video_url;
        const shareText = `Check out this sermon: ${sermon.title} by ${sermon.speaker}`;
        
        if (navigator.share) {
            navigator.share({
                title: sermon.title,
                text: shareText,
                url: shareUrl
            }).catch(err => console.log('Error sharing:', err));
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard! Share it on your social media, WhatsApp, or via text/email.');
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Sermon Library</h1>
                    <p className="text-slate-600 mt-1">Watch, learn, and grow in your faith</p>
                </div>

                {/* Live Stream Section */}
                {liveStreamUrl && (
                    <Card className="shadow-lg border-0 bg-gradient-to-r from-red-50 to-pink-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <Youtube className="w-6 h-6" />
                                Live Stream
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe
                                    src={liveStreamUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                        placeholder="Search sermons by title, speaker, or series..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Sermons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array(6).fill(0).map((_, i) => (
                            <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <Skeleton className="aspect-video w-full" />
                                <CardContent className="p-4">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))
                    ) : filteredSermons.length > 0 ? (
                        filteredSermons.map(sermon => (
                            <Card key={sermon.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow group">
                                <div className="relative aspect-video bg-slate-200 overflow-hidden">
                                    {sermon.thumbnail_url ? (
                                        <img 
                                            src={sermon.thumbnail_url} 
                                            alt={sermon.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                            <BookOpen className="w-16 h-16 text-white opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button 
                                            size="lg"
                                            className="bg-white text-slate-900 hover:bg-slate-100"
                                            onClick={() => handlePlaySermon(sermon)}
                                        >
                                            <Play className="w-5 h-5 mr-2" />
                                            Watch Now
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
                                            {sermon.title}
                                        </h3>
                                        <p className="text-sm text-slate-600">{sermon.speaker}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(sermon.sermon_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            <span>{sermon.view_count || 0}</span>
                                        </div>
                                    </div>

                                    {sermon.series && (
                                        <Badge className="bg-purple-100 text-purple-800">
                                            {sermon.series}
                                        </Badge>
                                    )}

                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => handleShareSermon(sermon)}
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">No sermons found</p>
                        </div>
                    )}
                </div>

                {selectedSermon && (
                    <SermonPlayerModal
                        isOpen={isPlayerOpen}
                        setIsOpen={setIsPlayerOpen}
                        sermon={selectedSermon}
                    />
                )}
            </div>
        </div>
    );
}