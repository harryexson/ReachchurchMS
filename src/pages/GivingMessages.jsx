import React, { useState, useEffect } from "react";
import { GivingMessage } from "@/entities/GivingMessage";
import { GivingMessageLog } from "@/entities/GivingMessageLog";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, MessageSquare, Heart, TrendingUp, Edit, Save, X, Sparkles } from "lucide-react";

const DEFAULT_TEMPLATES = {
    thank_you: {
        subject: "Thank you for your generous gift!",
        message_body: "Dear {donor_name},\n\nThank you for your generous gift of {amount} to {church_name}! Your support makes a real difference in our ministry and helps us continue serving our community.\n\nYour donation has been received and will be reflected in your year-end giving statement.\n\nWith gratitude,\n{church_name} Team"
    },
    first_time_donor: {
        subject: "Welcome to our giving family!",
        message_body: "Dear {donor_name},\n\nWhat a joy to receive your first gift of {amount}! We're so grateful you've chosen to partner with {church_name} in our mission.\n\nYour generosity will help us reach more people and make a lasting impact in our community.\n\nThank you for taking this step of faith with us!\n\nBlessings,\n{church_name} Team"
    },
    reminder: {
        subject: "Your generosity makes a difference",
        message_body: "Hello {donor_name},\n\nWe hope you're having a blessed week! Just a gentle reminder that your continued support helps {church_name} fulfill our mission.\n\nIf you'd like to give, you can do so easily online at any time.\n\nThank you for being part of our church family!\n\n{church_name}"
    },
    impact_update: {
        subject: "See the impact of your giving!",
        message_body: "Dear {donor_name},\n\nBecause of generous supporters like you, we've been able to:\n\n• Feed 50 families this month\n• Support 3 mission trips\n• Launch a new youth program\n• Provide counseling to 20 individuals\n\nYour partnership is changing lives! Thank you for being part of this incredible journey.\n\nWith appreciation,\n{church_name} Team"
    },
    recurring_thanks: {
        subject: "Thank you for your faithful giving",
        message_body: "Dear {donor_name},\n\nYour recurring gift of {amount} was processed today. Thank you for your faithful and consistent support of {church_name}!\n\nYour commitment allows us to plan and execute our ministry with confidence.\n\nYou are a blessing to this community!\n\n{church_name} Team"
    }
};

export default function GivingMessagesPage() {
    const [messages, setMessages] = useState([]);
    const [logs, setLogs] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const user = await User.me();
        setCurrentUser(user);

        const [messagesList, logsList] = await Promise.all([
            GivingMessage.list("-created_date"),
            GivingMessageLog.list("-sent_date", 50)
        ]);

        setMessages(messagesList);
        setLogs(logsList);
        setIsLoading(false);
    };

    const handleCreateTemplate = (messageType) => {
        const defaultTemplate = DEFAULT_TEMPLATES[messageType];
        setEditingMessage({
            message_type: messageType,
            channel: 'email',
            subject: defaultTemplate.subject,
            message_body: defaultTemplate.message_body,
            send_timing: 'immediate',
            is_active: true
        });
        setIsCreating(true);
    };

    const handleSave = async () => {
        try {
            if (editingMessage.id) {
                await GivingMessage.update(editingMessage.id, editingMessage);
            } else {
                await GivingMessage.create({
                    ...editingMessage,
                    created_by: currentUser.email
                });
            }
            setEditingMessage(null);
            setIsCreating(false);
            await loadData();
        } catch (error) {
            console.error('Failed to save message:', error);
            alert('Failed to save message template');
        }
    };

    const handleCancel = () => {
        setEditingMessage(null);
        setIsCreating(false);
    };

    const getMessageTypeIcon = (type) => {
        switch(type) {
            case 'thank_you': return <Heart className="w-4 h-4 text-pink-500" />;
            case 'first_time_donor': return <Sparkles className="w-4 h-4 text-yellow-500" />;
            case 'reminder': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'impact_update': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'recurring_thanks': return <Heart className="w-4 h-4 text-purple-500" />;
            default: return <Mail className="w-4 h-4" />;
        }
    };

    const getMessageTypeName = (type) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-green-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Giving & Stewardship Messages</h1>
                        <p className="text-slate-600 mt-1">Automated messages to encourage and thank donors</p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">💚 Automated Giving Messages</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                            <Heart className="w-5 h-5 text-pink-500 mb-2" />
                            <strong className="text-green-900">Instant Thank You</strong>
                            <p className="text-slate-600 mt-1">Automatic thank you sent immediately after donation</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                            <MessageSquare className="w-5 h-5 text-blue-500 mb-2" />
                            <strong className="text-green-900">Gentle Reminders</strong>
                            <p className="text-slate-600 mt-1">Scheduled nudges after services to encourage giving</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-green-200">
                            <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                            <strong className="text-green-900">Impact Updates</strong>
                            <p className="text-slate-600 mt-1">Show donors how their gifts are making a difference</p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="templates" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="templates">Message Templates</TabsTrigger>
                        <TabsTrigger value="history">Message History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="templates">
                        {isCreating || editingMessage ? (
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {getMessageTypeIcon(editingMessage.message_type)}
                                        {isCreating ? 'Create' : 'Edit'} {getMessageTypeName(editingMessage.message_type)} Template
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-900 font-semibold mb-2">Available Personalization Tags:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="bg-white">{'{donor_name}'}</Badge>
                                            <Badge variant="outline" className="bg-white">{'{amount}'}</Badge>
                                            <Badge variant="outline" className="bg-white">{'{date}'}</Badge>
                                            <Badge variant="outline" className="bg-white">{'{church_name}'}</Badge>
                                            <Badge variant="outline" className="bg-white">{'{donation_type}'}</Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Delivery Channel</Label>
                                        <Select 
                                            value={editingMessage.channel}
                                            onValueChange={(value) => setEditingMessage({...editingMessage, channel: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="email">Email Only</SelectItem>
                                                <SelectItem value="sms">SMS Only</SelectItem>
                                                <SelectItem value="both">Both Email & SMS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {(editingMessage.channel === 'email' || editingMessage.channel === 'both') && (
                                        <div className="space-y-2">
                                            <Label>Email Subject</Label>
                                            <Input 
                                                value={editingMessage.subject}
                                                onChange={(e) => setEditingMessage({...editingMessage, subject: e.target.value})}
                                                placeholder="Enter email subject..."
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Message Body</Label>
                                        <Textarea 
                                            value={editingMessage.message_body}
                                            onChange={(e) => setEditingMessage({...editingMessage, message_body: e.target.value})}
                                            rows={10}
                                            placeholder="Enter your message..."
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-slate-500">
                                            {editingMessage.message_body.length} characters
                                            {editingMessage.channel === 'sms' && editingMessage.message_body.length > 160 && 
                                                <span className="text-orange-600 ml-2">⚠️ SMS over 160 chars will be split into multiple messages</span>
                                            }
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Send Timing</Label>
                                        <Select 
                                            value={editingMessage.send_timing}
                                            onValueChange={(value) => setEditingMessage({...editingMessage, send_timing: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="immediate">Immediately</SelectItem>
                                                <SelectItem value="1_hour">1 Hour Later</SelectItem>
                                                <SelectItem value="24_hours">24 Hours Later</SelectItem>
                                                <SelectItem value="48_hours">48 Hours Later</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div>
                                            <Label>Active</Label>
                                            <p className="text-sm text-slate-600">Enable this message template</p>
                                        </div>
                                        <Switch 
                                            checked={editingMessage.is_active}
                                            onCheckedChange={(value) => setEditingMessage({...editingMessage, is_active: value})}
                                        />
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                        <Button variant="outline" onClick={handleCancel}>
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Template
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {Object.keys(DEFAULT_TEMPLATES).map(messageType => {
                                    const existing = messages.find(m => m.message_type === messageType);
                                    return (
                                        <Card key={messageType} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="flex items-center gap-2">
                                                        {getMessageTypeIcon(messageType)}
                                                        {getMessageTypeName(messageType)}
                                                    </CardTitle>
                                                    {existing && (
                                                        <Badge className={existing.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                                            {existing.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {existing ? (
                                                    <div className="space-y-3">
                                                        <div className="text-sm">
                                                            <strong>Channel:</strong> {existing.channel}
                                                        </div>
                                                        <div className="text-sm">
                                                            <strong>Timing:</strong> {existing.send_timing.replace('_', ' ')}
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded text-sm">
                                                            {existing.message_body.substring(0, 150)}...
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            onClick={() => setEditingMessage(existing)}
                                                            className="w-full"
                                                        >
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit Template
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-slate-600">
                                                            {DEFAULT_TEMPLATES[messageType].message_body.substring(0, 100)}...
                                                        </p>
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleCreateTemplate(messageType)}
                                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            Create Template
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Recent Messages Sent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {logs.map(log => (
                                        <div key={log.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getMessageTypeIcon(log.message_type)}
                                                    <span className="font-semibold">{log.donor_email}</span>
                                                    <Badge variant="outline">{log.channel}</Badge>
                                                    <Badge className={log.status === 'sent' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                                        {log.status}
                                                    </Badge>
                                                </div>
                                                <span className="text-sm text-slate-500">
                                                    {new Date(log.sent_date).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded text-sm text-slate-700">
                                                {log.message_body.substring(0, 200)}...
                                            </div>
                                            {log.error_message && (
                                                <div className="mt-2 text-sm text-red-600">
                                                    Error: {log.error_message}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {logs.length === 0 && (
                                        <div className="text-center py-12 text-slate-500">
                                            <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                            <p>No messages sent yet</p>
                                            <p className="text-sm">Messages will appear here once donors start giving</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}