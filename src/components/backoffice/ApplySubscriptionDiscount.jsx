import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign, Percent } from 'lucide-react';

export default function ApplySubscriptionDiscount({ subscription, open, onClose, onSuccess }) {
    const [saving, setSaving] = useState(false);
    const [discountType, setDiscountType] = useState('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [duration, setDuration] = useState('forever');
    const [durationMonths, setDurationMonths] = useState('');
    const [reason, setReason] = useState('');

    const handleApply = async () => {
        if (!discountValue || !reason) {
            alert('Please fill in all required fields');
            return;
        }

        if (duration === 'repeating' && !durationMonths) {
            alert('Please specify number of months for repeating discount');
            return;
        }

        setSaving(true);
        try {
            const response = await base44.functions.invoke('applySubscriptionDiscount', {
                subscription_id: subscription.id,
                discount_type: discountType,
                discount_value: parseFloat(discountValue),
                duration: duration,
                duration_months: duration === 'repeating' ? parseInt(durationMonths) : null,
                reason: reason
            });

            console.log('Discount response:', response);

            alert('Discount applied successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error applying discount:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            const errorDetails = error.response?.data?.details || '';
            alert(`Failed to apply discount: ${errorMsg}${errorDetails ? '\n\nDetails: ' + errorDetails : ''}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Apply Discount - {subscription?.church_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Discount Type *</Label>
                        <Select value={discountType} onValueChange={setDiscountType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Percentage Off</SelectItem>
                                <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Discount Value *</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                placeholder={discountType === 'percentage' ? '25' : '50'}
                                className="pl-8"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                {discountType === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {discountType === 'percentage' ? 'Enter percentage (e.g., 25 for 25% off)' : 'Enter dollar amount (e.g., 50 for $50 off)'}
                        </p>
                    </div>

                    <div>
                        <Label>Duration *</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="once">One Time (Next Invoice Only)</SelectItem>
                                <SelectItem value="repeating">Repeating (Multiple Months)</SelectItem>
                                <SelectItem value="forever">Forever</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {duration === 'repeating' && (
                        <div>
                            <Label>Number of Months *</Label>
                            <Input
                                type="number"
                                value={durationMonths}
                                onChange={(e) => setDurationMonths(e.target.value)}
                                placeholder="3"
                                min="1"
                            />
                        </div>
                    )}

                    <div>
                        <Label>Reason for Discount *</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Customer retention offer, billing issue compensation, special promotion"
                            rows={3}
                        />
                    </div>

                    <div className="bg-blue-50 p-3 rounded text-sm">
                        <strong className="text-blue-900">Preview:</strong>
                        <p className="text-blue-800">
                            {discountType === 'percentage' 
                                ? `${discountValue}% off` 
                                : `$${discountValue} off`
                            } - {duration === 'once' ? 'Next invoice only' : duration === 'forever' ? 'Every invoice' : `Next ${durationMonths} invoices`}
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Applying...
                            </>
                        ) : (
                            'Apply Discount'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}