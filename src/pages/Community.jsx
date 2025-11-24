import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
    PlayCircle, Heart, Search, TrendingUp, Clock, Eye, 
    Church, Share2, Filter, Users, Sparkles
} from "lucide-react";
import { format } from "date-fns";
import SermonPlayerModal from "../components/sermons/SermonPlayerModal";

export default function CommunityPage() {
    const [sermons, setSermons] = useState([]);
    const [filteredSermons, setFilteredSermons] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSermon, setSelectedSermon] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState("all");

    useEffect(() => {
        loadCommunityData();
    }, []);

    useEffect(() => {
        filterSermons();
    }, [searchTerm, selectedTag, sermons]);

    const loadCommunityData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Load all community-shared sermons
            const allSermons = await base44.entities.Sermon.filter({
                is_shared_in_community: true
            }, '-sermon_date');

            setSermons(allSermons);
            setFilteredSermons(allSermons);
        } catch (error) {
            console.error("Error loading community data:", error);
        }
        setIsLoading(false);
    };

    const filterSermons = () => {
        let filtered = sermons;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(s => 
                s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.speaker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.church_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Tag filter
        if (selectedTag !== "all") {
            filtered = filtered.filter(s => 
                s.tags && s.tags.includes(selectedTag)
            );
        }

        setFilteredSermons(filtered);
    };

    const handlePlaySermon = async (sermon) => {
        try {
            // Increment community view count
            const newCommunityViews = (sermon.community_views || 0) + 1;
            await base44.entities.Sermon.update(sermon.id, {
                community_views: newCommunityViews
            });

            // Log community interaction
            await base44.entities.CommunityInteraction.create({
                sermon_id: sermon.id,
                church_id: sermon.church_id,
                viewer_church_id: currentUser.church_id,
                viewer_email: currentUser.email,
                viewer_name: currentUser.full_name,
                interaction_type: 'view',
                interaction_date: new Date().toISOString()
            });

            setSelectedSermon({ ...sermon, community_views: newCommunityViews });
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error tracking view:", error);
            setSelectedSermon(sermon);
            setIsModalOpen(true);
        }
    };

    const handleLike = async (sermon) => {
        try {
            const newLikes = (sermon.community_likes || 0) + 1;
            await base44.entities.Sermon.update(sermon.id, {
                community_likes: newLikes
            });

            await base44.entities.CommunityInteraction.create({
                sermon_id: sermon.id,
                church_id: sermon.church_id,
                viewer_church_id: currentUser.church_id,
                viewer_email: currentUser.email,
                viewer_name: currentUser.full_name,
                interaction_type: 'like',
                interaction_date: new Date().toISOString()
            });

            // Update local state
            setSermons(sermons.map(s => 
                s.id === sermon.id ? { ...s, community_likes: newLikes } : s
            ));
        } catch (error) {
            console.error("Error liking sermon:", error);
        }
    };

    const allTags = [...new Set(sermons.flatMap(s => s.tags || []))].sort();
    const trendingSermons = [...filteredSermons].sort((a, b) => 
        (b.community_views || 0) - (a.community_views || 0)
    ).slice(0, 12);
    const recentSermons = [...filteredSermons].sort((a, b) => 
        new Date(b.sermon_date) - new Date(a.sermon_date)
    ).slice(0, 12);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2">
                        <Users className="w-4 h-4 mr-2 inline" />
                        REACH Connect Community
                    </Badge>
                    <h1 className="text-4xl font-bold text-slate-900">
                        Shared Video Library
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Discover and be inspired by sermons from churches across the REACH Connect community
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-2 border-purple-100">
                        <CardContent className="p-4 text-center">
                            <PlayCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                            <p className="text-2xl font-bold text-slate-900">{sermons.length}</p>
                            <p className="text-sm text-slate-600">Shared Videos</p>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-blue-100">
                        <CardContent className="p-4 text-center">
                            <Church className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                            <p className="text-2xl font-bold text-slate-900">
                                {new Set(sermons.map(s => s.church_id)).size}
                            </p>
                            <p className="text-sm text-slate-600">Contributing Churches</p>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-green-100">
                        <CardContent className="p-4 text-center">
                            <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
                            <p className="text-2xl font-bold text-slate-900">
                                {sermons.reduce((sum, s) => sum + (s.community_views || 0), 0)}
                            </p>
                            <p className="text-sm text-slate-600">Community Views</p>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-pink-100">
                        <CardContent className="p-4 text-center">
                            <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                            <p className="text-2xl font-bold text-slate-900">
                                {sermons.reduce((sum, s) => sum + (s.community_likes || 0), 0)}
                            </p>
                            <p className="text-sm text-slate-600">Total Likes</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card className="border-2 border-slate-200">
                    <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    placeholder="Search sermons, speakers, or churches..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div>
                                <select
                                    value={selectedTag}
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="all">All Topics</option>
                                    {allTags.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Tabs */}
                <Tabs defaultValue="all" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">
                            <Sparkles className="w-4 h-4 mr-2" />
                            All Videos
                        </TabsTrigger>
                        <TabsTrigger value="trending">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Trending
                        </TabsTrigger>
                        <TabsTrigger value="recent">
                            <Clock className="w-4 h-4 mr-2" />
                            Recent
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-6">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                <p className="text-slate-600">Loading community videos...</p>
                            </div>
                        ) : filteredSermons.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredSermons.map(sermon => (
                                    <SermonCard
                                        key={sermon.id}
                                        sermon={sermon}
                                        onPlay={handlePlaySermon}
                                        onLike={handleLike}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        No videos found
                                    </h3>
                                    <p className="text-slate-600">
                                        Try adjusting your search or filters
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="trending">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {trendingSermons.map(sermon => (
                                <SermonCard
                                    key={sermon.id}
                                    sermon={sermon}
                                    onPlay={handlePlaySermon}
                                    onLike={handleLike}
                                    showTrendingBadge
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="recent">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentSermons.map(sermon => (
                                <SermonCard
                                    key={sermon.id}
                                    sermon={sermon}
                                    onPlay={handlePlaySermon}
                                    onLike={handleLike}
                                />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {selectedSermon && (
                <SermonPlayerModal
                    sermon={selectedSermon}
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                />
            )}
        </div>
    );
}

function SermonCard({ sermon, onPlay, onLike, showTrendingBadge }) {
    return (
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
            <AspectRatio ratio={16 / 9}>
                <img
                    src={sermon.thumbnail_url || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=640'}
                    alt={sermon.title}
                    className="object-cover w-full h-full"
                />
                {showTrendingBadge && (
                    <Badge className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                    </Badge>
                )}
            </AspectRatio>
            
            <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Church className="w-4 h-4" />
                        <span className="font-medium">{sermon.church_name || 'Church'}</span>
                    </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{sermon.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-medium">{sermon.speaker}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(sermon.sermon_date), 'MMM d, yyyy')}</span>
                </div>

                {sermon.tags && sermon.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {sermon.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{sermon.community_views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{sermon.community_likes || 0}</span>
                    </div>
                </div>

                {sermon.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                        {sermon.description}
                    </p>
                )}
            </CardContent>

            <CardFooter className="flex gap-2">
                <Button 
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => onPlay(sermon)}
                >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Watch
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onLike(sermon)}
                >
                    <Heart className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}