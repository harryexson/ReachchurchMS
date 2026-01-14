import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
    UserPlus, CheckCircle, XCircle, Loader2, Clock, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function GroupJoinRequestsPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Get groups where I'm a leader
            const allGroups = await base44.entities.MemberGroup.filter({});
            const leaderGroups = allGroups.filter(g => 
                g.leader_emails?.includes(user.email) || user.role === 'admin'
            );
            setMyGroups(leaderGroups);

            // Get pending requests for those groups
            const allRequests = await base44.entities.GroupJoinRequest.filter({
                status: 'pending'
            });
            const relevantRequests = allRequests.filter(r =>
                leaderGroups.some(g => g.id === r.group_id)
            );
            setRequests(relevantRequests.sort((a, b) => 
                new Date(b.request_date) - new Date(a.request_date)
            ));

        } catch (error) {
            console.error('Error loading requests:', error);
            toast.error('Failed to load join requests');
        }
        setIsLoading(false);
    };

    const handleApprove = async (request) => {
        setProcessingId(request.id);
        try {
            // Create group assignment
            await base44.entities.MemberGroupAssignment.create({
                group_id: request.group_id,
                group_name: request.group_name,
                member_id: request.member_id,
                member_name: request.member_name,
                member_email: request.member_email,
                assigned_by: currentUser.email,
                assigned_date: new Date().toISOString(),
                is_active: true
            });

            // Update request status
            await base44.entities.GroupJoinRequest.update(request.id, {
                status: 'approved',
                reviewed_by: currentUser.email,
                reviewed_date: new Date().toISOString()
            });

            // Update group member count
            const group = myGroups.find(g => g.id === request.group_id);
            if (group) {
                await base44.entities.MemberGroup.update(group.id, {
                    member_count: (group.member_count || 0) + 1
                });
            }

            // Send notification to member
            await base44.entities.Notification.create({
                user_email: request.member_email,
                title: 'Group Request Approved',
                message: `Your request to join ${request.group_name} has been approved!`,
                type: 'success',
                priority: 'normal',
                link: '/my-groups',
                is_read: false
            });

            toast.success(`Approved ${request.member_name} for ${request.group_name}`);
            loadData();

        } catch (error) {
            console.error('Error approving request:', error);
            toast.error('Failed to approve request');
        }
        setProcessingId(null);
    };

    const handleReject = async (request) => {
        setProcessingId(request.id);
        try {
            await base44.entities.GroupJoinRequest.update(request.id, {
                status: 'rejected',
                reviewed_by: currentUser.email,
                reviewed_date: new Date().toISOString(),
                rejection_reason: rejectionReason
            });

            // Send notification to member
            await base44.entities.Notification.create({
                user_email: request.member_email,
                title: 'Group Request Update',
                message: `Your request to join ${request.group_name} was not approved at this time.`,
                type: 'info',
                priority: 'normal',
                link: '/my-groups',
                is_read: false
            });

            toast.success('Request rejected');
            setRejectionReason('');
            loadData();

        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        }
        setProcessingId(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Group Join Requests</h1>
                    <p className="text-slate-600 mt-1">Review and manage member requests to join your groups</p>
                </div>

                {requests.length === 0 ? (
                    <Card className="shadow-lg">
                        <CardContent className="py-12 text-center">
                            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Requests</h3>
                            <p className="text-slate-600">There are no join requests awaiting your review</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map(request => (
                            <Card key={request.id} className="shadow-lg hover:shadow-xl transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                <UserPlus className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{request.member_name}</h3>
                                                <p className="text-sm text-slate-600">{request.member_email}</p>
                                                <Badge className="mt-2 bg-blue-100 text-blue-800">
                                                    {request.group_name}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-amber-100 text-amber-800">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Pending
                                            </Badge>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {format(new Date(request.request_date), 'MMM d, yyyy h:mm a')}
                                            </p>
                                        </div>
                                    </div>

                                    {request.request_message && (
                                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                            <Label className="text-xs text-slate-600 mb-1 block">Message from Member:</Label>
                                            <p className="text-sm text-slate-700 italic">"{request.request_message}"</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleApprove(request)}
                                            disabled={processingId === request.id}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(request)}
                                            disabled={processingId === request.id}
                                            variant="outline"
                                            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}