
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { User } from "@/entities/User";
import { BulkMessage } from "@/entities/BulkMessage";

export default function BulkEmailModal({ isOpen, setIsOpen, recipients = [], defaultSubject = "", defaultBody = "", onSent }) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setSubject(defaultSubject);
            setBody(defaultBody);
            setSendResult(null);
        }
    }, [isOpen, defaultSubject, defaultBody]);

    const handleSend = async () => {
        if (!subject || !body) {
            alert("Please enter both subject and message");
            return;
        }

        setIsSending(true);
        setSendResult(null);

        try {
            const currentUser = await User.me();
            const { sendVisitorEmail } = await import("@/functions/sendVisitorEmail");

            let successCount = 0;
            let failedCount = 0;
            let domainVerificationNeeded = false;

            // Send to each recipient
            for (const email of recipients) {
                try {
                    const response = await sendVisitorEmail({
                        to: email,
                        from_name: currentUser.church_name || "REACH Church",
                        subject: subject,
                        body: body
                    });
                    
                    if (response.data.success) {
                        successCount++;
                    } else {
                        // If the backend indicates an error, throw it to be caught below
                        throw new Error(response.data.error || "An unknown error occurred during sending.");
                    }
                } catch (error) {
                    console.error(`Failed to send to ${email}:`, error);
                    
                    // Check if it's a domain verification error
                    if (error.response?.data?.action_required === 'domain_verification') {
                        domainVerificationNeeded = true;
                        setSendResult({
                            success: false,
                            message: error.response.data.details,
                            isDomainError: true
                        });
                        setIsSending(false);
                        return; // Stop sending immediately if domain verification is required
                    }
                    
                    failedCount++;
                }
            }

            // Record the bulk message
            await BulkMessage.create({
                subject: subject,
                message_body: body,
                sent_to_count: recipients.length,
                sent_by: currentUser.email,
                sent_by_name: currentUser.full_name,
                send_date: new Date().toISOString(),
                status: failedCount === 0 ? "sent" : (successCount > 0 ? "sent" : "failed"),
                success_count: successCount,
                failed_count: failedCount,
                message_type: "custom"
            });

            setSendResult({
                success: successCount > 0, // Overall success if at least one email was sent
                message: `Successfully sent to ${successCount} recipients${failedCount > 0 ? `, ${failedCount} failed` : ''}`
            });

            if (onSent) {
                await onSent();
            }

            if (successCount > 0) { // Only close if there was at least one successful send
                setTimeout(() => {
                    setIsOpen(false);
                    setSubject("");
                    setBody("");
                    setSendResult(null);
                }, 2000);
            }

        } catch (error) {
            console.error('Bulk email error:', error);
            setSendResult({
                success: false,
                message: error.message || 'Failed to send emails'
            });
        }

        setIsSending(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Send Bulk Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                            Sending to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {recipients.slice(0, 5).map((email, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{email}</Badge>
                            ))}
                            {recipients.length > 5 && (
                                <Badge variant="outline" className="text-xs">+{recipients.length - 5} more</Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                            id="subject" 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body">Message</Label>
                        <Textarea 
                            id="body" 
                            value={body} 
                            onChange={(e) => setBody(e.target.value)}
                            rows={10}
                            placeholder="Enter your message..."
                        />
                    </div>

                    {sendResult && (
                        <div className={`p-4 rounded-lg border ${
                            sendResult.success 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-start gap-2"> {/* Changed to items-start */}
                                {sendResult.success ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" /> {/* Added mt-0.5 flex-shrink-0 */}
                                        <span className="font-medium text-green-900">{sendResult.message}</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /> {/* Added mt-0.5 flex-shrink-0 */}
                                        <div className="flex-1"> {/* Wrapper div for message and link */}
                                            <p className="font-medium text-red-900 whitespace-pre-line">{sendResult.message}</p>
                                            {sendResult.isDomainError && (
                                                <a 
                                                    href="https://resend.com/domains" 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-block mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                                                >
                                                    Setup Domain Now →
                                                </a>
                                            )}
                                        </div>
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
                        onClick={() => setIsOpen(false)}
                        disabled={isSending}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSend}
                        disabled={isSending || !subject || !body}
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4 mr-2" />
                                Send to All
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
