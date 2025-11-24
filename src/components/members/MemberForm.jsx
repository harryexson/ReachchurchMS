import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const initialMemberState = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    member_status: "visitor",
    join_date: "",
    birth_date: "",
    notes: ""
};

export default function MemberForm({ isOpen, setIsOpen, onSubmit, member }) {
    const [formData, setFormData] = useState(initialMemberState);
    const [isLoading, setIsLoading] = useState(false);

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
                notes: member.notes || ""
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
                            <Select name="member_status" value={formData.member_status} onValueChange={(value) => handleSelectChange('member_status', value)}>
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