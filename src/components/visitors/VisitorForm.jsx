import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

    const handleInterestToggle = (interest) => {
        setFormData(prev => {
            const interests = prev.interests || [];
            const hasInterest = interests.includes(interest);
            return {
                ...prev,
                interests: hasInterest 
                    ? interests.filter(i => i !== interest)
                    : [...interests, interest]
            };
        });
    };

    const availableInterests = [
        "Small Groups",
        "Volunteer/Serving",
        "Kids Ministry",
        "Youth Ministry",
        "Worship Team",
        "Prayer Team",
        "Bible Study",
        "Community Outreach"
    ];

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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{visitor ? "Edit Visitor" : "Add New Visitor"}</DialogTitle>
                    <DialogDescription>
                        {visitor ? "Update the details for this visitor." : "Enter the details for a new visitor to start the follow-up process."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">{/* Contact Information */}
                        <div className="border-b pb-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 123-4567" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Mailing Address</Label>
                                    <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Full address" />
                                </div>
                            </div>
                        </div>

                        {/* Visit Information */}
                        <div className="border-b pb-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Visit Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="visit_date">First Visit Date *</Label>
                                    <Input id="visit_date" name="visit_date" type="date" value={formData.visit_date} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="how_did_you_hear">How Did You Hear About Us?</Label>
                                    <Select name="how_did_you_hear" value={String(formData.how_did_you_hear || "")} onValueChange={(value) => handleSelectChange('how_did_you_hear', value)}>
                                       <SelectTrigger>
                                           <SelectValue placeholder="Select..." />
                                       </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="friend_family">Friend/Family Invitation</SelectItem>
                                            <SelectItem value="social_media">Social Media (Facebook, Instagram)</SelectItem>
                                            <SelectItem value="website">Church Website</SelectItem>
                                            <SelectItem value="google_search">Google Search</SelectItem>
                                            <SelectItem value="drove_by">Drove By Church</SelectItem>
                                            <SelectItem value="event">Special Event</SelectItem>
                                            <SelectItem value="mailer">Postcard/Mailer</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="border-b pb-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Areas of Interest</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {availableInterests.map((interest) => (
                                    <div key={interest} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={interest}
                                            checked={formData.interests?.includes(interest)}
                                            onCheckedChange={() => handleInterestToggle(interest)}
                                        />
                                        <Label htmlFor={interest} className="text-sm font-normal cursor-pointer">
                                            {interest}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Additional Information</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="family_info">Family Information</Label>
                                    <Textarea id="family_info" name="family_info" value={formData.family_info} onChange={handleChange} placeholder="e.g., Spouse: John, Kids: Sarah (8), Mike (5)" rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prayer_requests">Prayer Requests</Label>
                                    <Textarea id="prayer_requests" name="prayer_requests" value={formData.prayer_requests} onChange={handleChange} placeholder="Any prayer needs they shared during their visit..." rows={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Additional Notes</Label>
                                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g., Met them at coffee hour, interested in children's programs, looking for a church home..." rows={3} />
                                </div>
                            </div>
                        </div>
                        {visitor && (
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">Follow-up Status</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="follow_up_status">Current Follow-up Status</Label>
                                    <Select name="follow_up_status" value={String(formData.follow_up_status)} onValueChange={(value) => handleSelectChange('follow_up_status', value)}>
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
                            </div>
                        )}
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