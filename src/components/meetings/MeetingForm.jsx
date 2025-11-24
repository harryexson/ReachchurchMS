
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const initialMeetingState = {
    title: "",
    description: "",
    meeting_type: "planning",
    scheduled_time: "",
    duration_minutes: 60,
    max_participants: 50,
    co_host_email: "",
    enable_breakout_rooms: false,
    enable_recording: false,
    require_registration: false, // Now defaults to false - open meetings!
    meeting_password: "",
    participants: []
};

export default function MeetingForm({ isOpen, setIsOpen, onSubmit, meeting }) {
    const [formData, setFormData] = useState(initialMeetingState);
    const [newParticipant, setNewParticipant] = useState({ name: "", email: "", role: "participant" });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (meeting) {
            setFormData({
                title: meeting.title || "",
                description: meeting.description || "",
                meeting_type: meeting.meeting_type || "planning",
                scheduled_time: meeting.scheduled_time ? meeting.scheduled_time.slice(0, 16) : "",
                duration_minutes: meeting.duration_minutes || 60,
                max_participants: meeting.max_participants || 50,
                co_host_email: meeting.co_host_email || "",
                enable_breakout_rooms: meeting.enable_breakout_rooms || false,
                enable_recording: meeting.enable_recording || false,
                require_registration: meeting.require_registration || false,
                meeting_password: meeting.meeting_password || "",
                participants: []
            });
        } else {
            setFormData(initialMeetingState);
        }
    }, [meeting, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addParticipant = () => {
        if (newParticipant.name && newParticipant.email) {
            setFormData(prev => ({
                ...prev,
                participants: [...prev.participants, { ...newParticipant }]
            }));
            setNewParticipant({ name: "", email: "", role: "participant" });
        }
    };

    const removeParticipant = (index) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit({
                ...formData,
                duration_minutes: parseInt(formData.duration_minutes),
                max_participants: parseInt(formData.max_participants)
            });
        } catch (error) {
            console.error("Form submission error:", error);
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {meeting ? "Edit Meeting" : "Schedule New Video Meeting"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="title">Meeting Title</Label>
                            <Input 
                                id="title" 
                                name="title" 
                                value={formData.title} 
                                onChange={handleChange} 
                                placeholder="Weekly Leadership Meeting"
                                required 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meeting_type">Meeting Type</Label>
                            <Select value={formData.meeting_type} onValueChange={(value) => handleSelectChange('meeting_type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bible_study">Bible Study</SelectItem>
                                    <SelectItem value="planning">Planning</SelectItem>
                                    <SelectItem value="vision_casting">Vision Casting</SelectItem>
                                    <SelectItem value="leadership">Leadership</SelectItem>
                                    <SelectItem value="prayer">Prayer Meeting</SelectItem>
                                    <SelectItem value="ministry_team">Ministry Team</SelectItem>
                                    <SelectItem value="board_meeting">Board Meeting</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="scheduled_time">Scheduled Date & Time</Label>
                            <Input 
                                id="scheduled_time" 
                                name="scheduled_time" 
                                type="datetime-local" 
                                value={formData.scheduled_time} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                            <Select value={String(formData.duration_minutes)} onValueChange={(value) => handleSelectChange('duration_minutes', parseInt(value))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="90">1.5 hours</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                    <SelectItem value="180">3 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max_participants">Max Participants</Label>
                            <Input 
                                id="max_participants" 
                                name="max_participants" 
                                type="number" 
                                min="2" 
                                max="100"
                                value={formData.max_participants} 
                                onChange={handleChange} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="co_host_email">Co-Host Email (Optional)</Label>
                            <Input 
                                id="co_host_email" 
                                name="co_host_email" 
                                type="email" 
                                value={formData.co_host_email} 
                                onChange={handleChange} 
                                placeholder="assistant@church.org"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meeting_password">Meeting Password (Optional)</Label>
                            <Input 
                                id="meeting_password" 
                                name="meeting_password" 
                                value={formData.meeting_password} 
                                onChange={handleChange} 
                                placeholder="Leave empty for no password"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="description">Description/Agenda</Label>
                            <Textarea 
                                id="description" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange}
                                rows={3}
                                placeholder="Meeting agenda and details..."
                            />
                        </div>

                        {/* Meeting Options */}
                        <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold">Meeting Options</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="require_registration" 
                                        checked={formData.require_registration}
                                        onCheckedChange={(checked) => handleSelectChange('require_registration', checked)}
                                    />
                                    <Label htmlFor="require_registration">Require Registration (Leave unchecked for open meetings)</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="enable_breakout_rooms" 
                                        checked={formData.enable_breakout_rooms}
                                        onCheckedChange={(checked) => handleSelectChange('enable_breakout_rooms', checked)}
                                    />
                                    <Label htmlFor="enable_breakout_rooms">Enable Breakout Rooms</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="enable_recording" 
                                        checked={formData.enable_recording}
                                        onCheckedChange={(checked) => handleSelectChange('enable_recording', checked)}
                                    />
                                    <Label htmlFor="enable_recording">Enable Recording</Label>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Tip:</strong> Leave "Require Registration" unchecked to allow anyone with the link to join. Perfect for open church meetings!
                                </p>
                            </div>
                        </div>

                        {/* Participants */}
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <h4 className="font-semibold">Invite Participants</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input 
                                        value={newParticipant.name}
                                        onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input 
                                        type="email"
                                        value={newParticipant.email}
                                        onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select 
                                        value={newParticipant.role} 
                                        onValueChange={(value) => setNewParticipant(prev => ({ ...prev, role: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="participant">Participant</SelectItem>
                                            <SelectItem value="moderator">Moderator</SelectItem>
                                            <SelectItem value="co_host">Co-Host</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" onClick={addParticipant}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                </Button>
                            </div>

                            {formData.participants.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Invited Participants ({formData.participants.length})</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.participants.map((participant, index) => (
                                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                                                {participant.name} ({participant.role})
                                                <button
                                                    type="button"
                                                    onClick={() => removeParticipant(index)}
                                                    className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Schedule Meeting"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
