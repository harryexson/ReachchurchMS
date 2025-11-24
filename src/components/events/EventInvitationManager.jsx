import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Users, X } from "lucide-react";

export default function EventInvitationManager({ event, onClose }) {
    const [messageType, setMessageType] = useState('invitation');
    const [customMessage, setCustomMessage] = useState('');
    const [selectedSegments, setSelectedSegments] = useState([]);
    const [isSending, setIsSending] = useState(false);

    const segments = [
        { id: 'members', label: 'All Members', icon: '👥' },
        { id: 'visitors', label: 'Recent Visitors', icon: '🤝' },
        { id: 'recent_donors', label: 'Recent Donors (3 months)', icon: '💝' },
        { id: 'recurring_donors', label: 'Recurring Donors', icon: '🔄' },
        { id: 'volunteers', label: 'Active Volunteers', icon: '🙋' }
    ];

    const toggleSegment = (segmentId) => {
        setSelectedSegments(prev => 
            prev.includes(segmentId)
                ? prev.filter(s => s !== segmentId)
                : [...prev, segmentId]
        );
    };

    const handleSend = async () => {
        if (selectedSegments.length === 0) {
            alert('Please select at least one audience segment');
            return;
        }

        if (!confirm(`Send ${messageType} to ${selectedSegments.length} segment(s)?`)) return;

        setIsSending(true);
        try {
            const response = await base44.functions.invoke('sendEventInvitations', {
                event_id: event.id,
                target_segments: selectedSegments,
                message_type: messageType,
                custom_message: customMessage
            });

            if (response.data?.success) {
                alert(`Invitations sent! ${response.data.sent} sent, ${response.data.failed} failed.`);
                onClose();
            }
        } catch (error) {
            console.error("Failed to send invitations:", error);
            alert("Failed to send invitations. Please try again.");
        }
        setIsSending(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <Card className="max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Send Event Invitations</CardTitle>
                            <p className="text-sm text-blue-100 mt-1">{event.title}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                        <Label>Message Type</Label>
                        <Select value={messageType} onValueChange={setMessageType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="invitation">Invitation</SelectItem>
                                <SelectItem value="reminder">Reminder</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Target Audience (select all that apply)</Label>
                        <div className="grid md:grid-cols-2 gap-3">
                            {segments.map(segment => (
                                <div
                                    key={segment.id}
                                    onClick={() => toggleSegment(segment.id)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedSegments.includes(segment.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{segment.icon}</span>
                                        <span className="font-medium text-slate-900">{segment.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {selectedSegments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedSegments.map(id => {
                                    const segment = segments.find(s => s.id === id);
                                    return (
                                        <Badge key={id} className="bg-blue-100 text-blue-800">
                                            {segment.label}
                                            <X 
                                                className="w-3 h-3 ml-1 cursor-pointer" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSegment(id);
                                                }}
                                            />
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Custom Message (optional - leave blank for default)</Label>
                        <Textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={8}
                            placeholder="Customize your invitation message..."
                        />
                        <p className="text-xs text-slate-500">
                            If left blank, a default message will be generated with event details
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900 font-semibold mb-1">📧 Preview</p>
                        <p className="text-xs text-blue-800">
                            {selectedSegments.length} audience segment(s) selected. Emails will be sent individually with event details.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button 
                            onClick={handleSend} 
                            disabled={isSending || selectedSegments.length === 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Send Invitations
                                </>
                            )}
                        </Button>
                        <Button onClick={onClose} variant="outline">
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}