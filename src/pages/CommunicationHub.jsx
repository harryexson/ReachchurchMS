import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { useUserOrganization } from '@/components/hooks/useUserOrganization';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Mail, MessageSquare, Monitor, Users, Calendar, Send,
    Plus, Clock, CheckCircle, AlertCircle, Loader2, Target,
    Megaphone, Heart, UserCheck, Filter, Trash2, Edit, Eye,
    DollarSign, FileText
} from "lucide-react";
import TargetedMessageForm from "../components/communications/TargetedMessageForm";
import ScheduledAnnouncementForm from "../components/communications/ScheduledAnnouncementForm";
import MessagePreview from "../components/communications/MessagePreview";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CommunicationHub() {
    const { user, isLoading: orgLoading, userEmail } = useUserOrganization();
    const [messages, setMessages] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [members, setMembers] = useState([]);
    const [memberGroups, setMemberGroups] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [displays, setDisplays] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [previewMessage, setPreviewMessage] = useState(null);
    const [sendingId, setSendingId] = useState(null);
    const [pushingId, setPushingId] = useState(null);
    const [successAlert, setSuccessAlert] = useState(null);

    // Quick message form
    const [subject, setSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [messageType, setMessageType] = useState('general');
    const [priority, setPriority] = useState('normal');
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [sendEmail, setSendEmail] = useState(true);
    const [sendInApp, setSendInApp] = useState(true);

    useEffect(() => {
        if (!orgLoading && user) {
            loadData();
        }
    }, [orgLoading, user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (user.role !== 'admin') {
                window.location.href = '/messages';
                return;
            }

            const [msgList, annList, memberList, groupList, volList, displayList] = await Promise.all([
                base44.entities.TargetedMessage.filter({ created_by: userEmail }, "-created_date"),
                base44.entities.ScheduledAnnouncement.filter({ created_by: userEmail }, "-created_date"),
                base44.entities.Member.filter({ created_by: userEmail }),
                base44.entities.MemberGroup.filter({ created_by: userEmail }),
                base44.entities.Volunteer.filter({ status: "active", created_by: userEmail }),
                base44.entities.ConnectedDevice.filter({ device_type: "display", created_by: userEmail })
            ]);
            
            setMessages(msgList);
            setAnnouncements(annList);
            setMembers(memberList);
            setMemberGroups(groupList);
            setVolunteers(volList);
            setDisplays(displayList);
        } catch (err) {
            console.error("Error loading data:", err);
        }
        setIsLoading(false);
    };

    const handleQuickSendMessage = async () => {
        if (!messageBody.trim()) {
            toast.error('Please enter a message');
            return;
        }

        if (selectedGroups.length === 0 && selectedMembers.length === 0) {
            toast.error('Please select at least one recipient or group');
            return;
        }

        setIsSending(true);
        try {
            await base44.functions.invoke('sendInAppMessage', {
                subject,
                message_body: messageBody,
                recipient_emails: selectedMembers,
                recipient_groups: selectedGroups,
                message_type: messageType,
                priority,
                send_email_notification: sendEmail
            });

            toast.success('Message sent successfully!');
            
            // Reset form
            setSubject('');
            setMessageBody('');
            setSelectedGroups([]);
            setSelectedMembers([]);
            setMessageType('general');
            setPriority('normal');

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
        setIsSending(false);
    };

    const handleSendFinancialStatements = async () => {
        if (selectedGroups.length === 0 && selectedMembers.length === 0) {
            toast.error('Please select recipients');
            return;
        }

        const confirmed = confirm('Send giving statements to selected recipients?');
        if (!confirmed) return;

        setIsSending(true);
        try {
            const result = await base44.functions.invoke('sendFinancialStatementsToGroup', {
                recipient_emails: selectedMembers,
                recipient_groups: selectedGroups,
                statement_period: { year: new Date().getFullYear() },
                statement_type: 'year_end',
                custom_message: messageBody || 'Your year-end giving statement is attached.',
                send_in_app: sendInApp,
                send_email: sendEmail
            });

            toast.success(`Statements sent to ${result.data.statements_sent} recipients!`);
            
            // Reset
            setSelectedGroups([]);
            setSelectedMembers([]);
            setMessageBody('');

        } catch (error) {
            console.error('Error sending statements:', error);
            toast.error('Failed to send statements');
        }
        setIsSending(false);
    };

    const handleSaveMessage = async (data) => {
        try {
            if (editingMessage) {
                await base44.entities.TargetedMessage.update(editingMessage.id, data);
            } else {
                await base44.entities.TargetedMessage.create({
                    ...data,
                    created_by: userEmail
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
                    created_by: userEmail
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
            const recipients = await getRecipients(message);
            
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

            const displayContent = {
                ...contentData,
                created_by: userEmail
            };
            await base44.entities.DisplayContent.create(displayContent);

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

    const groupOptions = memberGroups.map(g => ({
        value: String(g.id),
        label: g.group_name
    }));

    const memberOptions = members.map(m => ({
        value: String(m.email || ''),
        label: `${m.first_name} ${m.last_name} (${m.email})`
    }));

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
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Megaphone className="w-8 h-8 text-blue-600" />
                            Communication Hub
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Send messages, manage announcements, and distribute statements
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Messages</p>
                                    <p className="text-2xl font-bold">{stats.totalMessages}</p>
                                </div>
                                <Mail className="w-8 h-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Sent</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.sentMessages}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Announcements</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.scheduledAnnouncements}</p>
                                </div>
                                <Monitor className="w-8 h-8 text-purple-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Members</p>
                                    <p className="text-2xl font-bold">{members.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Selected</p>
                                    <p className="text-2xl font-bold">{selectedMembers.length + selectedGroups.length}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-purple-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="quick-send">
                    <TabsList className="grid w-full max-w-2xl grid-cols-4">
                        <TabsTrigger value="quick-send">
                            <Send className="w-4 h-4 mr-2" />
                            Quick Send
                        </TabsTrigger>
                        <TabsTrigger value="statements">
                            <FileText className="w-4 h-4 mr-2" />
                            Statements
                        </TabsTrigger>
                        <TabsTrigger value="messages">
                            <Mail className="w-4 h-4 mr-2" />
                            Targeted
                        </TabsTrigger>
                        <TabsTrigger value="announcements">
                            <Monitor className="w-4 h-4 mr-2" />
                            Displays
                        </TabsTrigger>
                    </TabsList>

                    {/* Quick Send Tab */}
                    <TabsContent value="quick-send" className="mt-6">
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="w-5 h-5" />
                                    Send Message / Announcement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <Label>Subject</Label>
                                    <Input
                                        placeholder="Message subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Message</Label>
                                    <Textarea
                                        placeholder="Type your message here..."
                                        value={messageBody}
                                        onChange={(e) => setMessageBody(e.target.value)}
                                        rows={6}
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Message Type</Label>
                                        <Select value={messageType} onValueChange={setMessageType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General</SelectItem>
                                                <SelectItem value="announcement">Announcement</SelectItem>
                                                <SelectItem value="event_reminder">Event Reminder</SelectItem>
                                                <SelectItem value="prayer_request">Prayer Request</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Priority</Label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label>Select Groups</Label>
                                    <MultiSelect
                                        options={groupOptions}
                                        selected={selectedGroups}
                                        onChange={setSelectedGroups}
                                        placeholder="Select member groups..."
                                    />
                                </div>

                                <div>
                                    <Label>Select Individual Members</Label>
                                    <MultiSelect
                                        options={memberOptions}
                                        selected={selectedMembers}
                                        onChange={setSelectedMembers}
                                        placeholder="Select members..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={sendInApp}
                                            onCheckedChange={setSendInApp}
                                            id="send-in-app"
                                        />
                                        <Label htmlFor="send-in-app" className="cursor-pointer">
                                            Send in-app notification
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={sendEmail}
                                            onCheckedChange={setSendEmail}
                                            id="send-email"
                                        />
                                        <Label htmlFor="send-email" className="cursor-pointer">
                                            Send email notification
                                        </Label>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleQuickSendMessage}
                                    disabled={isSending}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Send Message
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Financial Statements Tab */}
                    <TabsContent value="statements" className="mt-6">
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" />
                                    Send Financial Statements
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <Alert className="bg-blue-50 border-blue-200">
                                    <AlertCircle className="w-4 h-4 text-blue-600" />
                                    <AlertDescription className="text-sm text-blue-900">
                                        <p className="font-semibold mb-1">One-Click Statement Distribution</p>
                                        <p>Automatically generate and send personalized giving statements to selected members or groups.</p>
                                    </AlertDescription>
                                </Alert>

                                <div>
                                    <Label>Custom Message (Optional)</Label>
                                    <Textarea
                                        placeholder="Add a personal message to include with the statement..."
                                        value={messageBody}
                                        onChange={(e) => setMessageBody(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                <div>
                                    <Label>Select Groups</Label>
                                    <MultiSelect
                                        options={groupOptions}
                                        selected={selectedGroups}
                                        onChange={setSelectedGroups}
                                        placeholder="Select member groups..."
                                    />
                                </div>

                                <div>
                                    <Label>Select Individual Members</Label>
                                    <MultiSelect
                                        options={memberOptions}
                                        selected={selectedMembers}
                                        onChange={setSelectedMembers}
                                        placeholder="Select members..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={sendInApp}
                                            onCheckedChange={setSendInApp}
                                            id="statements-in-app"
                                        />
                                        <Label htmlFor="statements-in-app" className="cursor-pointer">
                                            Send to in-app messenger
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={sendEmail}
                                            onCheckedChange={setSendEmail}
                                            id="statements-email"
                                        />
                                        <Label htmlFor="statements-email" className="cursor-pointer">
                                            Send via email
                                        </Label>
                                    </div>
                                </div>

                                <Alert className="bg-amber-50 border-amber-200">
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    <AlertDescription className="text-xs text-amber-900">
                                        <strong>Note:</strong> Each recipient will receive their personalized statement with their individual donation totals and details.
                                    </AlertDescription>
                                </Alert>

                                <Button
                                    onClick={handleSendFinancialStatements}
                                    disabled={isSending}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <FileText className="w-4 h-4 mr-2" />
                                    )}
                                    Generate & Send Statements
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Targeted Messages Tab */}
                    <TabsContent value="messages" className="mt-6">
                        <div className="flex justify-end mb-4">
                            <Button
                                onClick={() => { setEditingMessage(null); setShowMessageForm(true); }}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Targeted Message
                            </Button>
                        </div>

                        {messages.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-600 mb-4">No targeted messages yet</p>
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
                                                            Push
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