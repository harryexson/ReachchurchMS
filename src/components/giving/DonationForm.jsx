import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const initialDonationState = {
    donor_name: "",
    donor_email: "",
    amount: "",
    donation_type: "offering",
    payment_method: "online",
    donation_date: new Date().toISOString().split('T')[0],
    recurring: false,
    recurring_frequency: "monthly",
    campaign: "",
    notes: ""
};

export default function DonationForm({ isOpen, setIsOpen, onSubmit, donation, members }) {
    const [formData, setFormData] = useState(initialDonationState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (donation) {
            setFormData({
                donor_name: donation.donor_name || "",
                donor_email: donation.donor_email || "",
                amount: donation.amount?.toString() || "",
                donation_type: donation.donation_type || "offering",
                payment_method: donation.payment_method || "online",
                donation_date: donation.donation_date || new Date().toISOString().split('T')[0],
                recurring: donation.recurring || false,
                recurring_frequency: donation.recurring_frequency || "monthly",
                campaign: donation.campaign || "",
                notes: donation.notes || ""
            });
        } else {
            setFormData(initialDonationState);
        }
    }, [donation, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onSubmit({
            ...formData,
            amount: parseFloat(formData.amount)
        });
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{donation ? "Edit Donation" : "Record New Donation"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="donor_name">Donor Name</Label>
                            <Input id="donor_name" name="donor_name" value={formData.donor_name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="donor_email">Donor Email</Label>
                            <Input id="donor_email" name="donor_email" type="email" value={formData.donor_email} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" name="amount" type="number" min="0" step="0.01" value={formData.amount} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="donation_type">Donation Type</Label>
                            <Select value={formData.donation_type} onValueChange={(value) => handleSelectChange('donation_type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tithe">Tithe</SelectItem>
                                    <SelectItem value="offering">Offering</SelectItem>
                                    <SelectItem value="building_fund">Building Fund</SelectItem>
                                    <SelectItem value="missions">Missions</SelectItem>
                                    <SelectItem value="special_event">Special Event</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Payment Method</Label>
                            <Select value={formData.payment_method} onValueChange={(value) => handleSelectChange('payment_method', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="donation_date">Donation Date</Label>
                            <Input id="donation_date" name="donation_date" type="date" value={formData.donation_date} onChange={handleChange} required />
                        </div>
                        
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="recurring" 
                                    checked={formData.recurring}
                                    onCheckedChange={(checked) => setFormData(prev => ({...prev, recurring: checked}))}
                                />
                                <Label htmlFor="recurring">This is a recurring donation</Label>
                            </div>
                            
                            {formData.recurring && (
                                <div className="space-y-2">
                                    <Label htmlFor="recurring_frequency">Frequency</Label>
                                    <Select value={formData.recurring_frequency} onValueChange={(value) => handleSelectChange('recurring_frequency', value)}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="annually">Annually</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="campaign">Campaign (Optional)</Label>
                            <Input id="campaign" name="campaign" value={formData.campaign} onChange={handleChange} placeholder="Building Fund 2024, etc." />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Donation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}