import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function HoursLogForm({ isOpen, setIsOpen, onSubmit, volunteers, events }) {
    const [formData, setFormData] = useState({
        volunteer_id: "",
        event_id: "",
        role: "",
        date: "",
        start_time: "",
        end_time: "",
        hours: "",
        notes: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate hours if start and end time are set
            if (name === 'start_time' || name === 'end_time') {
                if (newData.start_time && newData.end_time) {
                    const [startHour, startMin] = newData.start_time.split(':').map(Number);
                    const [endHour, endMin] = newData.end_time.split(':').map(Number);
                    const startMinutes = startHour * 60 + startMin;
                    const endMinutes = endHour * 60 + endMin;
                    const diffMinutes = endMinutes - startMinutes;
                    const hours = (diffMinutes / 60).toFixed(2);
                    newData.hours = hours > 0 ? hours : "";
                }
            }

            return newData;
        });
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-fill volunteer and event details
            if (name === 'volunteer_id') {
                const volunteer = volunteers.find(v => v.id === value);
                if (volunteer) {
                    newData.volunteer_name = volunteer.member_name;
                    newData.volunteer_email = volunteer.email;
                    newData.role = volunteer.role || "";
                    newData.ministry_area = volunteer.ministry || "";
                }
            }

            if (name === 'event_id') {
                const event = events.find(e => e.id === value);
                if (event) {
                    newData.event_title = event.title;
                    newData.date = event.start_datetime ? event.start_datetime.split('T')[0] : "";
                }
            }

            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit({
            ...formData,
            hours: parseFloat(formData.hours)
        });
        // Reset form
        setFormData({
            volunteer_id: "",
            event_id: "",
            role: "",
            date: "",
            start_time: "",
            end_time: "",
            hours: "",
            notes: ""
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Log Volunteer Hours</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="volunteer_id">Volunteer</Label>
                            <Select value={formData.volunteer_id} onValueChange={(value) => handleSelectChange('volunteer_id', value)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select volunteer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {volunteers.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.member_name} ({v.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="event_id">Event/Service (Optional)</Label>
                            <Select value={formData.event_id} onValueChange={(value) => handleSelectChange('event_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select event" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>No specific event</SelectItem>
                                    {events.map(e => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role/Task</Label>
                            <Input id="role" name="role" value={formData.role} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="start_time">Start Time</Label>
                            <Input id="start_time" name="start_time" type="time" value={formData.start_time} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_time">End Time</Label>
                            <Input id="end_time" name="end_time" type="time" value={formData.end_time} onChange={handleChange} required />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="hours">Total Hours</Label>
                            <Input id="hours" name="hours" type="number" step="0.25" min="0" value={formData.hours} onChange={handleChange} required />
                            <p className="text-xs text-slate-500">Calculated automatically from start/end times</p>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Log Hours
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}