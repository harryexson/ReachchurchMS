
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Plus, X, Loader2, CheckCircle, Send } from "lucide-react";
import { format } from "date-fns";

export default function MeetingInviteModal({ isOpen, setIsOpen, meeting, onInvitesSent }) {
    const [inviteMethod, setInviteMethod] = useState("email");
    const [recipients, setRecipients] = useState([]);
    const [currentRecipient, setCurrentRecipient] = useState("");
    const [customMessage, setCustomMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);

    const defaultEmailMessage = `You're invited to join our video meeting!

Meeting: ${meeting?.title}
Date: ${meeting?.scheduled_time ? format(new Date(meeting.scheduled_time), 'MMMM d, yyyy') : 'TBD'}
Time: ${meeting?.scheduled_time ? format(new Date(meeting.scheduled_time), 'h:mm a') : 'TBD'}

${meeting?.description || ''}

Click the link below to join:
${meeting?.room_url}

Meeting ID: ${meeting?.meeting_id}
${meeting?.meeting_password ? `Password: ${meeting.meeting_password}` : ''}

Looking forward to seeing you there!`;

    const defaultSMSMessage = `You're invited! ${meeting?.title} on ${meeting?.scheduled_time ? format(new Date(meeting.scheduled_time), 'MMM d @ h:mm a') : 'TBD'}. Join: ${meeting?.room_url}`;

    const addRecipient = () => {
        if (currentRecipient.trim()) {
            const isValid = inviteMethod === "email" 
                ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentRecipient)
                : /^\+?[1-9]\d{9,14}$/.test(currentRecipient.replace(/[\s-()]/g, '')); // Updated regex for phone number validation

            if (isValid && !recipients.includes(currentRecipient.trim())) {
                setRecipients([...recipients, currentRecipient.trim()]);
                setCurrentRecipient("");
            } else if (!isValid) {
                alert(`Please enter a valid ${inviteMethod === "email" ? "email address" : "phone number (with country code, e.g., +15551234567)"}`); // Updated alert message
            }
        }
    };

    const removeRecipient = (recipient) => {
        setRecipients(recipients.filter(r => r !== recipient));
    };

    const handleSendInvites = async () => {
        if (recipients.length === 0) {
            alert("Please add at least one recipient");
            return;
        }

        setIsSending(true);
        setSendResult(null);

        try {
            const { sendMeetingInvites } = await import("@/functions/sendMeetingInvites");
            
            const response = await sendMeetingInvites({
                meeting_id: meeting.id,
                meeting_title: meeting.title,
                meeting_url: meeting.room_url,
                meeting_id_code: meeting.meeting_id,
                meeting_password: meeting.meeting_password,
                scheduled_time: meeting.scheduled_time,
                description: meeting.description,
                method: inviteMethod,
                recipients: recipients,
                custom_message: customMessage || (inviteMethod === "email" ? defaultEmailMessage : defaultSMSMessage)
            });

            console.log('Full response from sendMeetingInvites:', response);

            if (response.data.success) {
                setSendResult({ success: true, data: response.data });
                
                if (onInvitesSent) {
                    await onInvitesSent();
                }

                setTimeout(() => {
                    setIsOpen(false);
                    setRecipients([]);
                    setCustomMessage("");
                    setSendResult(null);
                }, 2000);

            } else {
                setSendResult({ 
                    success: false, 
                    error: response.data.error || 'Unknown error',
                    details: response.data.details || response.data.message || JSON.stringify(response.data)
                });
            }

        } catch (error) {
            console.error("Full error object:", error);
            console.error("Error response:", error.response);
            
            let errorMessage = 'Failed to send invitations';
            let errorDetails = '';
            
            if (error.response?.data) {
                errorMessage = error.response.data.error || errorMessage;
                errorDetails = error.response.data.details || error.response.data.message || '';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setSendResult({ 
                success: false, 
                error: errorMessage,
                details: errorDetails || error.toString()
            });
        }

        setIsSending(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addRecipient();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite People to Meeting</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900">{meeting?.title}</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            {meeting?.scheduled_time && format(new Date(meeting.scheduled_time), 'MMMM d, yyyy • h:mm a')}
                        </p>
                    </div>

                    <Tabs value={inviteMethod} onValueChange={setInviteMethod}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="email">
                                <Mail className="w-4 h-4 mr-2" />
                                Email Invites
                            </TabsTrigger>
                            <TabsTrigger value="sms">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                SMS Invites
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="email" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-recipient">Email Addresses</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="email-recipient"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={currentRecipient}
                                        onChange={(e) => setCurrentRecipient(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                    <Button type="button" onClick={addRecipient}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">Press Enter or click + to add each email</p>
                            </div>

                            {recipients.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Recipients ({recipients.length})</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {recipients.map((email, index) => (
                                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                                                {email}
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecipient(email)}
                                                    className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email-message">Email Message (Optional)</Label>
                                <Textarea
                                    id="email-message"
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder={defaultEmailMessage}
                                    rows={8}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-slate-500">Leave blank to use the default message</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="sms" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sms-recipient">Phone Numbers</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="sms-recipient"
                                        type="tel"
                                        placeholder="+15551234567" // Updated placeholder
                                        value={currentRecipient}
                                        onChange={(e) => setCurrentRecipient(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                    <Button type="button" onClick={addRecipient}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    ⚠️ <strong>Important:</strong> Include country code with + (e.g., +1 for US). Format: +15551234567 {/* Updated instruction */}
                                </p>
                            </div>

                            {recipients.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Recipients ({recipients.length})</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {recipients.map((phone, index) => (
                                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                                                {phone}
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecipient(phone)}
                                                    className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="sms-message">SMS Message (Optional)</Label>
                                <Textarea
                                    id="sms-message"
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder={defaultSMSMessage}
                                    rows={4}
                                    maxLength={160}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-slate-500">
                                    {customMessage ? customMessage.length : defaultSMSMessage.length}/160 characters. Leave blank for default message.
                                </p>
                            </div>

                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-xs text-yellow-800">
                                    💰 SMS messages cost approximately $0.0075 each. Sending to {recipients.length} recipients will cost ~${(recipients.length * 0.0075).toFixed(2)}
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {sendResult && (
                        <div className={`p-4 rounded-lg border ${sendResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-2">
                                {sendResult.success ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-green-900">Invites Sent Successfully!</span>
                                    </>
                                ) : (
                                    <>
                                        <X className="w-5 h-5 text-red-600" />
                                        <span className="font-medium text-red-900">Failed to send invites</span>
                                    </>
                                )}
                            </div>
                            {sendResult.error && (
                                <div className="mt-2">
                                    <p className="text-sm text-red-700 font-semibold">{sendResult.error}</p>
                                    {sendResult.details && (
                                        <p className="text-xs text-red-600 mt-1 font-mono bg-red-100 p-2 rounded">{sendResult.details}</p>
                                    )}
                                </div>
                            )}
                            {sendResult.data && sendResult.success && (
                                <p className="text-sm text-green-700 mt-1">
                                    Sent: {sendResult.data.sent} | Failed: {sendResult.data.failed}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSendInvites} disabled={isSending || recipients.length === 0}>
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Send {recipients.length} {inviteMethod === "email" ? "Email" : "SMS"} Invite{recipients.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
