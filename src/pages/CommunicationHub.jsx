import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Mail, MessageSquare, Monitor, Users, Calendar, Send,
    Plus, Clock, CheckCircle, AlertCircle, Loader2, Target,
    Megaphone, Heart, UserCheck, Filter, Trash2, Edit, Eye
} from "lucide-react";
import TargetedMessageForm from "../components/communications/TargetedMessageForm";
import ScheduledAnnouncementForm from "../components/communications/ScheduledAnnouncementForm";
import MessagePreview from "../components/communications/MessagePreview";
import { format } from "date-fns";

export default function CommunicationHub() {
    const [messages, setMessages] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [members, setMembers] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [displays, setDisplays] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [previewMessage, setPreviewMessage] = useState(null);
    const [sendingId, setSendingId] = useState(null);
    const [pushingId, setPushingId] = useState(null);
    const [successAlert, setSuccessAlert] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [user, msgList, annList, memberList, volList, displayList] = await Promise.all([
                base44.auth.me(),
                base44.entities.TargetedMessage.list("-created_date"),
                base44.entities.ScheduledAnnouncement.list("-created_date"),
                base44.entities.Member.list(),
                base44.entities.Volunteer.filter({ status: "active" }),
                base44.entities.ConnectedDevice.filter({ device_type: "display" })
            ]);
            setCurrentUser(user);
            setMessages(msgList);
            setAnnouncements(annList);
            setMembers(memberList);
            setVolunteers(volList);
            setDisplays(displayList);
        } catch (err) {
            console.error("Error loading data:", err);
        }
        setIsLoading(false);
    };

    const handleSaveMessage = async (data) => {
        try {
            if (editingMessage) {
                await base44.entities.TargetedMessage.update(editingMessage.id, data);
            } else {
                await base44.entities.TargetedMessage.create({
                    ...data,
                    created_by: currentUser?.email
                });
            }
            loadData();
            setShowMessageForm(false);
            setEditingMessage(null);
            showSuccess("Message saved successfully");
        } catch (err) {
            console.error("Error saving message:", err);
        }
    };

    const handleSaveAnnouncement = async (data) => {
        try {
            if (editingAnnouncement) {
                await base44.entities.ScheduledAnnouncement.update(editingAnnouncement.id, data);
            } else {
                await base44.entities.ScheduledAnnouncement.create({
                    ...data,
                    created_by: currentUser?.email
                });
            }
            loadData();
            setShowAnnouncementForm(false);
            setEditingAnnouncement(null);
            showSuccess("Announcement saved successfully");
        } catch (err) {
            console.error("Error saving announcement:", err);
        }
    };

    const handleSendMessage = async (message) => {
        setSendingId(message.id);
        try {
            // Get recipients based on criteria
            const recipients = await getRecipients(message);
            
            // Update message status
            await base44.entities.TargetedMessage.update(message.id, {
                status: "sending",
                recipient_count: recipients.length
            });

            let sentCount = 0;
            let failedCount = 0;

            for (const recipient of recipients) {
                try {
                    if (message.channel === "email" || message.channel === "both") {
                        await base44.integrations.Core.SendEmail({
                            to: recipient.email,
                            subject: message.title,
                            body: message.message_body.replace("{name}", recipient.first_name || recipient.member_name || "Friend")
                        });
                    }
                    if ((message.channel === "sms" || message.channel === "both") && recipient.phone) {
                        await base44.integrations.Core.InvokeLLM({
                            prompt: `Send SMS to ${recipient.phone}: ${message.message_body.substring(0, 160)}`
                        });
                    }
                    sentCount++;
                } catch (err) {
                    failedCount++;
                }
            }

            await base44.entities.TargetedMessage.update(message.id, {
                status: "sent",
                sent_date: new Date().toISOString(),
                sent_count: sentCount,
                failed_count: failedCount
            });

            loadData();
            showSuccess(`Message sent to ${sentCount} recipient(s)`);
        } catch (err) {
            console.error("Error sending message:", err);
            await base44.entities.TargetedMessage.update(message.id, { status: "failed" });
        }
        setSendingId(null);
    };

    const getRecipients = async (message) => {
        let recipients = [];
        
        switch (message.target_type) {
            case "all_members":
                recipients = members.filter(m => m.email);
                break;
            case "volunteers":
                if (message.target_criteria?.volunteer_roles?.length) {
                    recipients = volunteers.filter(v => 
                        message.target_criteria.volunteer_roles.includes(v.role) ||
                        message.target_criteria.volunteer_roles.includes(v.ministry)
                    );
                } else {
                    recipients = volunteers;
                }
                break;
            case "donors":
                const donations = await base44.entities.Donation.list();
                const donorEmails = [...new Set(donations.map(d => d.donor_email).filter(Boolean))];
                recipients = donorEmails.map(email => {
                    const member = members.find(m => m.email === email);
                    return member || { email, first_name: donations.find(d => d.donor_email === email)?.donor_name };
                });
                break;
            case "ministry_group":
                if (message.target_criteria?.ministry_areas?.length) {
                    recipients = volunteers.filter(v => 
                        message.target_criteria.ministry_areas.includes(v.ministry)
                    );
                }
                break;
            case "member_status":
                if (message.target_criteria?.member_statuses?.length) {
                    recipients = members.filter(m => 
                        message.target_criteria.member_statuses.includes(m.member_status)
                    );
                }
                break;
            case "custom":
                if (message.target_criteria?.custom_emails?.length) {
                    recipients = message.target_criteria.custom_emails.map(email => ({ email }));
                }
                break;
        }
        
        return recipients.filter(r => r.email);
    };

    const handlePushAnnouncement = async (announcement) => {
        setPushingId(announcement.id);
        try {
            // Create display content from announcement
            const contentData = {
                title: announcement.title,
                content_type: "announcement",
                announcement_text: announcement.message,
                assigned_locations: announcement.display_locations || [],
                background_color: announcement.background_color,
                text_color: announcement.text_color,
                is_active: true,
                priority: announcement.priority === "urgent" ? 3 : announcement.priority === "high" ? 2 : 1,
                created_by: currentUser?.email
            };

            await base44.entities.DisplayContent.create(contentData);

            // Update announcement
            await base44.entities.ScheduledAnnouncement.update(announcement.id, {
                pushed_to_displays: true,
                last_pushed: new Date().toISOString()
            });

            loadData();
            showSuccess("Announcement pushed to displays");
        } catch (err) {
            console.error("Error pushing announcement:", err);
        }
        setPushingId(null);
    };

    const handleDeleteMessage = async (id) => {
        if (!confirm("Delete this message?")) return;
        await base44.entities.TargetedMessage.delete(id);
        loadData();
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!confirm("Delete this announcement?")) return;
        await base44.entities.ScheduledAnnouncement.delete(id);
        loadData();
    };

    const showSuccess = (msg) => {
        setSuccessAlert(msg);
        setTimeout(() => setSuccessAlert(null), 3000);
    };

    const getStatusBadge = (status) => {
        const config = {
            draft: { color: "bg-slate-100 text-slate-700", icon: Edit },
            scheduled: { color: "bg-blue-100 text-blue-700", icon: Clock },
            sending: { color: "bg-yellow-100 text-yellow-700", icon: Loader2 },
            sent: { color: "bg-green-100 text-green-700", icon: CheckCircle },
            failed: { color: "bg-red-100 text-red-700", icon: AlertCircle }
        };
        const { color, icon: Icon } = config[status] || config.draft;
        return (
            <Badge className={color}>
                <Icon className={`w-3 h-3 mr-1 ${status === 'sending' ? 'animate-spin' : ''}`} />
                {status}
            </Badge>
        );
    };

    const stats = {
        totalMessages: messages.length,
        sentMessages: messages.filter(m => m.status === "sent").length,
        scheduledAnnouncements: announcements.filter(a => a.is_active).length,
        totalRecipients: messages.reduce((sum, m) => sum + (m.sent_count || 0), 0)
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Megaphone className="w-8 h-8 text-blue-600" />
                            Communication Hub
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Send targeted messages and manage display announcements
                        </p>
                    </div>
                </div>

                {successAlert && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">{successAlert}</AlertDescription>
                    </Alert>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Messages</p>
                                    <p className="text-2xl font-bold">{stats.totalMessages}</p>
                                </div>
                                <Mail className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Sent Successfully</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.sentMessages}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active Announcements</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.scheduledAnnouncements}</p>
                                </div>
                                <Monitor className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Reached</p>
                                    <p className="text-2xl font-bold text-orange-600">{stats.totalRecipients}</p>
                                </div>
                                <Users className="w-8 h-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="messages">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="messages">
                            <Mail className="w-4 h-4 mr-2" />
                            Targeted Messages
                        </TabsTrigger>
                        <TabsTrigger value="announcements">
                            <Monitor className="w-4 h-4 mr-2" />
                            Display Announcements
                        </TabsTrigger>
                    </TabsList>

                    {/* Targeted Messages Tab */}
                    <TabsContent value="messages" className="mt-6">
                        <div className="flex justify-end mb-4">
                            <Button
                                onClick={() => { setEditingMessage(null); setShowMessageForm(true); }}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Message
                            </Button>
                        </div>

                        {messages.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-600 mb-4">No messages yet</p>
                                    <Button onClick={() => setShowMessageForm(true)}>
                                        Create Your First Message
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {messages.map(msg => (
                                    <Card key={msg.id} className="hover:shadow-md transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-lg">{msg.title}</h3>
                                                        {getStatusBadge(msg.status)}
                                                        <Badge variant="outline">
                                                            {msg.channel === "both" ? "Email + SMS" : msg.channel?.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                                                        {msg.message_body}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Target className="w-4 h-4" />
                                                            {msg.target_type?.replace("_", " ")}
                                                        </span>
                                                        {msg.sent_count > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                {msg.sent_count} sent
                                                            </span>
                                                        )}
                                                        {msg.sent_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {format(new Date(msg.sent_date), "MMM d, h:mm a")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setPreviewMessage(msg)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    {msg.status === "draft" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSendMessage(msg)}
                                                                disabled={sendingId === msg.id}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                {sendingId === msg.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Send className="w-4 h-4 mr-1" />
                                                                        Send
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => { setEditingMessage(msg); setShowMessageForm(true); }}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Display Announcements Tab */}
                    <TabsContent value="announcements" className="mt-6">
                        <div className="flex justify-end mb-4">
                            <Button
                                onClick={() => { setEditingAnnouncement(null); setShowAnnouncementForm(true); }}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Announcement
                            </Button>
                        </div>

                        {announcements.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Monitor className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-600 mb-4">No announcements yet</p>
                                    <Button onClick={() => setShowAnnouncementForm(true)}>
                                        Create Your First Announcement
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {announcements.map(ann => (
                                    <Card key={ann.id} className={`hover:shadow-md transition-all ${!ann.is_active ? 'opacity-60' : ''}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-semibold">{ann.title}</h3>
                                                <Badge className={
                                                    ann.priority === "urgent" ? "bg-red-100 text-red-700" :
                                                    ann.priority === "high" ? "bg-orange-100 text-orange-700" :
                                                    "bg-slate-100 text-slate-700"
                                                }>
                                                    {ann.priority}
                                                </Badge>
                                            </div>
                                            
                                            {/* Preview */}
                                            <div 
                                                className="p-3 rounded-lg mb-3 text-center"
                                                style={{ 
                                                    backgroundColor: ann.background_color || "#1e3a8a",
                                                    color: ann.text_color || "#ffffff"
                                                }}
                                            >
                                                <p className="text-sm line-clamp-2">{ann.message}</p>
                                            </div>

                                            <div className="text-xs text-slate-500 space-y-1 mb-3">
                                                <p className="flex items-center gap-1">
                                                    <Monitor className="w-3 h-3" />
                                                    {ann.display_locations?.length || 0} location(s)
                                                </p>
                                                {ann.start_datetime && (
                                                    <p className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(ann.start_datetime), "MMM d")} - 
                                                        {ann.end_datetime ? format(new Date(ann.end_datetime), " MMM d") : " No end"}
                                                    </p>
                                                )}
                                                {ann.pushed_to_displays && (
                                                    <p className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Pushed {ann.last_pushed ? format(new Date(ann.last_pushed), "MMM d, h:mm a") : ""}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePushAnnouncement(ann)}
                                                    disabled={pushingId === ann.id}
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    {pushingId === ann.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Send className="w-4 h-4 mr-1" />
                                                            Push to Displays
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => { setEditingAnnouncement(ann); setShowAnnouncementForm(true); }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeleteAnnouncement(ann.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Forms */}
                {showMessageForm && (
                    <TargetedMessageForm
                        isOpen={showMessageForm}
                        onClose={() => { setShowMessageForm(false); setEditingMessage(null); }}
                        onSave={handleSaveMessage}
                        message={editingMessage}
                        members={members}
                        volunteers={volunteers}
                    />
                )}

                {showAnnouncementForm && (
                    <ScheduledAnnouncementForm
                        isOpen={showAnnouncementForm}
                        onClose={() => { setShowAnnouncementForm(false); setEditingAnnouncement(null); }}
                        onSave={handleSaveAnnouncement}
                        announcement={editingAnnouncement}
                    />
                )}

                {previewMessage && (
                    <MessagePreview
                        message={previewMessage}
                        onClose={() => setPreviewMessage(null)}
                    />
                )}
            </div>
        </div>
    );
}