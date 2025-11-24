import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OpportunityForm({ isOpen, setIsOpen, onSubmit, opportunity, events }) {
    const [formData, setFormData] = useState({
        event_id: '',
        event_title: '',
        ministry: 'worship_team',
        role: '',
        shift_date: '',
        shift_start_time: '',
        shift_end_time: '',
        location_room: '',
        spots_needed: 1,
        spots_filled: 0,
        team_leader_name: '',
        team_leader_email: '',
        description: '',
        status: 'open'
    });

    useEffect(() => {
        if (opportunity) {
            setFormData(opportunity);
        } else {
            setFormData({
                event_id: '',
                event_title: '',
                ministry: 'worship_team',
                role: '',
                shift_date: '',
                shift_start_time: '',
                shift_end_time: '',
                location_room: '',
                spots_needed: 1,
                spots_filled: 0,
                team_leader_name: '',
                team_leader_email: '',
                description: '',
                status: 'open'
            });
        }
    }, [opportunity, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleEventChange = (eventId) => {
        const selectedEvent = events.find(e => e.id === eventId);
        if (selectedEvent) {
            setFormData({
                ...formData,
                event_id: eventId,
                event_title: selectedEvent.title,
                shift_date: selectedEvent.start_datetime?.split('T')[0] || '',
                location_room: selectedEvent.location || ''
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {opportunity ? 'Edit Volunteer Opportunity' : 'Create Volunteer Opportunity'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Link to Event (Optional)</Label>
                            <Select 
                                value={formData.event_id} 
                                onValueChange={handleEventChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an event..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>No Event (Standalone)</SelectItem>
                                    {events?.map(event => (
                                        <SelectItem key={event.id} value={event.id}>
                                            {event.title} - {new Date(event.start_datetime).toLocaleDateString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2">
                            <Label>Opportunity Title *</Label>
                            <Input
                                required
                                value={formData.event_title}
                                onChange={(e) => setFormData({...formData, event_title: e.target.value})}
                                placeholder="e.g., Sunday Morning Greeter"
                            />
                        </div>

                        <div>
                            <Label>Ministry Area *</Label>
                            <Select 
                                value={formData.ministry} 
                                onValueChange={(val) => setFormData({...formData, ministry: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="worship_team">Worship Team</SelectItem>
                                    <SelectItem value="children_ministry">Children Ministry</SelectItem>
                                    <SelectItem value="youth_ministry">Youth Ministry</SelectItem>
                                    <SelectItem value="hospitality">Hospitality</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="media_tech">Media & Tech</SelectItem>
                                    <SelectItem value="prayer_team">Prayer Team</SelectItem>
                                    <SelectItem value="outreach">Outreach</SelectItem>
                                    <SelectItem value="administration">Administration</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Role/Position *</Label>
                            <Input
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                placeholder="e.g., Greeter, Usher, Sound Tech"
                            />
                        </div>

                        <div>
                            <Label>Date *</Label>
                            <Input
                                type="date"
                                required
                                value={formData.shift_date}
                                onChange={(e) => setFormData({...formData, shift_date: e.target.value})}
                            />
                        </div>

                        <div>
                            <Label>Location/Room</Label>
                            <Input
                                value={formData.location_room}
                                onChange={(e) => setFormData({...formData, location_room: e.target.value})}
                                placeholder="Main Sanctuary, Room 101, etc."
                            />
                        </div>

                        <div>
                            <Label>Start Time *</Label>
                            <Input
                                type="time"
                                required
                                value={formData.shift_start_time}
                                onChange={(e) => setFormData({...formData, shift_start_time: e.target.value})}
                            />
                        </div>

                        <div>
                            <Label>End Time *</Label>
                            <Input
                                type="time"
                                required
                                value={formData.shift_end_time}
                                onChange={(e) => setFormData({...formData, shift_end_time: e.target.value})}
                            />
                        </div>

                        <div>
                            <Label>Volunteers Needed *</Label>
                            <Input
                                type="number"
                                min="1"
                                required
                                value={formData.spots_needed}
                                onChange={(e) => setFormData({...formData, spots_needed: parseInt(e.target.value)})}
                            />
                        </div>

                        <div>
                            <Label>Status</Label>
                            <Select 
                                value={formData.status} 
                                onValueChange={(val) => setFormData({...formData, status: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="filled">Filled</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Team Leader Name</Label>
                            <Input
                                value={formData.team_leader_name}
                                onChange={(e) => setFormData({...formData, team_leader_name: e.target.value})}
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <Label>Team Leader Email</Label>
                            <Input
                                type="email"
                                value={formData.team_leader_email}
                                onChange={(e) => setFormData({...formData, team_leader_email: e.target.value})}
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Description/Notes</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="What will volunteers be doing? Any special requirements?"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                            {opportunity ? 'Update Opportunity' : 'Create Opportunity'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}