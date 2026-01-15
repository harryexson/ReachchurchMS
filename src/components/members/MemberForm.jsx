import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

const initialMemberState = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    member_status: "visitor",
    join_date: "",
    birth_date: "",
    notes: "",
    tags: [],
    custom_fields: {}
};

export default function MemberForm({ isOpen, setIsOpen, onSubmit, member, customFields = [] }) {
    const [formData, setFormData] = useState(initialMemberState);
    const [isLoading, setIsLoading] = useState(false);
    const [newTag, setNewTag] = useState("");

    useEffect(() => {
        if (member) {
            setFormData({
                first_name: member.first_name || "",
                last_name: member.last_name || "",
                email: member.email || "",
                phone: member.phone || "",
                address: member.address || "",
                member_status: member.member_status || "visitor",
                join_date: member.join_date || "",
                birth_date: member.birth_date || "",
                notes: member.notes || "",
                tags: member.tags || [],
                custom_fields: member.custom_fields || {}
            });
        } else {
            setFormData(initialMemberState);
        }
    }, [member, isOpen]);

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

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleCustomFieldChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            custom_fields: {
                ...prev.custom_fields,
                [fieldName]: value
            }
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{member ? "Edit Member" : "Add New Member"}</DialogTitle>
                    <DialogDescription>
                        {member ? "Update the details for this member." : "Enter the details for the new member."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="member_status">Status</Label>
                            <Select name="member_status" value={String(formData.member_status)} onValueChange={(value) => handleSelectChange('member_status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="visitor">Visitor</SelectItem>
                                    <SelectItem value="regular_attendee">Regular Attendee</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="join_date">Join Date</Label>
                            <Input id="join_date" name="join_date" type="date" value={formData.join_date} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birth_date">Birth Date</Label>
                            <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} />
                        </div>
                         <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
                        </div>

                        {/* Tags Section */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add a tag (e.g., VIP, Leader)"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <Button type="button" onClick={addTag} variant="outline">
                                    Add
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="bg-purple-50">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-1 hover:text-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Custom Fields Section */}
                        {customFields.length > 0 && (
                            <div className="col-span-1 md:col-span-2">
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="font-semibold mb-4 text-slate-900">Custom Fields</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {customFields.map(field => (
                                            <div key={field.id} className="space-y-2">
                                                <Label>
                                                    {field.field_label}
                                                    {field.is_required && <span className="text-red-500">*</span>}
                                                </Label>
                                                
                                                {field.field_type === "text" && (
                                                    <Input
                                                        value={formData.custom_fields[field.field_name] || ""}
                                                        onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                                                        required={field.is_required}
                                                    />
                                                )}
                                                
                                                {field.field_type === "number" && (
                                                    <Input
                                                        type="number"
                                                        value={formData.custom_fields[field.field_name] || ""}
                                                        onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                                                        required={field.is_required}
                                                    />
                                                )}
                                                
                                                {field.field_type === "date" && (
                                                    <Input
                                                        type="date"
                                                        value={formData.custom_fields[field.field_name] || ""}
                                                        onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                                                        required={field.is_required}
                                                    />
                                                )}
                                                
                                                {field.field_type === "boolean" && (
                                                    <Switch
                                                        checked={formData.custom_fields[field.field_name] || false}
                                                        onCheckedChange={(checked) => handleCustomFieldChange(field.field_name, checked)}
                                                    />
                                                )}
                                                
                                                {field.field_type === "select" && (
                                                    <Select
                                                        value={String(formData.custom_fields[field.field_name] || "")}
                                                        onValueChange={(value) => handleCustomFieldChange(field.field_name, value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {field.field_options?.map(option => (
                                                                <SelectItem key={option} value={option}>
                                                                    {option}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                                
                                                {field.field_type === "textarea" && (
                                                    <Textarea
                                                        value={formData.custom_fields[field.field_name] || ""}
                                                        onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                                                        required={field.is_required}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Member"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}