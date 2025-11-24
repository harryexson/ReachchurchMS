import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ComposeEmailModal({ emailData, isOpen, onOpenChange, onSend }) {
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);
    const [editableSubject, setEditableSubject] = useState('');
    const [editableBody, setEditableBody] = useState('');

    React.useEffect(() => {
        if (emailData) {
            setEditableSubject(emailData.subject || '');
            setEditableBody(emailData.body || '');
            setSendResult(null);
        }
    }, [emailData]);

    if (!emailData) return null;

    const { to } = emailData;

    const handleSendEmail = async () => {
        setIsSending(true);
        setSendResult(null);

        try {
            // Use our custom visitor email function
            const { sendVisitorEmail } = await import("@/functions/sendVisitorEmail");
            
            const response = await sendVisitorEmail({
                to: to,
                from_name: "REACH Church",
                subject: editableSubject,
                body: editableBody
            });

            if (response.data.success) {
                setSendResult({ success: true, message: 'Email sent successfully!' });

                // Call the onSend callback to update the visitor record
                if (onSend) {
                    await onSend();
                }

                // Close modal after 2 seconds
                setTimeout(() => {
                    onOpenChange(false);
                    setSendResult(null);
                }, 2000);
            } else {
                throw new Error(response.data.error || 'Failed to send email');
            }

        } catch (error) {
            console.error('Failed to send email:', error);
            setSendResult({ 
                success: false, 
                message: error.response?.data?.details || error.message || 'Failed to send email. Please try again.' 
            });
        }

        setIsSending(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Send Follow-Up Email</DialogTitle>
                    <DialogDescription>
                        Review and edit the email before sending. The email will be sent automatically to the visitor.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="to">To</Label>
                        <Input id="to" readOnly value={to} className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                            id="subject" 
                            value={editableSubject} 
                            onChange={(e) => setEditableSubject(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="body">Message</Label>
                        <Textarea 
                            id="body" 
                            value={editableBody} 
                            onChange={(e) => setEditableBody(e.target.value)}
                            rows={12} 
                        />
                    </div>

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
                                        <span className="font-medium text-green-900">{sendResult.message}</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <span className="font-medium text-red-900">{sendResult.message}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={isSending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSendEmail}
                        disabled={isSending || sendResult?.success}
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email Now
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}