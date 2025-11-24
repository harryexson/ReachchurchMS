import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Receipt, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function RefundProcessing({ refunds, subscriptions, invoices, isLoading, onRefresh, currentUser }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [action, setAction] = useState('approve');
    const [notes, setNotes] = useState('');

    const handleRefundAction = async (refund, actionType) => {
        setSelectedRefund(refund);
        setAction(actionType);
        setNotes('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!confirm(`Are you sure you want to ${action} this refund?`)) return;

        try {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            
            await base44.entities.Refund.update(selectedRefund.id, {
                status: newStatus,
                approved_by: currentUser.email,
                processed_date: new Date().toISOString(),
                refund_notes: `${selectedRefund.refund_notes || ''}\n\n[${action.toUpperCase()}] ${notes}`
            });

            // Log the action
            await base44.entities.AccountAction.create({
                subscription_id: selectedRefund.subscription_id,
                church_name: selectedRefund.church_name,
                action_type: 'refund',
                reason: `Refund ${action}ed`,
                notes: notes,
                amount: selectedRefund.refund_amount,
                performed_by: currentUser.email,
                performed_by_name: currentUser.full_name,
                performed_by_role: 'accounting'
            });

            setIsModalOpen(false);
            if (onRefresh) onRefresh();
            alert(`Refund ${action}ed successfully`);
        } catch (error) {
            console.error('Error processing refund:', error);
            alert('Failed to process refund');
        }
    };

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-blue-100 text-blue-800',
        processing: 'bg-purple-100 text-purple-800',
        completed: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
    };

    const pendingRefunds = refunds.filter(r => r.status === 'pending');
    const processingRefunds = refunds.filter(r => ['approved', 'processing'].includes(r.status));
    const completedRefunds = refunds.filter(r => ['completed', 'rejected'].includes(r.status));

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Pending</p>
                                <p className="text-2xl font-bold">{pendingRefunds.length}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Processing</p>
                                <p className="text-2xl font-bold">{processingRefunds.length}</p>
                            </div>
                            <Receipt className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Completed</p>
                                <p className="text-2xl font-bold">{completedRefunds.length}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Amount</p>
                                <p className="text-2xl font-bold">
                                    ${refunds.reduce((sum, r) => sum + r.refund_amount, 0).toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Refund Processing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Church</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {refunds.slice(0, 20).map(refund => (
                                <TableRow key={refund.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-semibold">{refund.church_name}</div>
                                            <div className="text-sm text-slate-500">{refund.church_email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-red-600">
                                        ${refund.refund_amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-xs">
                                            <p className="text-sm font-semibold">{refund.refund_reason.replace('_', ' ')}</p>
                                            {refund.refund_notes && (
                                                <p className="text-xs text-slate-500 truncate">{refund.refund_notes}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(refund.created_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[refund.status]}>
                                            {refund.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {refund.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleRefundAction(refund, 'approve')}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleRefundAction(refund, 'reject')}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {action === 'approve' ? 'Approve Refund' : 'Reject Refund'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {selectedRefund && (
                            <div className="bg-slate-50 p-4 rounded space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-semibold">{selectedRefund.church_name}</span>
                                    <span className="text-2xl font-bold text-red-600">
                                        ${selectedRefund.refund_amount.toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600">Reason: {selectedRefund.refund_reason.replace('_', ' ')}</p>
                                {selectedRefund.refund_notes && (
                                    <p className="text-sm text-slate-600">Notes: {selectedRefund.refund_notes}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <Label>Processing Notes *</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                placeholder={action === 'approve' ? 
                                    'Enter approval notes and next steps...' : 
                                    'Explain why this refund is being rejected...'
                                }
                                required
                            />
                        </div>

                        <div className={`${action === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border p-4 rounded`}>
                            <p className="text-sm">
                                <strong>⚠️ Confirm:</strong> {action === 'approve' ? 
                                    'This will approve the refund and require processing through Stripe.' :
                                    'This will permanently reject the refund request.'
                                }
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant={action === 'approve' ? 'default' : 'destructive'}>
                                {action === 'approve' ? 'Approve Refund' : 'Reject Refund'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}