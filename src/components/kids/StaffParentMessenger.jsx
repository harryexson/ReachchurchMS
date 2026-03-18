import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Mail, MessageSquare, CheckCircle, Loader2, AlertTriangle, Send } from "lucide-react";
import { notifyParentFromStaff } from "@/functions/notifyParentFromStaff";

const MESSAGE_OPTIONS = [
    { key: 'feeding_needed', emoji: '🍼', label: 'Feeding Needed', color: 'amber', desc: 'Child needs to be fed' },
    { key: 'diaper_change', emoji: '👶', label: 'Diaper/Clothes Change', color: 'blue', desc: 'Needs changing' },
    { key: 'emergency', emoji: '🚨', label: 'Emergency – Come Now', color: 'red', desc: 'Urgent – please come immediately' },
    { key: 'pickup_now', emoji: '📢', label: 'Please Pick Up', color: 'orange', desc: 'Come collect your child' },
    { key: 'medication_needed', emoji: '💊', label: 'Medication Due', color: 'purple', desc: 'Medication time' },
    { key: 'crying_upset', emoji: '😢', label: 'Child Is Upset', color: 'yellow', desc: 'Needs parent' },
    { key: 'injury', emoji: '🩹', label: 'Minor Incident', color: 'rose', desc: 'Minor injury – please come' },
    { key: 'supplies_needed', emoji: '🎒', label: 'Bring Supplies', color: 'teal', desc: 'Need extra clothes/diapers' },
    { key: 'behavior_concern', emoji: '⚠️', label: 'Behavior Concern', color: 'orange', desc: 'Would like to speak with you' },
    { key: 'ready_for_pickup', emoji: '✅', label: 'Ready for Pickup', color: 'green', desc: 'Child is ready to go' },
    { key: 'general', emoji: '💬', label: 'Custom Message', color: 'slate', desc: 'Write your own message' },
];

const colorMap = {
    amber: 'border-amber-400 bg-amber-50 text-amber-800',
    blue: 'border-blue-400 bg-blue-50 text-blue-800',
    red: 'border-red-500 bg-red-50 text-red-800',
    orange: 'border-orange-400 bg-orange-50 text-orange-800',
    purple: 'border-purple-400 bg-purple-50 text-purple-800',
    yellow: 'border-yellow-400 bg-yellow-50 text-yellow-800',
    rose: 'border-rose-400 bg-rose-50 text-rose-800',
    teal: 'border-teal-400 bg-teal-50 text-teal-800',
    green: 'border-green-500 bg-green-50 text-green-800',
    slate: 'border-slate-400 bg-slate-50 text-slate-800',
};

export default function StaffParentMessenger({ checkInRecord, onClose }) {
    const [selectedType, setSelectedType] = useState(null);
    const [customMessage, setCustomMessage] = useState('');
    const [channels, setChannels] = useState({ sms: true, email: !!checkInRecord?.parent_email, in_app: true });
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState(null);

    const toggle = (ch) => setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));

    const handleSend = async () => {
        if (!selectedType) return;
        setIsSending(true);
        try {
            const res = await notifyParentFromStaff({
                check_in_id: checkInRecord.id,
                child_name: checkInRecord.child_name,
                parent_name: checkInRecord.parent_name,
                parent_phone: checkInRecord.parent_phone,
                parent_email: checkInRecord.parent_email,
                message_type: selectedType,
                custom_message: customMessage,
                send_sms: channels.sms,
                send_email: channels.email,
                send_in_app: channels.in_app,
                ministry_area: checkInRecord.ministry_area,
                location_room: checkInRecord.location_room,
                church_admin_email: checkInRecord.church_admin_email
            });
            setResult(res.data);
        } catch (e) {
            setResult({ success: false, error: e.message });
        }
        setIsSending(false);
    };

    const selectedOption = MESSAGE_OPTIONS.find(o => o.key === selectedType);

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-purple-600" />
                        Message Parent – {checkInRecord.child_name}
                    </DialogTitle>
                </DialogHeader>

                {result ? (
                    <div className="space-y-4 py-2">
                        {result.success ? (
                            <Alert className="bg-green-50 border-green-300">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <AlertDescription>
                                    <p className="font-bold text-green-900">Message sent successfully!</p>
                                    <div className="flex gap-3 mt-2 text-sm">
                                        {result.sms_success && <span className="text-green-700">✓ SMS</span>}
                                        {result.email_success && <span className="text-green-700">✓ Email</span>}
                                        {result.in_app_success && <span className="text-green-700">✓ In-App</span>}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-red-50 border-red-300">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <AlertDescription>
                                    <p className="font-bold text-red-900">Some channels failed</p>
                                    {result.errors?.map((e, i) => <p key={i} className="text-sm text-red-700">{e}</p>)}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button onClick={onClose} className="w-full">Done</Button>
                        <Button variant="outline" onClick={() => setResult(null)} className="w-full">Send Another Message</Button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Parent info */}
                        <div className="bg-slate-50 p-3 rounded-xl text-sm space-y-1 border border-slate-200">
                            <p><span className="font-medium text-slate-600">Parent:</span> {checkInRecord.parent_name}</p>
                            {checkInRecord.parent_phone && <p><span className="font-medium text-slate-600">Phone:</span> {checkInRecord.parent_phone}</p>}
                            {checkInRecord.parent_email && <p><span className="font-medium text-slate-600">Email:</span> {checkInRecord.parent_email}</p>}
                        </div>

                        {/* Message type selection */}
                        <div>
                            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Select Reason *</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {MESSAGE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setSelectedType(opt.key)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selectedType === opt.key ? colorMap[opt.color] + ' ring-2 ring-offset-1 ring-current' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                    >
                                        <span className="text-2xl">{opt.emoji}</span>
                                        <div>
                                            <p className="font-semibold text-sm">{opt.label}</p>
                                            <p className="text-xs opacity-70">{opt.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedType === 'general' && (
                            <div>
                                <Label>Custom Message *</Label>
                                <Textarea
                                    value={customMessage}
                                    onChange={e => setCustomMessage(e.target.value)}
                                    placeholder="Type your message to the parent..."
                                    className="h-24"
                                />
                            </div>
                        )}

                        {/* Channels */}
                        <div>
                            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Send Via</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { key: 'sms', icon: Smartphone, label: 'SMS', available: !!checkInRecord.parent_phone },
                                    { key: 'email', icon: Mail, label: 'Email', available: !!checkInRecord.parent_email },
                                    { key: 'in_app', icon: MessageSquare, label: 'In-App', available: !!checkInRecord.parent_email }
                                ].map(({ key, icon: Icon, label, available }) => (
                                    <button
                                        key={key}
                                        onClick={() => available && toggle(key)}
                                        disabled={!available}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm ${!available ? 'opacity-30 cursor-not-allowed border-slate-100' : channels[key] ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500'}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="font-medium">{label}</span>
                                        {!available && <span className="text-xs">N/A</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedOption && selectedType !== 'general' && (
                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertDescription className="text-sm text-blue-800">
                                    <span className="font-semibold">Preview: </span>
                                    {selectedOption.emoji} Children's Church Update: {selectedOption.desc} for <strong>{checkInRecord.child_name}</strong>. Please come to {checkInRecord.location_room || "the children's area"}.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            onClick={handleSend}
                            disabled={isSending || !selectedType || (selectedType === 'general' && !customMessage.trim()) || (!channels.sms && !channels.email && !channels.in_app)}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            {isSending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> Send Message to Parent</>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}