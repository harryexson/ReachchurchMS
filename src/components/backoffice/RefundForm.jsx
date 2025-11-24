import React, { useState } from "react";
import { Refund } from "@/entities/Refund";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/entities/User";

export default function RefundForm({ isOpen, setIsOpen, invoice, onSave }) {
    const [formData, setFormData] = useState({
        refund_number: `REF-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        subscription_id: invoice?.subscription_id || "",
        invoice_id: invoice?.id || "",
        church_name: invoice?.church_name || "",
        church_email: invoice?.church_email || "",
        refund_amount: invoice?.total_amount || 0,
        refund_reason: "",
        refund_notes: "",
        status: "pending"
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const currentUser = await User.me();
        
        await Refund.create({
            ...formData,
            requested_by: currentUser.email
        });
        
        onSave();
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Process Refund</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                                <strong>Invoice:</strong> {invoice?.invoice_number}<br />
                                <strong>Church:</strong> {invoice?.church_name}<br />
                                <strong>Original Amount:</strong> ${invoice?.total_amount?.toLocaleString()}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="refund_number">Refund Number</Label>
                                <Input
                                    id="refund_number"
                                    value={formData.refund_number}
                                    onChange={(e) => setFormData({...formData, refund_number: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="refund_amount">Refund Amount</Label>
                                <Input
                                    id="refund_amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.refund_amount}
                                    onChange={(e) => setFormData({...formData, refund_amount: parseFloat(e.target.value) || 0})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="refund_reason">Refund Reason</Label>
                            <Select value={formData.refund_reason} onValueChange={(value) => setFormData({...formData, refund_reason: value})} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer_request">Customer Request</SelectItem>
                                    <SelectItem value="duplicate_payment">Duplicate Payment</SelectItem>
                                    <SelectItem value="service_issue">Service Issue</SelectItem>
                                    <SelectItem value="cancelled_subscription">Cancelled Subscription</SelectItem>
                                    <SelectItem value="billing_error">Billing Error</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="refund_notes">Refund Notes</Label>
                            <Textarea
                                id="refund_notes"
                                value={formData.refund_notes}
                                onChange={(e) => setFormData({...formData, refund_notes: e.target.value})}
                                placeholder="Provide details about why this refund is being processed..."
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                            Submit Refund Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}