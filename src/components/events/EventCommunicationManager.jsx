import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Mail, MessageSquare, Send, Clock, CheckCircle, XCircle, 
    Calendar, Users, Eye, MousePointer, Bell, Sparkles 
} from "lucide-react";
import { format } from "date-fns";

const PLACEHOLDER_HELP = `
Available placeholders:
{attendee_name} - Name of attendee
{event_title} - Event name
{event_date} - Event date
{event_time} - Event time
{event_location} - Event location
{registration_code} - Check-in code
{qr_code_link} - Link to QR code
`;

const MESSAGE_TEMPLATES = {
    registration_confirmation: {
        subject: "Registration Confirmed: {event_title}",
        body: `Hi {attendee_name},

Your registration for {event_title} is confirmed!

📅 When: {event_date} at {event_time}
📍 Where: {event_location}

Your check-in code: {registration_code}

We're excited to see you there!

Blessings,
The Church Team`
    },
    reminder: {
        subject: "Reminder: {event_title} Coming Up!",
        body: `Hi {attendee_name},

This is a friendly reminder about {event_title}.

📅 When: {event_date} at {event_time}
📍 Where: {event_location}

Your check-in code: {registration_code}

See you soon!`
    },
    post_event_thank_you: {
        subject: "Thank You for Attending {event_title}",
        body: `Hi {attendee_name},

Thank you for joining us at {event_title}! We hope you were blessed.

We'd love to hear your feedback. Please take a moment to share your thoughts: [Feedback Link]

Blessings,
The Church Team`
    },
    feedback_request: {
        subject: "Share Your Feedback: {event_title}",
        body: `Hi {attendee_name},

We hope you enjoyed {event_title}!

Your feedback helps us improve. Please share your thoughts:
[Feedback Form Link]

Thank you for your time!`
    }
};

export default function EventCommunicationManager({ event, registrations, onClose }) {
    const [communications, setCommunications] = useState([]);
    const [logs, setLogs] = useState([]);
    const [formData, setFormData] = useState({
        communication_type: "reminder",
        channel: "both",
        subject: "",
        message_body: "",
        schedule_type: "relative",
        scheduled_datetime: "",
        relative_timing: "24_hours_before",
        target_audience: "all_registered",
        is_automated: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState("create");

    useEffect(() => {
        loadData();
    }, [event.id]);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const comms = await base44.entities.EventCommunication.filter({
                event_id: event.id
            }, '-created_date');
            setCommunications(comms);

            const logEntries = await base44.entities.EventCommunicationLog.filter({
                event_id: event.id
            }, '-sent_date');
            setLogs(logEntries);
        } catch (error) {
            console.error("Error loading communications:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-fill template when communication type changes
            if (name === 'communication_type' && MESSAGE_TEMPLATES[value]) {
                newData.subject = MESSAGE_TEMPLATES[value].subject;
                newData.message_body = MESSAGE_TEMPLATES[value].body;
            }

            return newData;
        });
    };

    const handleSaveTemplate = async () => {
        setIsLoading(true);
        try {
            await base44.entities.EventCommunication.create({
                event_id: event.id,
                event_title: event.title,
                ...formData,
                created_by: currentUser.email,
                status: 'draft',
                recipients_count: getRecipientCount()
            });

            alert('Communication template saved!');
            await loadData();
            
            // Reset form
            setFormData({
                communication_type: "reminder",
                channel: "both",
                subject: "",
                message_body: "",
                schedule_type: "relative",
                scheduled_datetime: "",
                relative_timing: "24_hours_before",
                target_audience: "all_registered",
                is_automated: false
            });
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template');
        }
        setIsLoading(false);
    };

    const handleSendNow = async (communication) => {
        if (!confirm(`Send this message to ${getRecipientCount()} recipients now?`)) return;

        setIsLoading(true);
        try {
            const { sendEventCommunication } = await import("@/functions/sendEventCommunication");
            
            const response = await sendEventCommunication({
                communication_id: communication?.id,
                event_id: event.id,
                communication_type: formData.communication_type,
                channel: formData.channel,
                subject: formData.subject,
                message_body: formData.message_body,
                target_audience: formData.target_audience
            });

            if (response.data.success) {
                alert(`Successfully sent to ${response.data.sent_count} recipients!`);
                await loadData();
            }
        } catch (error) {
            console.error('Error sending:', error);
            alert('Failed to send communication');
        }
        setIsLoading(false);
    };

    const handleSchedule = async () => {
        setIsLoading(true);
        try {
            await base44.entities.EventCommunication.create({
                event_id: event.id,
                event_title: event.title,
                ...formData,
                created_by: currentUser.email,
                status: 'scheduled',
                recipients_count: getRecipientCount()
            });

            alert('Communication scheduled!');
            await loadData();
        } catch (error) {
            console.error('Error scheduling:', error);
            alert('Failed to schedule');
        }
        setIsLoading(false);
    };

    const getRecipientCount = () => {
        switch (formData.target_audience) {
            case 'all_registered':
                return registrations.length;
            case 'confirmed_only':
                return registrations.filter(r => r.checked_in).length;
            case 'pending_only':
                return registrations.filter(r => !r.checked_in).length;
            default:
                return registrations.length;
        }
    };

    const insertPlaceholder = (placeholder) => {
        setFormData(prev => ({
            ...prev,
            message_body: prev.message_body + ` {${placeholder}}`
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-semibold">Event Communications</h2>
                        <p className="text-sm text-slate-600">{event.title}</p>
                    </div>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>

                <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="create">Create Message</TabsTrigger>
                            <TabsTrigger value="scheduled">Scheduled ({communications.filter(c => c.status === 'scheduled').length})</TabsTrigger>
                            <TabsTrigger value="sent">Sent History</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="create" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Message Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Communication Type</Label>
                                            <Select value={formData.communication_type} onValueChange={(v) => handleSelectChange('communication_type', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="announcement">📢 Announcement</SelectItem>
                                                    <SelectItem value="registration_confirmation">✅ Registration Confirmation</SelectItem>
                                                    <SelectItem value="reminder">⏰ Reminder</SelectItem>
                                                    <SelectItem value="post_event_thank_you">🙏 Thank You</SelectItem>
                                                    <SelectItem value="feedback_request">📝 Feedback Request</SelectItem>
                                                    <SelectItem value="broadcast">📣 Broadcast</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Send Via</Label>
                                            <Select value={formData.channel} onValueChange={(v) => handleSelectChange('channel', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="email">📧 Email Only</SelectItem>
                                                    <SelectItem value="sms">📱 SMS Only</SelectItem>
                                                    <SelectItem value="both">📧📱 Both</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Target Audience</Label>
                                            <Select value={formData.target_audience} onValueChange={(v) => handleSelectChange('target_audience', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all_registered">All Registered ({registrations.length})</SelectItem>
                                                    <SelectItem value="confirmed_only">Checked In Only</SelectItem>
                                                    <SelectItem value="pending_only">Not Checked In</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Timing</Label>
                                            <Select value={formData.schedule_type} onValueChange={(v) => handleSelectChange('schedule_type', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="immediate">Send Immediately</SelectItem>
                                                    <SelectItem value="relative">Relative to Event</SelectItem>
                                                    <SelectItem value="scheduled">Specific Date/Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {formData.schedule_type === 'relative' && (
                                            <div className="md:col-span-2">
                                                <Label>When to Send</Label>
                                                <Select value={formData.relative_timing} onValueChange={(v) => handleSelectChange('relative_timing', v)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1_hour_before">1 Hour Before Event</SelectItem>
                                                        <SelectItem value="3_hours_before">3 Hours Before Event</SelectItem>
                                                        <SelectItem value="6_hours_before">6 Hours Before Event</SelectItem>
                                                        <SelectItem value="12_hours_before">12 Hours Before Event</SelectItem>
                                                        <SelectItem value="24_hours_before">24 Hours Before Event</SelectItem>
                                                        <SelectItem value="48_hours_before">48 Hours Before Event</SelectItem>
                                                        <SelectItem value="1_week_before">1 Week Before Event</SelectItem>
                                                        <SelectItem value="immediately_after">Immediately After Event</SelectItem>
                                                        <SelectItem value="1_hour_after">1 Hour After Event</SelectItem>
                                                        <SelectItem value="24_hours_after">24 Hours After Event</SelectItem>
                                                        <SelectItem value="1_week_after">1 Week After Event</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {formData.schedule_type === 'scheduled' && (
                                            <div className="md:col-span-2">
                                                <Label>Send Date/Time</Label>
                                                <Input
                                                    type="datetime-local"
                                                    name="scheduled_datetime"
                                                    value={formData.scheduled_datetime}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {(formData.channel === 'email' || formData.channel === 'both') && (
                                        <div>
                                            <Label>Email Subject</Label>
                                            <Input
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="e.g., Reminder: {event_title}"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <Label>Message Body</Label>
                                        <Textarea
                                            name="message_body"
                                            value={formData.message_body}
                                            onChange={handleChange}
                                            rows={8}
                                            placeholder="Type your message..."
                                        />
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder('attendee_name')}>
                                                + Name
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder('event_title')}>
                                                + Event
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder('event_date')}>
                                                + Date
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder('event_time')}>
                                                + Time
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder('event_location')}>
                                                + Location
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Click buttons to insert placeholders</p>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        {formData.schedule_type === 'immediate' ? (
                                            <Button
                                                onClick={() => handleSendNow()}
                                                disabled={isLoading}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Now to {getRecipientCount()} Recipients
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleSchedule}
                                                disabled={isLoading}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Clock className="w-4 h-4 mr-2" />
                                                Schedule Message
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleSaveTemplate}
                                            disabled={isLoading}
                                        >
                                            Save as Draft
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="scheduled">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Scheduled Communications</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {communications.filter(c => c.status === 'scheduled').map(comm => (
                                            <div key={comm.id} className="p-4 border rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge>{comm.communication_type.replace('_', ' ')}</Badge>
                                                            <Badge variant="outline">{comm.channel}</Badge>
                                                        </div>
                                                        <p className="font-semibold">{comm.subject || 'SMS Message'}</p>
                                                        <p className="text-sm text-slate-600 mt-1">{comm.message_body.substring(0, 100)}...</p>
                                                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                                            <span>📤 {comm.recipients_count} recipients</span>
                                                            {comm.scheduled_datetime && (
                                                                <span>📅 {format(new Date(comm.scheduled_datetime), 'MMM d, h:mm a')}</span>
                                                            )}
                                                            {comm.relative_timing && (
                                                                <span>⏰ {comm.relative_timing.replace('_', ' ')}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => handleSendNow(comm)}>
                                                            Send Now
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sent">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Sent Messages</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {communications.filter(c => c.status === 'sent').map(comm => (
                                            <div key={comm.id} className="p-4 border rounded-lg bg-green-50">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <Badge className="bg-green-600">{comm.communication_type.replace('_', ' ')}</Badge>
                                                    <Badge variant="outline">{comm.channel}</Badge>
                                                </div>
                                                <p className="font-semibold">{comm.subject || 'SMS Message'}</p>
                                                <div className="flex gap-4 mt-2 text-xs text-slate-600">
                                                    <span>✅ {comm.sent_count} sent</span>
                                                    {comm.failed_count > 0 && <span>❌ {comm.failed_count} failed</span>}
                                                    <span>📅 {format(new Date(comm.sent_date), 'MMM d, h:mm a')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics">
                            <div className="grid md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-600">Total Sent</p>
                                                <p className="text-2xl font-bold">
                                                    {communications.reduce((sum, c) => sum + (c.sent_count || 0), 0)}
                                                </p>
                                            </div>
                                            <Send className="w-8 h-8 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-600">Open Rate</p>
                                                <p className="text-2xl font-bold">
                                                    {logs.filter(l => l.opened_date).length > 0 
                                                        ? ((logs.filter(l => l.opened_date).length / logs.length) * 100).toFixed(0)
                                                        : 0}%
                                                </p>
                                            </div>
                                            <Eye className="w-8 h-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-600">Click Rate</p>
                                                <p className="text-2xl font-bold">
                                                    {logs.filter(l => l.clicked_date).length > 0
                                                        ? ((logs.filter(l => l.clicked_date).length / logs.length) * 100).toFixed(0)
                                                        : 0}%
                                                </p>
                                            </div>
                                            <MousePointer className="w-8 h-8 text-purple-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}