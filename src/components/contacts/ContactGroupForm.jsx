import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/MultiSelect";

export default function ContactGroupForm({ isOpen, setIsOpen, onSubmit, group, members = [], volunteers = [] }) {
    const [formData, setFormData] = useState({
        group_name: "",
        description: "",
        group_type: "custom",
        leader_email: "",
        leader_name: "",
        member_emails: [],
        access_level: "admin_only",
        is_active: true
    });

    useEffect(() => {
        if (group) {
            setFormData({
                group_name: group.group_name || "",
                description: group.description || "",
                group_type: group.group_type || "custom",
                leader_email: group.leader_email || "",
                leader_name: group.leader_name || "",
                member_emails: group.member_emails || [],
                access_level: group.access_level || "admin_only",
                is_active: group.is_active !== false
            });
        }
    }, [group]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit({
            ...formData,
            member_count: formData.member_emails.length
        });
    };

    // Create options for MultiSelect from members and volunteers
    const emailOptions = [
        ...members.map(m => ({ value: m.email, label: `${m.first_name} ${m.last_name} (${m.email})` })),
        ...volunteers.map(v => ({ value: v.email, label: `${v.member_name} (${v.email})` }))
    ].filter(opt => opt.value); // Filter out any without email

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{group ? "Edit Contact Group" : "Create Contact Group"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="group_name">Group Name</Label>
                            <Input id="group_name" name="group_name" value={formData.group_name} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="group_type">Group Type</Label>
                            <Select value={formData.group_type} onValueChange={(value) => handleSelectChange('group_type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ministry">Ministry Team</SelectItem>
                                    <SelectItem value="volunteer_team">Volunteer Team</SelectItem>
                                    <SelectItem value="event">Event Group</SelectItem>
                                    <SelectItem value="age_group">Age Group</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="access_level">Access Level</Label>
                            <Select value={formData.access_level} onValueChange={(value) => handleSelectChange('access_level', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Who can access" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin_only">Admins Only</SelectItem>
                                    <SelectItem value="leaders">Leaders</SelectItem>
                                    <SelectItem value="all_staff">All Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="leader_name">Leader Name</Label>
                            <Input id="leader_name" name="leader_name" value={formData.leader_name} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="leader_email">Leader Email</Label>
                            <Input id="leader_email" name="leader_email" type="email" value={formData.leader_email} onChange={handleChange} />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Group Members</Label>
                            <MultiSelect
                                options={emailOptions}
                                selected={formData.member_emails}
                                onChange={(emails) => handleSelectChange('member_emails', emails)}
                                placeholder="Select members..."
                            />
                            <p className="text-xs text-slate-500">{formData.member_emails.length} members selected</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Save Group
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}