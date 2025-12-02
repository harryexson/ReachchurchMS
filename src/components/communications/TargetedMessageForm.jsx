import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, MessageSquare, Target, X } from "lucide-react";

const MINISTRY_AREAS = [
    "worship_team", "children_ministry", "youth_ministry", "hospitality",
    "security", "media_tech", "prayer_team", "outreach", "administration", "maintenance"
];

const MEMBER_STATUSES = ["member", "visitor", "regular_attendee", "inactive"];

export default function TargetedMessageForm({ isOpen, onClose, onSave, message, members, volunteers }) {
    const [formData, setFormData] = useState({
        title: "",
        message_body: "",
        channel: "email",
        target_type: "all_members",
        target_criteria: {
            ministry_areas: [],
            member_statuses: [],
            volunteer_roles: [],
            custom_emails: []
        },
        status: "draft"
    });
    const [customEmail, setCustomEmail] = useState("");

    useEffect(() => {
        if (message) {
            setFormData({
                title: message.title || "",
                message_body: message.message_body || "",
                channel: message.channel || "email",
                target_type: message.target_type || "all_members",
                target_criteria: message.target_criteria || {
                    ministry_areas: [],
                    member_statuses: [],
                    volunteer_roles: [],
                    custom_emails: []
                },
                status: message.status || "draft"
            });
        } else {
            setFormData({
                title: "",
                message_body: "",
                channel: "email",
                target_type: "all_members",
                target_criteria: {
                    ministry_areas: [],
                    member_statuses: [],
                    volunteer_roles: [],
                    custom_emails: []
                },
                status: "draft"
            });
        }
    }, [message, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const toggleMinistryArea = (area) => {
        const areas = formData.target_criteria.ministry_areas || [];
        const updated = areas.includes(area) 
            ? areas.filter(a => a !== area)
            : [...areas, area];
        setFormData({
            ...formData,
            target_criteria: { ...formData.target_criteria, ministry_areas: updated }
        });
    };

    const toggleMemberStatus = (status) => {
        const statuses = formData.target_criteria.member_statuses || [];
        const updated = statuses.includes(status)
            ? statuses.filter(s => s !== status)
            : [...statuses, status];
        setFormData({
            ...formData,
            target_criteria: { ...formData.target_criteria, member_statuses: updated }
        });
    };

    const addCustomEmail = () => {
        if (customEmail && customEmail.includes("@")) {
            const emails = formData.target_criteria.custom_emails || [];
            if (!emails.includes(customEmail)) {
                setFormData({
                    ...formData,
                    target_criteria: { ...formData.target_criteria, custom_emails: [...emails, customEmail] }
                });
            }
            setCustomEmail("");
        }
    };

    const removeCustomEmail = (email) => {
        const emails = formData.target_criteria.custom_emails || [];
        setFormData({
            ...formData,
            target_criteria: { ...formData.target_criteria, custom_emails: emails.filter(e => e !== email) }
        });
    };

    const getEstimatedRecipients = () => {
        switch (formData.target_type) {
            case "all_members":
                return members.filter(m => m.email).length;
            case "volunteers":
                const areas = formData.target_criteria.ministry_areas || [];
                if (areas.length) {
                    return volunteers.filter(v => areas.includes(v.ministry)).length;
                }
                return volunteers.length;
            case "ministry_group":
                const ministryAreas = formData.target_criteria.ministry_areas || [];
                return volunteers.filter(v => ministryAreas.includes(v.ministry)).length;
            case "member_status":
                const statuses = formData.target_criteria.member_statuses || [];
                return members.filter(m => statuses.includes(m.member_status)).length;
            case "custom":
                return formData.target_criteria.custom_emails?.length || 0;
            default:
                return 0;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        {message ? "Edit Message" : "Create Targeted Message"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Subject / Title *</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="Message subject..."
                            required
                        />
                    </div>

                    <div>
                        <Label>Message Body *</Label>
                        <Textarea
                            value={formData.message_body}
                            onChange={(e) => setFormData({...formData, message_body: e.target.value})}
                            placeholder="Your message... Use {name} to personalize with recipient's name"
                            rows={5}
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Tip: Use {"{name}"} to personalize with the recipient's name
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Delivery Channel</Label>
                            <Select
                                value={formData.channel}
                                onValueChange={(value) => setFormData({...formData, channel: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" /> Email Only
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="sms">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" /> SMS Only
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="both">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Email + SMS
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Target Audience</Label>
                            <Select
                                value={formData.target_type}
                                onValueChange={(value) => setFormData({...formData, target_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_members">All Members</SelectItem>
                                    <SelectItem value="volunteers">Volunteers</SelectItem>
                                    <SelectItem value="donors">Donors</SelectItem>
                                    <SelectItem value="ministry_group">Ministry Group</SelectItem>
                                    <SelectItem value="member_status">By Member Status</SelectItem>
                                    <SelectItem value="custom">Custom List</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Ministry Group Selection */}
                    {(formData.target_type === "volunteers" || formData.target_type === "ministry_group") && (
                        <div>
                            <Label>Select Ministry Areas</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                                {MINISTRY_AREAS.map(area => (
                                    <div key={area} className="flex items-center gap-2">
                                        <Checkbox
                                            id={area}
                                            checked={formData.target_criteria.ministry_areas?.includes(area)}
                                            onCheckedChange={() => toggleMinistryArea(area)}
                                        />
                                        <label htmlFor={area} className="text-sm cursor-pointer capitalize">
                                            {area.replace("_", " ")}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Member Status Selection */}
                    {formData.target_type === "member_status" && (
                        <div>
                            <Label>Select Member Statuses</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-lg">
                                {MEMBER_STATUSES.map(status => (
                                    <div key={status} className="flex items-center gap-2">
                                        <Checkbox
                                            id={status}
                                            checked={formData.target_criteria.member_statuses?.includes(status)}
                                            onCheckedChange={() => toggleMemberStatus(status)}
                                        />
                                        <label htmlFor={status} className="text-sm cursor-pointer capitalize">
                                            {status.replace("_", " ")}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom Email List */}
                    {formData.target_type === "custom" && (
                        <div>
                            <Label>Add Email Addresses</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    type="email"
                                    value={customEmail}
                                    onChange={(e) => setCustomEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomEmail())}
                                />
                                <Button type="button" onClick={addCustomEmail} variant="outline">
                                    Add
                                </Button>
                            </div>
                            {formData.target_criteria.custom_emails?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.target_criteria.custom_emails.map(email => (
                                        <Badge key={email} variant="outline" className="gap-1">
                                            {email}
                                            <button type="button" onClick={() => removeCustomEmail(email)}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estimated Recipients */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <Users className="w-4 h-4 inline mr-2" />
                            Estimated recipients: <strong>{getEstimatedRecipients()}</strong>
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            {message ? "Update" : "Save"} Message
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}