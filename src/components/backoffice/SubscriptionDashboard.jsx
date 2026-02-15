import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CreditCard, Pause, Play, Trash2, MessageSquare, FileText, Phone, Mail, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function SubscriptionDashboard({ subscriptions, isLoading, onRefresh, canManage }) {
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [showActionsDialog, setShowActionsDialog] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [actionNote, setActionNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const statusColors = {
        active: "bg-green-100 text-green-800",
        trial: "bg-blue-100 text-blue-800",
        past_due: "bg-yellow-100 text-yellow-800",
        suspended: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-800"
    };

    const tierColors = {
        starter: "bg-slate-100 text-slate-800",
        growth: "bg-blue-100 text-blue-800",
        premium: "bg-purple-100 text-purple-800"
    };

    const handleOpenActions = (subscription, type) => {
        setSelectedSubscription(subscription);
        setActionType(type);
        setShowActionsDialog(true);
        setActionNote("");
    };

    const handleDeleteSubscription = async (subscription) => {
        if (!confirm(`Are you sure you want to delete the subscription for ${subscription.church_name}? This action cannot be undone.`)) {
            return;
        }

        setIsSaving(true);
        try {
            await base44.entities.Subscription.delete(subscription.id);
            onRefresh();
        } catch (error) {
            console.error('Error deleting subscription:', error);
            alert('Failed to delete subscription');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAction = async () => {
        if (!selectedSubscription || !actionNote.trim()) return;
        
        setIsSaving(true);
        try {
            // Create interaction record
            await base44.entities.CustomerInteraction.create({
                church_name: selectedSubscription.church_name,
                contact_person: selectedSubscription.church_admin_email.split('@')[0],
                contact_email: selectedSubscription.church_admin_email,
                interaction_type: actionType === 'note' ? 'chat' : actionType,
                subject: `${actionType === 'note' ? 'Internal Note' : actionType === 'support' ? 'Support Ticket' : 'Call'} - ${selectedSubscription.church_name}`,
                notes: actionNote,
                outcome: 'neutral',
                team_member: 'Back Office Team'
            });

            // If support ticket, also create SupportTicket
            if (actionType === 'support') {
                await base44.entities.SupportTicket.create({
                    ticket_id: `TICKET-${Date.now()}`,
                    church_name: selectedSubscription.church_name,
                    contact_email: selectedSubscription.church_admin_email,
                    contact_name: selectedSubscription.church_admin_email.split('@')[0],
                    subject: `Subscription Support - ${selectedSubscription.church_name}`,
                    description: actionNote,
                    priority: 'medium',
                    category: 'billing',
                    status: 'open'
                });
            }

            setShowActionsDialog(false);
            setActionNote("");
            onRefresh();
        } catch (error) {
            console.error('Error saving action:', error);
            alert('Failed to save action');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Subscription Management</span>
                    <Button onClick={onRefresh} variant="outline" size="sm">
                        Refresh Data
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Church</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Next Billing</TableHead>
                                <TableHead className="text-center">Details</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                subscriptions.map(subscription => (
                                    <TableRow key={subscription.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-semibold">{subscription.church_name}</div>
                                                <div className="text-sm text-slate-500">{subscription.church_admin_email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={tierColors[subscription.subscription_tier]}>
                                                {subscription.subscription_tier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[subscription.status]}>
                                                {subscription.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            ${subscription.monthly_price}
                                        </TableCell>
                                        <TableCell>
                                            {subscription.next_billing_date ? 
                                                format(new Date(subscription.next_billing_date), 'MMM d, yyyy') : 'N/A'
                                            }
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                onClick={() => handleOpenActions(subscription, 'details')}
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleOpenActions(subscription, 'note')}
                                                    title="Add Note"
                                                >
                                                    <MessageSquare className="w-3 h-3" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleOpenActions(subscription, 'support')}
                                                    title="Create Support Ticket"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleOpenActions(subscription, 'call')}
                                                    title="Log Call"
                                                >
                                                    <Phone className="w-3 h-3" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => window.location.href = `mailto:${subscription.church_admin_email}`}
                                                    title="Send Email"
                                                >
                                                    <Mail className="w-3 h-3" />
                                                </Button>
                                                {canManage && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="destructive"
                                                        onClick={() => handleDeleteSubscription(subscription)}
                                                        disabled={isSaving}
                                                        title="Delete Subscription"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Dialog open={showActionsDialog} onOpenChange={setShowActionsDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {actionType === 'note' && '📝 Add Note'}
                                {actionType === 'support' && '🎫 Create Support Ticket'}
                                {actionType === 'call' && '📞 Log Call'}
                                {actionType === 'details' && '📋 Subscription Details'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {actionType !== 'details' && selectedSubscription && (
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="font-semibold">{selectedSubscription.church_name}</p>
                                    <p className="text-sm text-slate-600">{selectedSubscription.church_admin_email}</p>
                                    <Badge className="mt-2">{selectedSubscription.subscription_tier}</Badge>
                                </div>
                            )}
                            
                            {actionType === 'details' ? (
                                <div className="bg-slate-50 p-4 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
                                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                                        {JSON.stringify(selectedSubscription, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <div>
                                    <Label>
                                        {actionType === 'note' && 'Note Details'}
                                        {actionType === 'support' && 'Ticket Description'}
                                        {actionType === 'call' && 'Call Summary'}
                                    </Label>
                                    <Textarea
                                        value={actionNote}
                                        onChange={(e) => setActionNote(e.target.value)}
                                        placeholder={
                                            actionType === 'note' ? 'Enter internal note...' :
                                            actionType === 'support' ? 'Describe the issue...' :
                                            'Summarize the call...'
                                        }
                                        rows={6}
                                        className="mt-2"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowActionsDialog(false)}
                                    disabled={isSaving}
                                >
                                    {actionType === 'details' ? 'Close' : 'Cancel'}
                                </Button>
                                {actionType !== 'details' && (
                                    <Button
                                        onClick={handleSaveAction}
                                        disabled={isSaving || !actionNote.trim()}
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}