import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/MultiSelect";

const subscriptionFeatures = [
    { value: "member_management", label: "Member Management" },
    { value: "event_planning", label: "Event Planning" },
    { value: "giving_tracking", label: "Giving Tracking" },
    { value: "volunteer_coordination", label: "Volunteer Coordination" },
    { value: "communications", label: "Communications Hub" },
    { value: "reports_analytics", label: "Reports & Analytics" },
    { value: "livestream", label: "Livestream Integration" },
    { value: "mobile_app", label: "Mobile App Access" },
    { value: "advanced_security", label: "Advanced Security" },
    { value: "priority_support", label: "Priority Support" },
    { value: "custom_branding", label: "Custom Branding" },
    { value: "api_access", label: "API Access" },
    { value: "unlimited_users", label: "Unlimited Users" },
    { value: "data_export", label: "Data Export" },
    { value: "integrations", label: "Third-party Integrations" }
];

const tierPricing = {
    basic: { price: 49, users: 5, features: ["member_management", "event_planning", "giving_tracking"] },
    standard: { price: 99, users: 25, features: ["member_management", "event_planning", "giving_tracking", "volunteer_coordination", "communications", "reports_analytics", "livestream"] },
    premium: { price: 199, users: -1, features: ["member_management", "event_planning", "giving_tracking", "volunteer_coordination", "communications", "reports_analytics", "livestream", "mobile_app", "advanced_security", "priority_support", "custom_branding", "api_access", "unlimited_users", "data_export", "integrations"] }
};

const initialSubscriptionState = {
    church_name: "",
    church_admin_email: "",
    subscription_tier: "basic",
    billing_cycle: "monthly",
    monthly_price: "",
    status: "trial",
    trial_end_date: "",
    next_billing_date: "",
    member_count: "",
    user_limit: "",
    features: [],
    notes: ""
};

export default function SubscriptionForm({ isOpen, setIsOpen, onSubmit, subscription }) {
    const [formData, setFormData] = useState(initialSubscriptionState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (subscription) {
            setFormData({
                church_name: subscription.church_name || "",
                church_admin_email: subscription.church_admin_email || "",
                subscription_tier: subscription.subscription_tier || "basic",
                billing_cycle: subscription.billing_cycle || "monthly",
                monthly_price: subscription.monthly_price?.toString() || "",
                status: subscription.status || "trial",
                trial_end_date: subscription.trial_end_date || "",
                next_billing_date: subscription.next_billing_date || "",
                member_count: subscription.member_count?.toString() || "",
                user_limit: subscription.user_limit?.toString() || "",
                features: subscription.features || [],
                notes: subscription.notes || ""
            });
        } else {
            setFormData(initialSubscriptionState);
        }
    }, [subscription, isOpen]);

    useEffect(() => {
        // Auto-populate pricing and features based on tier
        const tierInfo = tierPricing[formData.subscription_tier];
        if (tierInfo) {
            setFormData(prev => ({
                ...prev,
                monthly_price: tierInfo.price.toString(),
                user_limit: tierInfo.users === -1 ? "999" : tierInfo.users.toString(),
                features: tierInfo.features
            }));
        }
    }, [formData.subscription_tier]);

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
        await onSubmit({
            ...formData,
            monthly_price: formData.monthly_price ? parseFloat(formData.monthly_price) : null,
            member_count: formData.member_count ? parseInt(formData.member_count) : null,
            user_limit: formData.user_limit ? parseInt(formData.user_limit) : null
        });
        setIsLoading(false);
    };

    const selectedTierInfo = tierPricing[formData.subscription_tier];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{subscription ? "Edit Subscription" : "Add New Subscription"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-4">
                        {/* Left Column - Basic Info */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Church Information</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="church_name">Church Name</Label>
                                    <Input id="church_name" name="church_name" value={formData.church_name} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="church_admin_email">Admin Email</Label>
                                    <Input id="church_admin_email" name="church_admin_email" type="email" value={formData.church_admin_email} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="member_count">Church Size (Members)</Label>
                                    <Input id="member_count" name="member_count" type="number" value={formData.member_count} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Subscription Details */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Subscription Details</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="subscription_tier">Subscription Tier</Label>
                                    <Select value={formData.subscription_tier} onValueChange={(value) => handleSelectChange('subscription_tier', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select tier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Basic - $49/month</span>
                                                    <span className="text-sm text-slate-500">Up to 5 users • Essential features</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="standard">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Standard - $99/month</span>
                                                    <span className="text-sm text-slate-500">Up to 25 users • Advanced features</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="premium">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Premium - $199/month</span>
                                                    <span className="text-sm text-slate-500">Unlimited users • All features</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="trial">14-Day Free Trial</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="past_due">Past Due</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="billing_cycle">Billing Cycle</Label>
                                    <Select value={formData.billing_cycle} onValueChange={(value) => handleSelectChange('billing_cycle', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select cycle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="annually">Annual (10% discount)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="trial_end_date">Trial End Date</Label>
                                        <Input id="trial_end_date" name="trial_end_date" type="date" value={formData.trial_end_date} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="next_billing_date">Next Billing</Label>
                                        <Input id="next_billing_date" name="next_billing_date" type="date" value={formData.next_billing_date} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Pricing & Features */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Pricing & Features</h3>
                                
                                {/* Pricing Card */}
                                <div className="p-4 bg-blue-50 rounded-lg border">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600">
                                            ${selectedTierInfo?.price}
                                            <span className="text-sm font-normal text-slate-600">/month</span>
                                        </div>
                                        <div className="text-sm text-slate-600 mt-1">
                                            {selectedTierInfo?.users === -1 ? "Unlimited users" : `Up to ${selectedTierInfo?.users} users`}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="monthly_price">Custom Monthly Price (override)</Label>
                                    <Input 
                                        id="monthly_price" 
                                        name="monthly_price" 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.monthly_price} 
                                        onChange={handleChange}
                                        placeholder={`Default: $${selectedTierInfo?.price}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="user_limit">User Limit Override</Label>
                                    <Input 
                                        id="user_limit" 
                                        name="user_limit" 
                                        type="number" 
                                        value={formData.user_limit} 
                                        onChange={handleChange}
                                        placeholder={selectedTierInfo?.users === -1 ? "Unlimited" : selectedTierInfo?.users.toString()}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Features Included</Label>
                                    <div className="max-h-32 overflow-y-auto">
                                        <MultiSelect
                                            options={subscriptionFeatures}
                                            selected={formData.features}
                                            onChange={(value) => setFormData(prev => ({...prev, features: value}))}
                                            placeholder="Select features..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Internal Notes</Label>
                                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Subscription"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}