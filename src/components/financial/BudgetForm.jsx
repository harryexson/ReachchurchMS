import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function BudgetForm({ isOpen, setIsOpen, onSubmit, budget, currentYear }) {
    const [formData, setFormData] = useState({
        budget_year: currentYear,
        category: '',
        ministry_area: '',
        allocated_amount: 0,
        spent_amount: 0,
        quarterly_breakdown: { q1: 0, q2: 0, q3: 0, q4: 0 },
        notes: ''
    });

    useEffect(() => {
        if (budget) {
            setFormData(budget);
        } else {
            setFormData(prev => ({ ...prev, budget_year: currentYear }));
        }
    }, [budget, isOpen, currentYear]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{budget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                            <Label>Budget Year</Label>
                            <Input
                                type="number"
                                value={formData.budget_year}
                                onChange={(e) => setFormData({...formData, budget_year: parseInt(e.target.value)})}
                                required
                            />
                        </div>
                        <div>
                            <Label>Category *</Label>
                            <Input
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                placeholder="e.g., Facilities, Salaries, Ministry"
                                required
                            />
                        </div>
                        <div>
                            <Label>Ministry Area</Label>
                            <Input
                                value={formData.ministry_area}
                                onChange={(e) => setFormData({...formData, ministry_area: e.target.value})}
                                placeholder="e.g., Youth Ministry"
                            />
                        </div>
                        <div>
                            <Label>Total Allocated Amount *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.allocated_amount}
                                onChange={(e) => setFormData({...formData, allocated_amount: parseFloat(e.target.value) || 0})}
                                required
                            />
                        </div>
                        <div>
                            <Label>Spent Amount</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.spent_amount}
                                onChange={(e) => setFormData({...formData, spent_amount: parseFloat(e.target.value) || 0})}
                            />
                        </div>
                        <div className="col-span-2">
                            <Label className="mb-2 block">Quarterly Breakdown (Optional)</Label>
                            <div className="grid grid-cols-4 gap-2">
                                <div>
                                    <Label className="text-xs">Q1</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.quarterly_breakdown?.q1 || 0}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            quarterly_breakdown: { ...formData.quarterly_breakdown, q1: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Q2</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.quarterly_breakdown?.q2 || 0}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            quarterly_breakdown: { ...formData.quarterly_breakdown, q2: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Q3</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.quarterly_breakdown?.q3 || 0}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            quarterly_breakdown: { ...formData.quarterly_breakdown, q3: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Q4</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.quarterly_breakdown?.q4 || 0}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            quarterly_breakdown: { ...formData.quarterly_breakdown, q4: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                            </div>
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
                        <Button type="submit">{budget ? 'Update' : 'Create'} Budget</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}