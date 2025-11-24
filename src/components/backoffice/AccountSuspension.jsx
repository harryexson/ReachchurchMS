import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Ban, PlayCircle, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AccountSuspension({ subscriptions, onRefresh, currentUser }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState('suspend');
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleAction = async (subscription, type) => {
        setSelectedSubscription(subscription);
        setActionType(type);
        setReason('');
        setNotes('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!confirm(`Are you sure you want to ${actionType} this account?`)) return;

        try {
            const newStatus = actionType === 'suspend' ? 'suspended' : 'active';
            
            // Update subscription status
            await base44.entities.Subscription.update(selectedSubscription.id, {
                status: newStatus
            });

            // Log the action
            await base44.entities.AccountAction.create({
                subscription_id: selectedSubscription.id,
                church_name: selectedSubscription.church_name,
                action_type: actionType,
                reason: reason,
                notes: notes,
                performed_by: currentUser.email,
                performed_by_name: currentUser.full_name,
                performed_by_role: 'super_admin',
                customer_notified: false
            });

            setIsModalOpen(false);
            if (onRefresh) onRefresh();
            alert(`Account ${actionType}ed successfully`);
        } catch (error) {
            console.error('Error performing action:', error);
            alert('Failed to perform action');
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub => 
        sub.church_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.church_admin_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            Account Suspension Management
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by church name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Church</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubscriptions.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-semibold">{sub.church_name}</div>
                                            <div className="text-sm text-slate-500">{sub.church_admin_email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{sub.subscription_tier}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={
                                            sub.status === 'active' ? 'bg-green-500' :
                                            sub.status === 'suspended' ? 'bg-red-500' :
                                            sub.status === 'trial' ? 'bg-blue-500' :
                                            'bg-yellow-500'
                                        }>
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        ${sub.monthly_price}/mo
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {sub.status !== 'suspended' ? (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleAction(sub, 'suspend')}
                                                >
                                                    <Ban className="w-4 h-4 mr-1" />
                                                    Suspend
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleAction(sub, 'reactivate')}
                                                >
                                                    <PlayCircle className="w-4 h-4 mr-1" />
                                                    Reactivate
                                                </Button>
                                            )}
                                        </div>
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
                            {actionType === 'suspend' ? 'Suspend Account' : 'Reactivate Account'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {selectedSubscription && (
                            <div className="bg-slate-50 p-4 rounded">
                                <p className="font-semibold">{selectedSubscription.church_name}</p>
                                <p className="text-sm text-slate-600">{selectedSubscription.church_admin_email}</p>
                            </div>
                        )}

                        <div>
                            <Label>Reason *</Label>
                            <select
                                className="w-full p-2 border rounded"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            >
                                <option value="">Select reason...</option>
                                {actionType === 'suspend' ? (
                                    <>
                                        <option value="payment_failure">Payment Failure</option>
                                        <option value="terms_violation">Terms Violation</option>
                                        <option value="fraud_suspected">Fraud Suspected</option>
                                        <option value="customer_request">Customer Request</option>
                                        <option value="abuse">Abuse/Misuse</option>
                                        <option value="other">Other</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="payment_resolved">Payment Resolved</option>
                                        <option value="issue_resolved">Issue Resolved</option>
                                        <option value="customer_request">Customer Request</option>
                                        <option value="other">Other</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div>
                            <Label>Detailed Notes *</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                placeholder="Provide detailed notes about this action..."
                                required
                            />
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                            <p className="text-sm text-yellow-800">
                                <strong>⚠️ Important:</strong> This action will {actionType === 'suspend' ? 'immediately suspend' : 'reactivate'} the account. 
                                {actionType === 'suspend' && ' The customer will lose access to all features.'}
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant={actionType === 'suspend' ? 'destructive' : 'default'}>
                                {actionType === 'suspend' ? 'Suspend Account' : 'Reactivate Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}