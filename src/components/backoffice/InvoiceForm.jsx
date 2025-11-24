import React, { useState } from "react";
import { Invoice } from "@/entities/Invoice";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function InvoiceForm({ isOpen, setIsOpen, invoice, subscriptions, onSave }) {
    const [formData, setFormData] = useState({
        invoice_number: invoice?.invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        subscription_id: invoice?.subscription_id || "",
        church_name: invoice?.church_name || "",
        church_email: invoice?.church_email || "",
        amount: invoice?.amount || 0,
        tax_amount: invoice?.tax_amount || 0,
        total_amount: invoice?.total_amount || 0,
        status: invoice?.status || "draft",
        due_date: invoice?.due_date || "",
        notes: invoice?.notes || ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (invoice) {
            await Invoice.update(invoice.id, formData);
        } else {
            await Invoice.create(formData);
        }
        
        onSave();
        setIsOpen(false);
    };

    const handleSubscriptionChange = (subscriptionId) => {
        const subscription = subscriptions.find(s => s.id === subscriptionId);
        if (subscription) {
            const amount = subscription.monthly_price || 0;
            const taxAmount = amount * 0.08; // 8% tax
            setFormData({
                ...formData,
                subscription_id: subscriptionId,
                church_name: subscription.church_name,
                church_email: subscription.church_admin_email,
                amount: amount,
                tax_amount: taxAmount,
                total_amount: amount + taxAmount
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoice_number">Invoice Number</Label>
                                <Input
                                    id="invoice_number"
                                    value={formData.invoice_number}
                                    onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subscription">Subscription</Label>
                                <Select value={formData.subscription_id} onValueChange={handleSubscriptionChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subscription" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subscriptions.map(sub => (
                                            <SelectItem key={sub.id} value={sub.id}>
                                                {sub.church_name} - {sub.subscription_tier}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="church_name">Church Name</Label>
                                <Input
                                    id="church_name"
                                    value={formData.church_name}
                                    onChange={(e) => setFormData({...formData, church_name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="church_email">Church Email</Label>
                                <Input
                                    id="church_email"
                                    type="email"
                                    value={formData.church_email}
                                    onChange={(e) => setFormData({...formData, church_email: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => {
                                        const amount = parseFloat(e.target.value) || 0;
                                        const taxAmount = formData.tax_amount;
                                        setFormData({...formData, amount, total_amount: amount + taxAmount});
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax_amount">Tax Amount</Label>
                                <Input
                                    id="tax_amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.tax_amount}
                                    onChange={(e) => {
                                        const taxAmount = parseFloat(e.target.value) || 0;
                                        setFormData({...formData, tax_amount: taxAmount, total_amount: formData.amount + taxAmount});
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="total_amount">Total Amount</Label>
                                <Input
                                    id="total_amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.total_amount}
                                    readOnly
                                    className="bg-slate-50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="due_date">Due Date</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Internal Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            {invoice ? 'Update' : 'Create'} Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}