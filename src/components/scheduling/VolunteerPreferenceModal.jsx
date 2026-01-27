import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function VolunteerPreferenceModal({ isOpen, onClose, preference, members }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState(preference || {
        volunteer_name: "",
        volunteer_email: "",
        volunteer_phone: "",
        position_roles: [],
        preferred_services: [],
        scheduling_preference: "as_needed",
        is_available: true,
        blackout_dates: [],
        notes: ""
    });

    const positionOptions = [
        { value: "worship_leader", label: "Worship Leader" },
        { value: "vocals", label: "Vocals" },
        { value: "guitar", label: "Guitar" },
        { value: "bass", label: "Bass" },
        { value: "drums", label: "Drums" },
        { value: "keyboard", label: "Keyboard" },
        { value: "sound_tech", label: "Sound Tech" },
        { value: "video_tech", label: "Video Tech" },
        { value: "lights", label: "Lights" },
        { value: "greeter", label: "Greeter" },
        { value: "usher", label: "Usher" },
        { value: "communion_server", label: "Communion Server" },
        { value: "prayer_team", label: "Prayer Team" },
        { value: "kids_ministry", label: "Kids Ministry" },
        { value: "parking_team", label: "Parking Team" }
    ];

    const serviceTimeOptions = [
        "Sun 9:00a",
        "Sun 11:00a",
        "Sun 6:00p",
        "Wed 7:00p",
        "Sat 6:00p"
    ];

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (preference?.id) {
                return base44.entities.VolunteerSchedulingPreference.update(preference.id, data);
            }
            return base44.entities.VolunteerSchedulingPreference.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['volunteerPreferences'] });
            toast.success(preference ? 'Preference updated' : 'Volunteer added');
            onClose();
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const togglePosition = (position) => {
        setFormData(prev => ({
            ...prev,
            position_roles: prev.position_roles?.includes(position)
                ? prev.position_roles.filter(p => p !== position)
                : [...(prev.position_roles || []), position]
        }));
    };

    const toggleServiceTime = (time) => {
        setFormData(prev => ({
            ...prev,
            preferred_services: prev.preferred_services?.includes(time)
                ? prev.preferred_services.filter(t => t !== time)
                : [...(prev.preferred_services || []), time]
        }));
    };

    const handleMemberSelect = (email) => {
        const member = members.find(m => m.email === email);
        if (member) {
            setFormData(prev => ({
                ...prev,
                volunteer_email: email,
                volunteer_name: `${member.first_name} ${member.last_name}`,
                volunteer_phone: member.phone || ""
            }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{preference ? 'Edit' : 'Add'} Volunteer Preference</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label>Select Member</Label>
                        <Select value={formData.volunteer_email} onValueChange={handleMemberSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a member..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(member => (
                                    <SelectItem key={member.id} value={member.email}>
                                        {member.first_name} {member.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.volunteer_email}
                                onChange={(e) => setFormData({...formData, volunteer_email: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input
                                type="tel"
                                value={formData.volunteer_phone}
                                onChange={(e) => setFormData({...formData, volunteer_phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="mb-3 block">Positions/Roles</Label>
                        <div className="grid md:grid-cols-2 gap-3">
                            {positionOptions.map(option => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={formData.position_roles?.includes(option.value)}
                                        onCheckedChange={() => togglePosition(option.value)}
                                    />
                                    <label className="text-sm">{option.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="mb-3 block">Preferred Service Times</Label>
                        <div className="flex flex-wrap gap-3">
                            {serviceTimeOptions.map(time => (
                                <div key={time} className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={formData.preferred_services?.includes(time)}
                                        onCheckedChange={() => toggleServiceTime(time)}
                                    />
                                    <label className="text-sm">{time}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Scheduling Preference</Label>
                        <Select 
                            value={formData.scheduling_preference} 
                            onValueChange={(value) => setFormData({...formData, scheduling_preference: value})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="every_week">Every Week</SelectItem>
                                <SelectItem value="1st_week">1st Week of Month</SelectItem>
                                <SelectItem value="2nd_week">2nd Week of Month</SelectItem>
                                <SelectItem value="3rd_week">3rd Week of Month</SelectItem>
                                <SelectItem value="4th_week">4th Week of Month</SelectItem>
                                <SelectItem value="once_a_month">Once a Month</SelectItem>
                                <SelectItem value="twice_a_month">Twice a Month</SelectItem>
                                <SelectItem value="as_needed">As Needed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Currently Available</Label>
                        <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                                checked={formData.is_available}
                                onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                            />
                            <label className="text-sm">Available for scheduling</label>
                        </div>
                    </div>

                    <div>
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Special requirements, availability notes..."
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            {preference ? 'Update' : 'Add'} Volunteer
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}