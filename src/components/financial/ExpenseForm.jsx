import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ExpenseForm({ isOpen, setIsOpen, onSubmit, expense }) {
    const [formData, setFormData] = useState({
        expense_number: '',
        category: 'other',
        description: '',
        amount: 0,
        expense_date: '',
        payment_method: 'credit_card',
        vendor_name: '',
        receipt_url: '',
        check_number: '',
        approval_status: 'pending',
        budget_category: '',
        ministry_area: '',
        notes: ''
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (expense) {
            setFormData(expense);
        } else {
            // Generate expense number
            const expNum = `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
            setFormData(prev => ({ ...prev, expense_number: expNum, expense_date: new Date().toISOString().split('T')[0] }));
        }
    }, [expense, isOpen]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await base44.integrations.Core.UploadFile({ file });
            setFormData(prev => ({ ...prev, receipt_url: response.file_url }));
        } catch (error) {
            alert('Failed to upload receipt');
        }
        setUploading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                            <Label>Expense Number</Label>
                            <Input value={formData.expense_number} readOnly className="bg-slate-50" />
                        </div>
                        <div>
                            <Label>Date *</Label>
                            <Input
                                type="date"
                                value={formData.expense_date}
                                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <Label>Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({...formData, category: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="facilities">Facilities & Rent</SelectItem>
                                    <SelectItem value="utilities">Utilities</SelectItem>
                                    <SelectItem value="salaries">Salaries & Payroll</SelectItem>
                                    <SelectItem value="missions">Missions & Outreach</SelectItem>
                                    <SelectItem value="ministry_programs">Ministry Programs</SelectItem>
                                    <SelectItem value="office_supplies">Office Supplies</SelectItem>
                                    <SelectItem value="marketing">Marketing & Advertising</SelectItem>
                                    <SelectItem value="events">Events & Activities</SelectItem>
                                    <SelectItem value="maintenance">Maintenance & Repairs</SelectItem>
                                    <SelectItem value="insurance">Insurance</SelectItem>
                                    <SelectItem value="professional_services">Professional Services</SelectItem>
                                    <SelectItem value="technology">Technology & Software</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Amount *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <Label>Description *</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <Label>Vendor Name</Label>
                            <Input
                                value={formData.vendor_name}
                                onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Payment Method</Label>
                            <Select
                                value={formData.payment_method}
                                onValueChange={(value) => setFormData({...formData, payment_method: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="debit_card">Debit Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.payment_method === 'check' && (
                            <div>
                                <Label>Check Number</Label>
                                <Input
                                    value={formData.check_number}
                                    onChange={(e) => setFormData({...formData, check_number: e.target.value})}
                                />
                            </div>
                        )}
                        <div>
                            <Label>Ministry Area</Label>
                            <Input
                                value={formData.ministry_area}
                                onChange={(e) => setFormData({...formData, ministry_area: e.target.value})}
                                placeholder="e.g., Youth Ministry"
                            />
                        </div>
                        <div className="col-span-2">
                            <Label>Upload Receipt</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    onChange={handleFileUpload}
                                    accept="image/*,.pdf"
                                    disabled={uploading}
                                />
                                {formData.receipt_url && (
                                    <Button type="button" variant="outline" onClick={() => window.open(formData.receipt_url, '_blank')}>
                                        View
                                    </Button>
                                )}
                            </div>
                            {uploading && <p className="text-sm text-slate-500 mt-1">Uploading...</p>}
                        </div>
                        <div className="col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">{expense ? 'Update' : 'Add'} Expense</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}