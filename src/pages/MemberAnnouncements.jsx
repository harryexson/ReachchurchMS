import React, { useState, useEffect } from "react";
import { Announcement } from "@/entities/Announcement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, AlertCircle, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MemberAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setIsLoading(true);
        try {
            // Members can only see published announcements
            const announcementsList = await Announcement.filter({ 
                status: 'published' 
            }, '-publish_date');
            setAnnouncements(announcementsList);
        } catch (error) {
            console.error("Failed to load announcements:", error);
        }
        setIsLoading(false);
    };

    const categoryColors = {
        general: "bg-blue-100 text-blue-800",
        urgent: "bg-red-100 text-red-800",
        event: "bg-purple-100 text-purple-800",
        ministry: "bg-green-100 text-green-800",
        prayer_request: "bg-amber-100 text-amber-800",
        celebration: "bg-pink-100 text-pink-800"
    };

    const priorityIcons = {
        urgent: <AlertCircle className="w-5 h-5 text-red-600" />,
        high: <Megaphone className="w-5 h-5 text-orange-600" />,
        medium: <MessageSquare className="w-5 h-5 text-blue-600" />,
        low: <MessageSquare className="w-5 h-5 text-slate-600" />
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Church Announcements</h1>
                    <p className="text-slate-600 mt-1">Stay informed about what's happening in our church community</p>
                </div>

                <div className="space-y-6">
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                            <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        ))
                    ) : announcements.length > 0 ? (
                        announcements.map(announcement => (
                            <Card key={announcement.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3 flex-1">
                                            {priorityIcons[announcement.priority]}
                                            <div className="flex-1">
                                                <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge className={categoryColors[announcement.category]}>
                                                        {announcement.category.replace('_', ' ')}
                                                    </Badge>
                                                    {announcement.priority === 'urgent' && (
                                                        <Badge className="bg-red-100 text-red-800">
                                                            URGENT
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-slate-700 whitespace-pre-wrap">{announcement.message}</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>Published: {new Date(announcement.publish_date).toLocaleDateString()}</span>
                                        {announcement.expiry_date && (
                                            <span className="ml-4">
                                                Expires: {new Date(announcement.expiry_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="text-center py-12">
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">No announcements at this time</p>
                                <p className="text-sm text-slate-400 mt-2">Check back later for updates</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}