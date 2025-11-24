import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Users, User, Send, Loader2, CheckCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { MultiSelect } from '@/components/ui/MultiSelect';

export default function ReportDistributionModal({ isOpen, setIsOpen, reportBlob, reportName, reportType }) {
    const [activeTab, setActiveTab] = useState('groups');
    const [groups, setGroups] = useState([]);
    const [members, setMembers] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [customEmails, setCustomEmails] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadData();
            setDefaultMessage();
        }
    }, [isOpen, reportType]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [groupsList, membersList] = await Promise.all([
                base44.entities.ContactGroup.list(),
                base44.entities.Member.filter({ member_status: 'member' })
            ]);
            setGroups(groupsList);
            setMembers(membersList);
        } catch (error) {
            console.error('Error loading data:', error);
        }
        setIsLoading(false);
    };

    const setDefaultMessage = () => {
        const reportTitle = getReportTitle();
        setSubject(`${reportTitle} - ${new Date().toLocaleDateString()}`);
        setMessage(`Dear Member,

Please find attached the ${reportTitle} for your review.

This report contains important information about our church activities and is being shared to keep you informed and engaged.

If you have any questions or need clarification on any information in this report, please don't hesitate to reach out.

Blessings,
Church Administration Team`);
    };

    const getReportTitle = () => {
        switch (reportType) {
            case 'financial': return 'Financial Report';
            case 'members': return 'Member Directory';
            case 'giving': return 'Giving Report';
            case 'events': return 'Event Attendance Report';
            default: return 'Report';
        }
    };

    const getSelectedEmails = () => {
        const emails = new Set();

        // Add emails from selected groups
        selectedGroups.forEach(groupId => {
            const group = groups.find(g => g.id === groupId);
            if (group && group.member_emails) {
                group.member_emails.forEach(email => emails.add(email));
            }
        });

        // Add individually selected member emails
        selectedMembers.forEach(memberId => {
            const member = members.find(m => m.id === memberId);
            if (member && member.email) {
                emails.add(member.email);
            }
        });

        // Add custom emails
        if (customEmails) {
            const customEmailList = customEmails
                .split(/[,;\n]/)
                .map(e => e.trim())
                .filter(e => e && e.includes('@'));
            customEmailList.forEach(email => emails.add(email));
        }

        return Array.from(emails);
    };

    const handleSend = async () => {
        const recipients = getSelectedEmails();
        
        if (recipients.length === 0) {
            alert('Please select at least one recipient');
            return;
        }

        if (!subject || !message) {
            alert('Please enter subject and message');
            return;
        }

        setIsSending(true);
        setSendResult(null);

        try {
            const user = await base44.auth.me();

            // Upload report to get a URL
            const formData = new FormData();
            formData.append('file', reportBlob, reportName);
            
            const uploadResponse = await base44.integrations.Core.UploadFile({
                file: reportBlob
            });

            const reportUrl = uploadResponse.file_url;

            // Send emails with attachment link
            const response = await base44.functions.invoke('sendReportDistribution', {
                recipients: recipients,
                subject: subject,
                message: message,
                reportUrl: reportUrl,
                reportName: reportName,
                from_name: user.church_name || user.full_name
            });

            if (response.data.success) {
                setSendResult({
                    success: true,
                    sent: response.data.sent,
                    failed: response.data.failed
                });

                // Record in bulk messages
                await base44.entities.BulkMessage.create({
                    subject: subject,
                    message_body: message,
                    sent_to_count: recipients.length,
                    sent_by: user.email,
                    sent_by_name: user.full_name,
                    send_date: new Date().toISOString(),
                    status: 'sent',
                    success_count: response.data.sent,
                    failed_count: response.data.failed,
                    message_type: 'custom'
                });

                setTimeout(() => {
                    setIsOpen(false);
                    resetForm();
                }, 3000);
            } else {
                setSendResult({
                    success: false,
                    error: response.data.error || 'Failed to send report'
                });
            }
        } catch (error) {
            console.error('Distribution error:', error);
            setSendResult({
                success: false,
                error: error.message || 'Failed to distribute report'
            });
        }

        setIsSending(false);
    };

    const resetForm = () => {
        setSelectedGroups([]);
        setSelectedMembers([]);
        setCustomEmails('');
        setSubject('');
        setMessage('');
        setSendResult(null);
    };

    const groupOptions = groups.map(g => ({
        value: g.id,
        label: `${g.group_name} (${g.member_count || 0} members)`
    }));

    const memberOptions = members.map(m => ({
        value: m.id,
        label: `${m.first_name} ${m.last_name} (${m.email})`
    }));

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Distribute Report via Email</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Report Info */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="font-semibold text-blue-900">Report: {reportName}</p>
                                    <p className="text-sm text-blue-700">{getReportTitle()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recipient Selection */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="groups">
                                    <Users className="w-4 h-4 mr-2" />
                                    Groups
                                </TabsTrigger>
                                <TabsTrigger value="individual">
                                    <User className="w-4 h-4 mr-2" />
                                    Individual
                                </TabsTrigger>
                                <TabsTrigger value="custom">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Custom
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="groups" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select Contact Groups</Label>
                                    <MultiSelect
                                        options={groupOptions}
                                        selected={selectedGroups}
                                        onChange={setSelectedGroups}
                                        placeholder="Select groups to send to..."
                                    />
                                    <p className="text-xs text-slate-500">
                                        Select multiple groups to send this report to all their members
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="individual" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select Individual Members</Label>
                                    <MultiSelect
                                        options={memberOptions}
                                        selected={selectedMembers}
                                        onChange={setSelectedMembers}
                                        placeholder="Select individual members..."
                                    />
                                    <p className="text-xs text-slate-500">
                                        Search and select specific members to receive this report
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="custom" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Custom Email Addresses</Label>
                                    <Textarea
                                        value={customEmails}
                                        onChange={(e) => setCustomEmails(e.target.value)}
                                        placeholder="Enter email addresses (comma, semicolon, or new line separated)&#10;&#10;example@church.org, member@email.com&#10;another@email.org"
                                        rows={6}
                                    />
                                    <p className="text-xs text-slate-500">
                                        Add custom email addresses not in your directory
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Selected Recipients Summary */}
                        {getSelectedEmails().length > 0 && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-green-900">
                                        Selected Recipients: {getSelectedEmails().length}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedGroups([]);
                                            setSelectedMembers([]);
                                            setCustomEmails('');
                                        }}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Clear All
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                    {getSelectedEmails().slice(0, 20).map((email, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                            {email}
                                        </Badge>
                                    ))}
                                    {getSelectedEmails().length > 20 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{getSelectedEmails().length - 20} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Email Content */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Email Subject</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Enter email subject..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Email Message</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={8}
                                    placeholder="Enter your message..."
                                />
                                <p className="text-xs text-slate-500">
                                    The report will be attached as a downloadable link in the email
                                </p>
                            </div>
                        </div>

                        {/* Send Result */}
                        {sendResult && (
                            <div className={`p-4 rounded-lg border ${
                                sendResult.success 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-red-50 border-red-200'
                            }`}>
                                <div className="flex items-center gap-2">
                                    {sendResult.success ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <div>
                                                <span className="font-medium text-green-900">Report Distributed Successfully!</span>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Sent to {sendResult.sent} recipients
                                                    {sendResult.failed > 0 && ` | ${sendResult.failed} failed`}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <X className="w-5 h-5 text-red-600" />
                                            <div>
                                                <span className="font-medium text-red-900">Distribution Failed</span>
                                                <p className="text-sm text-red-700 mt-1">{sendResult.error}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending || getSelectedEmails().length === 0 || !subject || !message}
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Send to {getSelectedEmails().length} Recipient{getSelectedEmails().length !== 1 ? 's' : ''}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}