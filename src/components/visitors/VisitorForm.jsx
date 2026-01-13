import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const initialVisitorState = {
    name: "",
    email: "",
    phone: "",
    address: "",
    visit_date: new Date().toISOString().split('T')[0],
    follow_up_status: "new",
    interests: [],
    notes: "",
    how_did_you_hear: "",
    prayer_requests: "",
    family_info: ""
};

export default function VisitorForm({ isOpen, setIsOpen, onSubmit, visitor }) {
    const [formData, setFormData] = useState(initialVisitorState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (visitor) {
            setFormData({
                name: visitor.name || "",
                email: visitor.email || "",
                phone: visitor.phone || "",
                address: visitor.address || "",
                visit_date: visitor.visit_date || new Date().toISOString().split('T')[0],
                follow_up_status: visitor.follow_up_status || "new",
                interests: visitor.interests || [],
                notes: visitor.notes || "",
                how_did_you_hear: visitor.how_did_you_hear || "",
                prayer_requests: visitor.prayer_requests || "",
                family_info: visitor.family_info || ""
            });
        } else {
            setFormData(initialVisitorState);
        }
    }, [visitor, isOpen]);

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
        // Ensure onSubmit is a function before calling it
        if (typeof onSubmit === 'function') {
            await onSubmit(formData);
        } else {
            console.error("VisitorForm: onSubmit prop is not a function.");
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{visitor ? "Edit Visitor" : "Add New Visitor"}</DialogTitle>
                    <DialogDescription>
                        {visitor ? "Update the details for this visitor." : "Enter the details for a new visitor to start the follow-up process."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Full address" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="visit_date">First Visit Date</Label>
                            <Input id="visit_date" name="visit_date" type="date" value={formData.visit_date} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="how_did_you_hear">How Did You Hear About Us?</Label>
                            <Select name="how_did_you_hear" value={formData.how_did_you_hear} onValueChange={(value) => handleSelectChange('how_did_you_hear', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="friend_family">Friend/Family</SelectItem>
                                    <SelectItem value="social_media">Social Media</SelectItem>
                                    <SelectItem value="website">Website</SelectItem>
                                    <SelectItem value="google_search">Google Search</SelectItem>
                                    <SelectItem value="drove_by">Drove By</SelectItem>
                                    <SelectItem value="event">Church Event</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="family_info">Family Information (Optional)</Label>
                            <Textarea id="family_info" name="family_info" value={formData.family_info} onChange={handleChange} placeholder="e.g., Spouse name, kids (ages), etc." rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prayer_requests">Prayer Requests (Optional)</Label>
                            <Textarea id="prayer_requests" name="prayer_requests" value={formData.prayer_requests} onChange={handleChange} placeholder="Any prayer needs they shared..." rows={2} />
                        </div>
                        {visitor && (
                            <div className="space-y-2">
                                <Label htmlFor="follow_up_status">Follow-up Status</Label>
                                <Select name="follow_up_status" value={formData.follow_up_status} onValueChange={(value) => handleSelectChange('follow_up_status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="contacted_1">Contacted (Step 1)</SelectItem>
                                        <SelectItem value="contacted_2">Contacted (Step 2)</SelectItem>
                                        <SelectItem value="contacted_3">Contacted (Step 3)</SelectItem>
                                        <SelectItem value="contacted_4">Contacted (Step 4)</SelectItem>
                                        <SelectItem value="engaged">Engaged</SelectItem>
                                        <SelectItem value="member">Became Member</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                         <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g., Met them at coffee hour, has two kids..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Visitor"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}