import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
    Send, Users, Loader2, FileText, Calendar,
    DollarSign, AlertCircle, CheckCircle, Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMessagingPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [memberGroups, setMemberGroups] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    
    // Message form
    const [subject, setSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [messageType, setMessageType] = useState('general');
    const [priority, setPriority] = useState('normal');
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [sendEmail, setSendEmail] = useState(true);
    const [sendInApp, setSendInApp] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            if (user.role !== 'admin') {
                window.location.href = '/messages';
                return;
            }
            setCurrentUser(user);

            const [groups, members] = await Promise.all([
                base44.entities.MemberGroup.filter({}),
                base44.entities.Member.filter({})
            ]);

            setMemberGroups(groups);
            setAllMembers(members);

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        }
        setIsLoading(false);
    };

    const handleSendMessage = async () => {
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

    const groupOptions = memberGroups.map(g => ({
        value: String(g.id),
        label: g.group_name
    }));

    const memberOptions = allMembers.map(m => ({
        value: String(m.email || ''),
        label: `${m.first_name} ${m.last_name} (${m.email})`
    }));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-slate-900">Admin Messaging Center</h1>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* General Messaging */}
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
                                    <Select value={String(messageType)} onValueChange={setMessageType}>
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
                                    <Select value={String(priority)} onValueChange={setPriority}>
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
                                    value={selectedGroups}
                                    onChange={setSelectedGroups}
                                    placeholder="Select member groups..."
                                />
                            </div>

                            <div>
                                <Label>Select Individual Members</Label>
                                <MultiSelect
                                    options={memberOptions}
                                    value={selectedMembers}
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
                                onClick={handleSendMessage}
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

                    {/* Financial Statements Distribution */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Send Financial Statements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-semibold mb-1">One-Click Statement Distribution</p>
                                        <p>Automatically generate and send personalized giving statements to selected members or groups.</p>
                                    </div>
                                </div>
                            </div>

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
                                    value={selectedGroups}
                                    onChange={setSelectedGroups}
                                    placeholder="Select member groups..."
                                />
                            </div>

                            <div>
                                <Label>Select Individual Members</Label>
                                <MultiSelect
                                    options={memberOptions}
                                    value={selectedMembers}
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

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs text-amber-900">
                                    <strong>Note:</strong> Each recipient will receive their personalized statement with their individual donation totals and details.
                                </p>
                            </div>

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
                </div>

                {/* Quick Stats */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <Card className="shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Members</p>
                                    <p className="text-2xl font-bold text-slate-900">{allMembers.length}</p>
                                </div>
                                <Users className="w-10 h-10 text-blue-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Member Groups</p>
                                    <p className="text-2xl font-bold text-slate-900">{memberGroups.length}</p>
                                </div>
                                <Users className="w-10 h-10 text-green-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Selected Recipients</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {selectedMembers.length + selectedGroups.length}
                                    </p>
                                </div>
                                <CheckCircle className="w-10 h-10 text-purple-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}