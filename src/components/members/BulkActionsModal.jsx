import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, MessageSquare, Tag, Users, Loader2, CheckCircle } from "lucide-react";

export default function BulkActionsModal({ isOpen, setIsOpen, selectedMembers, onComplete }) {
    const [action, setAction] = useState("email");
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [smsMessage, setSmsMessage] = useState("");
    const [tagsToAdd, setTagsToAdd] = useState("");
    const [tagsToRemove, setTagsToRemove] = useState("");
    const [groupToAdd, setGroupToAdd] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [memberGroups, setMemberGroups] = useState([]);

    React.useEffect(() => {
        if (isOpen) {
            loadGroups();
        }
    }, [isOpen]);

    const loadGroups = async () => {
        try {
            const groups = await base44.entities.MemberGroup.filter({ is_active: true });
            setMemberGroups(groups);
        } catch (error) {
            console.error("Error loading groups:", error);
        }
    };

    const handleBulkEmail = async () => {
        setIsProcessing(true);
        try {
            const recipients = selectedMembers.map(m => m.email).filter(Boolean);
            
            await base44.integrations.Core.SendEmail({
                to: recipients.join(", "),
                subject: emailSubject,
                body: emailBody
            });

            setResult({ success: true, message: `Email sent to ${recipients.length} members` });
        } catch (error) {
            setResult({ success: false, message: "Failed to send email: " + error.message });
        }
        setIsProcessing(false);
    };

    const handleBulkSMS = async () => {
        setIsProcessing(true);
        try {
            let successCount = 0;
            for (const member of selectedMembers) {
                if (member.phone) {
                    try {
                        await base44.functions.invoke('sendSMS', {
                            to: member.phone,
                            message: smsMessage
                        });
                        successCount++;
                    } catch (err) {
                        console.error(`Failed to send SMS to ${member.phone}:`, err);
                    }
                }
            }
            setResult({ success: true, message: `SMS sent to ${successCount} members` });
        } catch (error) {
            setResult({ success: false, message: "Failed to send SMS: " + error.message });
        }
        setIsProcessing(false);
    };

    const handleBulkTags = async () => {
        setIsProcessing(true);
        try {
            const tagsAdd = tagsToAdd.split(',').map(t => t.trim()).filter(Boolean);
            const tagsRemove = tagsToRemove.split(',').map(t => t.trim()).filter(Boolean);

            for (const member of selectedMembers) {
                let currentTags = member.tags || [];
                
                // Add new tags
                tagsAdd.forEach(tag => {
                    if (!currentTags.includes(tag)) {
                        currentTags.push(tag);
                    }
                });

                // Remove tags
                currentTags = currentTags.filter(tag => !tagsRemove.includes(tag));

                await base44.entities.Member.update(member.id, { tags: currentTags });
            }

            setResult({ success: true, message: `Tags updated for ${selectedMembers.length} members` });
            if (onComplete) onComplete();
        } catch (error) {
            setResult({ success: false, message: "Failed to update tags: " + error.message });
        }
        setIsProcessing(false);
    };

    const handleBulkAddToGroup = async () => {
        setIsProcessing(true);
        try {
            for (const member of selectedMembers) {
                // Check if already in group
                const existing = await base44.entities.MemberGroupAssignment.filter({
                    member_id: member.id,
                    group_id: groupToAdd,
                    is_active: true
                });

                if (existing.length === 0) {
                    await base44.entities.MemberGroupAssignment.create({
                        member_id: member.id,
                        member_email: member.email,
                        member_name: `${member.first_name} ${member.last_name}`,
                        group_id: groupToAdd,
                        is_active: true,
                        join_date: new Date().toISOString().split('T')[0]
                    });
                }
            }

            // Update group member count
            const group = await base44.entities.MemberGroup.get(groupToAdd);
            const assignments = await base44.entities.MemberGroupAssignment.filter({
                group_id: groupToAdd,
                is_active: true
            });
            await base44.entities.MemberGroup.update(groupToAdd, {
                member_count: assignments.length
            });

            setResult({ success: true, message: `${selectedMembers.length} members added to group` });
            if (onComplete) onComplete();
        } catch (error) {
            setResult({ success: false, message: "Failed to add to group: " + error.message });
        }
        setIsProcessing(false);
    };

    const handleSubmit = async () => {
        setResult(null);
        
        if (action === "email") {
            await handleBulkEmail();
        } else if (action === "sms") {
            await handleBulkSMS();
        } else if (action === "tags") {
            await handleBulkTags();
        } else if (action === "addToGroup") {
            await handleBulkAddToGroup();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Bulk Actions
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label className="text-sm text-slate-600 mb-2 block">
                            Selected Members: <Badge>{selectedMembers.length}</Badge>
                        </Label>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-slate-50 rounded-md">
                            {selectedMembers.map(m => (
                                <Badge key={m.id} variant="outline" className="text-xs">
                                    {m.first_name} {m.last_name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Action</Label>
                        <Select value={String(action)} onValueChange={setAction}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Send Bulk Email
                                    </div>
                                </SelectItem>
                                <SelectItem value="sms">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Send Bulk SMS
                                    </div>
                                </SelectItem>
                                <SelectItem value="tags">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        Manage Tags
                                    </div>
                                </SelectItem>
                                <SelectItem value="addToGroup">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Add to Group
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {action === "email" && (
                        <div className="space-y-4">
                            <div>
                                <Label>Subject</Label>
                                <Input
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Email subject..."
                                />
                            </div>
                            <div>
                                <Label>Message</Label>
                                <Textarea
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    placeholder="Email body..."
                                    rows={6}
                                />
                            </div>
                        </div>
                    )}

                    {action === "sms" && (
                        <div>
                            <Label>SMS Message</Label>
                            <Textarea
                                value={smsMessage}
                                onChange={(e) => setSmsMessage(e.target.value)}
                                placeholder="SMS message (160 characters max)..."
                                rows={4}
                                maxLength={160}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                {smsMessage.length}/160 characters
                            </p>
                        </div>
                    )}

                    {action === "tags" && (
                        <div className="space-y-4">
                            <div>
                                <Label>Add Tags (comma-separated)</Label>
                                <Input
                                    value={tagsToAdd}
                                    onChange={(e) => setTagsToAdd(e.target.value)}
                                    placeholder="e.g., VIP, Leader, NewMember"
                                />
                            </div>
                            <div>
                                <Label>Remove Tags (comma-separated)</Label>
                                <Input
                                    value={tagsToRemove}
                                    onChange={(e) => setTagsToRemove(e.target.value)}
                                    placeholder="e.g., Visitor, Guest"
                                />
                            </div>
                        </div>
                    )}

                    {action === "addToGroup" && (
                        <div>
                            <Label>Select Group</Label>
                            <Select value={String(groupToAdd)} onValueChange={setGroupToAdd}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a group..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {memberGroups.map(group => (
                                        <SelectItem key={group.id} value={String(group.id)}>
                                            {group.group_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {result && (
                        <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                            {result.success && <CheckCircle className="w-4 h-4 text-green-600" />}
                            <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                                {result.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isProcessing}>
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Execute Action"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}