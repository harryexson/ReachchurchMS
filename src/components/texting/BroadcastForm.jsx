
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TextSubscriber } from "@/entities/TextSubscriber";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function BroadcastForm({ isOpen, setIsOpen, onComplete }) {
    const [message, setMessage] = useState("");
    const [recipients, setRecipients] = useState(["all_subscribers"]);
    const [customNumbers, setCustomNumbers] = useState("");
    const [groups, setGroups] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);

    // TCPA Compliance notice
    const SMS_DISCLAIMER_INFO = "Note: TCPA compliance footer will be automatically added to all messages";

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        const subscribers = await TextSubscriber.filter({ status: "active" });
        const uniqueGroups = [...new Set(subscribers.flatMap(s => s.groups || []).filter(Boolean))];
        setGroups(uniqueGroups);
    };

    const handleRecipientChange = (value, isChecked) => {
        if (value === "all_subscribers") {
            setRecipients(isChecked ? ["all_subscribers"] : []);
        } else {
            if (recipients.includes("all_subscribers") && isChecked) {
                setRecipients([value]);
            } else {
                setRecipients(prev => 
                    isChecked 
                        ? [...prev, value] 
                        : prev.filter(item => item !== value)
                );
            }
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            alert("Please enter a message.");
            return;
        }

        const hasSelectedGroups = recipients.filter(r => r !== "all_subscribers").length > 0;
        const hasAllSubscribersSelected = recipients.includes("all_subscribers");
        const hasCustomNumbers = customNumbers.trim().length > 0;

        if (!hasSelectedGroups && !hasAllSubscribersSelected && !hasCustomNumbers) {
            alert("Please select at least one recipient group or add phone numbers.");
            return;
        }

        setIsSending(true);
        setSendResult(null);

        try {
            const { sendSinchSMS } = await import("@/functions/sendSinchSMS");
            
            let allRecipients = [];

            if (customNumbers.trim()) {
                allRecipients = [...customNumbers.split(',').map(n => n.trim()).filter(Boolean)];
            }
            
            const activeSubscribers = await TextSubscriber.filter({ status: 'active' });

            if (hasAllSubscribersSelected) {
                allRecipients = [...allRecipients, ...activeSubscribers.map(s => s.phone_number)];
            } else if (hasSelectedGroups) {
                for (const group of recipients) {
                    if (group && group !== 'all_subscribers') {
                        const groupSubs = activeSubscribers.filter(s => s.groups && s.groups.includes(group));
                        allRecipients = [...allRecipients, ...groupSubs.map(s => s.phone_number)];
                    }
                }
            }

            allRecipients = [...new Set(allRecipients)];

            if (allRecipients.length === 0) {
                alert("No unique recipients found based on your selection.");
                setIsSending(false);
                return;
            }

            const response = await sendSinchSMS({
                to: allRecipients,
                message: message
            });

            setSendResult({
                success: true,
                sent: response.data.total_sent,
                failed: response.data.total_failed,
                total: allRecipients.length
            });

            if (onComplete) {
                onComplete();
            }

            setTimeout(() => {
                setIsOpen(false);
                setMessage("");
                setRecipients(["all_subscribers"]);
                setCustomNumbers("");
                setSendResult(null);
            }, 3000);

        } catch (error) {
            console.error("Failed to send broadcast:", error);
            setSendResult({
                success: false,
                error: error.message || "Failed to send messages. Please check console for details."
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Send SMS Broadcast</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSend}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipients-selection">Send To</Label>
                            <div id="recipients-selection" className="flex flex-col gap-3 p-3 border rounded-md">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="allSubscribers"
                                        checked={recipients.includes("all_subscribers")}
                                        onCheckedChange={(checked) => handleRecipientChange("all_subscribers", !!checked)}
                                    />
                                    <Label htmlFor="allSubscribers">All Active Subscribers</Label>
                                </div>
                                
                                {groups.length > 0 && (
                                    <div className="flex flex-col space-y-2 pt-2 border-t mt-2">
                                        <p className="text-sm font-medium leading-none text-slate-700">Specific Groups:</p>
                                        <div className="grid grid-cols-2 gap-2 pl-2">
                                            {groups.map(group => (
                                                <div key={group} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`group-${group}`}
                                                        checked={recipients.includes(group)}
                                                        onCheckedChange={(checked) => handleRecipientChange(group, !!checked)}
                                                        disabled={recipients.includes("all_subscribers")}
                                                    />
                                                    <Label htmlFor={`group-${group}`}>{group}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-2 pt-2 border-t mt-2">
                                    <Label htmlFor="customNumbers">Custom Phone Numbers (comma-separated)</Label>
                                    <Textarea
                                        id="customNumbers"
                                        value={customNumbers}
                                        onChange={(e) => setCustomNumbers(e.target.value)}
                                        placeholder="e.g., +15551234567, +15559876543"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea 
                                id="message" 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your message..."
                                rows={6}
                                required
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-slate-500">
                                    {message.length} characters
                                </p>
                                <p className="text-xs text-blue-600 font-medium">
                                    {SMS_DISCLAIMER_INFO}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <p className="text-xs text-blue-800">
                                    <strong>Auto-appended:</strong> "Msg & Data Rates may apply. Text STOP to opt-out. Text YES to opt-in."
                                </p>
                            </div>
                        </div>
                        
                        {sendResult && (
                            <div className={`p-3 rounded-md text-sm ${sendResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {sendResult.success ? (
                                    <>
                                        Broadcast sent successfully! {sendResult.sent} of {sendResult.total} messages processed.
                                        {sendResult.failed && sendResult.failed > 0 && ` (${sendResult.failed} failed).`}
                                    </>
                                ) : (
                                    `Error: ${sendResult.error}`
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSending || !message.trim() || (recipients.length === 0 && customNumbers.trim().length === 0)}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Broadcast"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
