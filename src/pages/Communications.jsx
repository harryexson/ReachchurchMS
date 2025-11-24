import React, { useState, useEffect } from "react";
import { Announcement } from "@/entities/Announcement";
import { Member } from "@/entities/Member";
import { Event } from "@/entities/Event";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MessageSquare, Calendar, Users, Send, ExternalLink, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import AnnouncementForm from "../components/communications/AnnouncementForm";
import BulkEmailModal from "../components/contacts/BulkEmailModal";
import { createPageUrl } from "@/utils";

export default function CommunicationsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [members, setMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState([]);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [announcementsList, membersList, eventsList] = await Promise.all([
            Announcement.list("-created_date"),
            Member.list(),
            Event.list("-start_datetime")
        ]);
        setAnnouncements(announcementsList);
        setMembers(membersList);
        setEvents(eventsList);
        setIsLoading(false);
    };

    const handleFormSubmit = async (data) => {
        if (selectedAnnouncement) {
            await Announcement.update(selectedAnnouncement.id, data);
        } else {
            await Announcement.create(data);
        }
        await loadData();
        setIsFormOpen(false);
        setSelectedAnnouncement(null);
    };

    const handleEdit = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsFormOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedAnnouncement(null);
        setIsFormOpen(true);
    };

    const handleBroadcastAnnouncement = (announcement) => {
        // Determine recipients based on target audience
        let emails = [];
        if (announcement.target_audience === 'all_members' || announcement.target_audience === 'members_only') {
            emails = members.map(m => m.email).filter(Boolean);
        } else if (announcement.target_audience === 'visitors') {
            emails = members.filter(m => m.member_status === 'visitor').map(m => m.email).filter(Boolean);
        } else if (announcement.target_audience === 'volunteers') {
            emails = members.filter(m => m.ministry_involvement && m.ministry_involvement.length > 0).map(m => m.email).filter(Boolean);
        }

        setEmailRecipients(emails);
        setEmailSubject(announcement.title);
        setEmailBody(announcement.message);
        setIsEmailModalOpen(true);
    };

    const categoryColors = {
        general: "bg-blue-100 text-blue-800",
        urgent: "bg-red-100 text-red-800",
        event: "bg-purple-100 text-purple-800",
        ministry: "bg-green-100 text-green-800",
        prayer_request: "bg-amber-100 text-amber-800",
        celebration: "bg-pink-100 text-pink-800"
    };

    const priorityColors = {
        low: "bg-gray-100 text-gray-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-orange-100 text-orange-800",
        urgent: "bg-red-100 text-red-800"
    };

    const statusColors = {
        draft: "bg-gray-100 text-gray-800",
        published: "bg-green-100 text-green-800",
        archived: "bg-slate-100 text-slate-800"
    };

    const publishedAnnouncements = announcements.filter(a => a.status === 'published');
    const draftAnnouncements = announcements.filter(a => a.status === 'draft');

    const futureEvents = events.filter(event =>
        new Date(event.start_datetime) > new Date() &&
        event.registration_required
    );

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Communications Hub</h1>
                        <p className="text-slate-600 mt-1">Create and manage announcements for your congregation.</p>
                    </div>
                    <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Create Announcement
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Published</p>
                                    <p className="text-2xl font-bold text-slate-900">{publishedAnnouncements.length}</p>
                                </div>
                                <Send className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Drafts</p>
                                    <p className="text-2xl font-bold text-slate-900">{draftAnnouncements.length}</p>
                                </div>
                                <MessageSquare className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Reach</p>
                                    <p className="text-2xl font-bold text-slate-900">{members.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="all" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all">All Announcements</TabsTrigger>
                        <TabsTrigger value="published">Published</TabsTrigger>
                        <TabsTrigger value="drafts">Drafts</TabsTrigger>
                        <TabsTrigger value="events">Upcoming Events</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>All Announcements ({announcements.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Priority</TableHead>
                                                <TableHead>Target Audience</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                Array(5).fill(0).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                        <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : announcements.length > 0 ? (
                                                announcements.map(announcement => (
                                                    <TableRow key={announcement.id}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-semibold">{announcement.title}</div>
                                                                <div className="text-sm text-slate-500 truncate max-w-xs">
                                                                    {announcement.message}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={categoryColors[announcement.category]}>
                                                                {announcement.category?.replace('_', ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={priorityColors[announcement.priority]}>
                                                                {announcement.priority}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="capitalize">
                                                                {announcement.target_audience?.replace('_', ' ')}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={statusColors[announcement.status]}>
                                                                {announcement.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                <span className="text-sm">
                                                                    {format(new Date(announcement.created_date), 'MMM d, yyyy')}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                                                                    Edit
                                                                </Button>
                                                                {announcement.status === 'published' && (
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        onClick={() => handleBroadcastAnnouncement(announcement)}
                                                                        className="bg-blue-50 hover:bg-blue-100"
                                                                    >
                                                                        <Mail className="w-4 h-4 mr-1" />
                                                                        Broadcast
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8">
                                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                        <p className="text-slate-500">No announcements yet</p>
                                                        <p className="text-sm text-slate-400">Create your first announcement to get started</p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="published">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Published Announcements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {publishedAnnouncements.map(announcement => (
                                        <div key={announcement.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                                                <div className="flex gap-2">
                                                    <Badge className={categoryColors[announcement.category]}>
                                                        {announcement.category?.replace('_', ' ')}
                                                    </Badge>
                                                    <Badge className={priorityColors[announcement.priority]}>
                                                        {announcement.priority}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 mb-3">{announcement.message}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span>Target: {announcement.target_audience?.replace('_', ' ')}</span>
                                                <span>Published: {format(new Date(announcement.publish_date || announcement.created_date), 'MMM d, yyyy')}</span>
                                                {announcement.expiry_date && (
                                                    <span>Expires: {format(new Date(announcement.expiry_date), 'MMM d, yyyy')}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {publishedAnnouncements.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">
                                            <Send className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>No published announcements</p>
                                            <p className="text-sm">Published announcements will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="drafts">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Draft Announcements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {draftAnnouncements.map(announcement => (
                                        <div key={announcement.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                                                    Edit Draft
                                                </Button>
                                            </div>
                                            <p className="text-slate-600 mb-3 line-clamp-2">{announcement.message}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <Badge className={categoryColors[announcement.category]}>
                                                    {announcement.category?.replace('_', ' ')}
                                                </Badge>
                                                <span>Created: {format(new Date(announcement.created_date), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {draftAnnouncements.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>No draft announcements</p>
                                            <p className="text-sm">Draft announcements will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="events">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Upcoming Events with Registration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {futureEvents.map(event => (
                                        <div key={event.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-slate-900">{event.title}</h3>
                                                <div className="flex gap-2">
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                        {format(new Date(event.start_datetime), 'MMM d')}
                                                    </Badge>
                                                    {event.registration_limit && (
                                                        <Badge variant="outline">
                                                            Limit: {event.registration_limit}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 mb-3">{event.description}</p>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                                <span>📅 {format(new Date(event.start_datetime), 'EEEE, MMMM d • h:mm a')}</span>
                                                {event.location && <span>📍 {event.location}</span>}
                                                {event.registration_deadline && (
                                                    <span>⏰ Register by {format(new Date(event.registration_deadline), 'MMM d, yyyy')}</span>
                                                )}
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <Button
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => {
                                                        const url = `${window.location.origin}${createPageUrl('EventRegistration')}?eventId=${event.id}`;
                                                        navigator.clipboard.writeText(url);
                                                        alert('Registration link copied to clipboard!');
                                                    }}
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    Copy Registration Link
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {futureEvents.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">
                                            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>No upcoming events with registration</p>
                                            <p className="text-sm">Events requiring registration will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {isFormOpen && (
                    <AnnouncementForm
                        isOpen={isFormOpen}
                        setIsOpen={setIsFormOpen}
                        onSubmit={handleFormSubmit}
                        announcement={selectedAnnouncement}
                    />
                )}

                {isEmailModalOpen && (
                    <BulkEmailModal
                        isOpen={isEmailModalOpen}
                        setIsOpen={setIsEmailModalOpen}
                        recipients={emailRecipients}
                        defaultSubject={emailSubject}
                        defaultBody={emailBody}
                        onSent={loadData}
                    />
                )}
            </div>
        </div>
    );
}