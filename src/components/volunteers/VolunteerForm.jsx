import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/MultiSelect";

const initialVolunteerState = {
    member_name: "",
    email: "",
    phone: "",
    ministry: "hospitality",
    role: "",
    availability: [],
    skills: [],
    start_date: "",
    status: "active",
    background_check: false
};

const availabilityOptions = [
    { value: "sunday_morning", label: "Sunday Morning" },
    { value: "sunday_evening", label: "Sunday Evening" },
    { value: "wednesday_evening", label: "Wednesday Evening" },
    { value: "weekday_mornings", label: "Weekday Mornings" },
    { value: "weekday_evenings", label: "Weekday Evenings" },
    { value: "weekends", label: "Weekends" }
];

const skillsOptions = [
    { value: "music", label: "Music" },
    { value: "teaching", label: "Teaching" },
    { value: "administration", label: "Administration" },
    { value: "technology", label: "Technology" },
    { value: "childcare", label: "Childcare" },
    { value: "cooking", label: "Cooking" },
    { value: "maintenance", label: "Maintenance" },
    { value: "counseling", label: "Counseling" },
    { value: "photography", label: "Photography" },
    { value: "graphic_design", label: "Graphic Design" }
];

export default function VolunteerForm({ isOpen, setIsOpen, onSubmit, volunteer }) {
    const [formData, setFormData] = useState(initialVolunteerState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (volunteer) {
            setFormData({
                member_name: volunteer.member_name || "",
                email: volunteer.email || "",
                phone: volunteer.phone || "",
                ministry: volunteer.ministry || "hospitality",
                role: volunteer.role || "",
                availability: volunteer.availability || [],
                skills: volunteer.skills || [],
                start_date: volunteer.start_date || "",
                status: volunteer.status || "active",
                background_check: volunteer.background_check || false
            });
        } else {
            setFormData(initialVolunteerState);
        }
    }, [volunteer, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onSubmit(formData);
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{volunteer ? "Edit Volunteer" : "Add New Volunteer"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="member_name">Full Name</Label>
                            <Input id="member_name" name="member_name" value={formData.member_name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ministry">Ministry</Label>
                            <Select value={String(formData.ministry)} onValueChange={(value) => handleSelectChange('ministry', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select ministry" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="worship_team">Worship Team</SelectItem>
                                    <SelectItem value="children_ministry">Children's Ministry</SelectItem>
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
                        <div className="space-y-2">
                            <Label htmlFor="role">Role/Position</Label>
                            <Input id="role" name="role" value={formData.role} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={String(formData.status)} onValueChange={(value) => handleSelectChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="on_break">On Break</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="availability">Availability</Label>
                            <MultiSelect
                                options={availabilityOptions}
                                selected={formData.availability}
                                onChange={(value) => setFormData(prev => ({...prev, availability: value}))}
                                placeholder="Select available times..."
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="skills">Skills & Talents</Label>
                            <MultiSelect
                                options={skillsOptions}
                                selected={formData.skills}
                                onChange={(value) => setFormData(prev => ({...prev, skills: value}))}
                                placeholder="Select skills..."
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="background_check" 
                                    checked={formData.background_check}
                                    onCheckedChange={(checked) => setFormData(prev => ({...prev, background_check: checked}))}
                                />
                                <Label htmlFor="background_check">Background check completed</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Volunteer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}