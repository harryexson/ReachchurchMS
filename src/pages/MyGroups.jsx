import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    Users, Search, Loader2, UserPlus, UserMinus, Clock,
    MapPin, Calendar, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyGroupsPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [memberProfile, setMemberProfile] = useState(null);
    const [allGroups, setAllGroups] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Get member profile
            const members = await base44.entities.Member.filter({ email: user.email });
            const profile = members[0];
            setMemberProfile(profile);

            // Load all active groups
            const groups = await base44.entities.MemberGroup.filter({ is_active: true });
            setAllGroups(groups);

            // Load my assignments
            const assignments = await base44.entities.MemberGroupAssignment.filter({
                member_email: user.email,
                is_active: true
            });
            setMyAssignments(assignments);

            // Load my pending requests
            const requests = await base44.entities.GroupJoinRequest.filter({
                member_email: user.email,
                status: 'pending'
            });
            setMyRequests(requests);

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load groups');
        }
        setIsLoading(false);
    };

    const handleJoinGroup = async (group) => {
        if (!memberProfile) {
            toast.error('Please complete your member profile first');
            return;
        }

        setIsSubmitting(true);
        try {
            if (group.requires_approval) {
                // Create join request
                await base44.entities.GroupJoinRequest.create({
                    group_id: group.id,
                    group_name: group.group_name,
                    member_id: memberProfile.id,
                    member_name: `${memberProfile.first_name} ${memberProfile.last_name}`,
                    member_email: currentUser.email,
                    request_message: requestMessage,
                    request_date: new Date().toISOString(),
                    status: 'pending'
                });

                toast.success('Join request submitted! Waiting for leader approval.');
            } else {
                // Directly join
                await base44.entities.MemberGroupAssignment.create({
                    group_id: group.id,
                    group_name: group.group_name,
                    member_id: memberProfile.id,
                    member_name: `${memberProfile.first_name} ${memberProfile.last_name}`,
                    member_email: currentUser.email,
                    assigned_by: currentUser.email,
                    assigned_date: new Date().toISOString(),
                    is_active: true
                });

                // Update count
                await base44.entities.MemberGroup.update(group.id, {
                    member_count: (group.member_count || 0) + 1
                });

                toast.success(`You've joined ${group.group_name}!`);
            }

            setSelectedGroup(null);
            setRequestMessage('');
            loadData();

        } catch (error) {
            console.error('Error joining group:', error);
            toast.error('Failed to join group');
        }
        setIsSubmitting(false);
    };

    const handleLeaveGroup = async (assignment) => {
        if (!confirm(`Leave ${assignment.group_name}?`)) return;

        try {
            await base44.entities.MemberGroupAssignment.delete(assignment.id);

            // Update count
            const group = allGroups.find(g => g.id === assignment.group_id);
            if (group) {
                await base44.entities.MemberGroup.update(group.id, {
                    member_count: Math.max((group.member_count || 0) - 1, 0)
                });
            }

            toast.success('You have left the group');
            loadData();

        } catch (error) {
            console.error('Error leaving group:', error);
            toast.error('Failed to leave group');
        }
    };

    const isInGroup = (groupId) => {
        return myAssignments.some(a => a.group_id === groupId);
    };

    const hasPendingRequest = (groupId) => {
        return myRequests.some(r => r.group_id === groupId);
    };

    const filteredGroups = allGroups.filter(group => {
        const search = searchQuery.toLowerCase();
        return (
            group.group_name?.toLowerCase().includes(search) ||
            group.description?.toLowerCase().includes(search) ||
            group.group_type?.toLowerCase().includes(search)
        );
    });

    const myGroups = allGroups.filter(g => isInGroup(g.id));
    const availableGroups = filteredGroups.filter(g => !isInGroup(g.id) && g.is_open);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Groups</h1>
                    <p className="text-slate-600 mt-1">Join and manage your group memberships</p>
                </div>

                {/* My Groups */}
                <Card className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Groups I'm In ({myGroups.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {myGroups.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>You haven't joined any groups yet</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myGroups.map(group => {
                                    const assignment = myAssignments.find(a => a.group_id === group.id);
                                    return (
                                        <div key={group.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ background: group.color }} />
                                                    <h3 className="font-semibold text-slate-900">{group.group_name}</h3>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleLeaveGroup(assignment)}
                                                    className="text-red-600 h-8 px-2"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <Badge variant="outline" className="mb-2 capitalize text-xs">
                                                {group.group_type.replace('_', ' ')}
                                            </Badge>
                                            {group.description && (
                                                <p className="text-sm text-slate-600 mb-3">{group.description}</p>
                                            )}
                                            <div className="space-y-1 text-xs text-slate-500">
                                                {group.meeting_schedule && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {group.meeting_schedule}
                                                    </div>
                                                )}
                                                {group.meeting_location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3 h-3" />
                                                        {group.meeting_location}
                                                    </div>
                                                )}
                                                {group.leader_names?.length > 0 && (
                                                    <div className="text-xs text-slate-600 mt-2">
                                                        <strong>Leaders:</strong> {group.leader_names.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Requests */}
                {myRequests.length > 0 && (
                    <Card className="shadow-lg border-amber-200">
                        <CardHeader className="bg-amber-50">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-600" />
                                Pending Requests ({myRequests.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {myRequests.map(request => (
                                    <div key={request.id} className="p-4 border border-amber-200 rounded-lg bg-amber-50/50">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{request.group_name}</h3>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    Requested on {new Date(request.request_date).toLocaleDateString()}
                                                </p>
                                                {request.request_message && (
                                                    <p className="text-sm text-slate-700 mt-2 italic">
                                                        "{request.request_message}"
                                                    </p>
                                                )}
                                            </div>
                                            <Badge className="bg-amber-100 text-amber-800">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Pending
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Available Groups */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Available Groups
                        </CardTitle>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search groups..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {availableGroups.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No available groups found</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableGroups.map(group => {
                                    const pending = hasPendingRequest(group.id);
                                    const isFull = group.max_members && group.member_count >= group.max_members;

                                    return (
                                        <div key={group.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ background: group.color }} />
                                                    <h3 className="font-semibold text-slate-900">{group.group_name}</h3>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <Badge variant="outline" className="capitalize text-xs">
                                                    {group.group_type.replace('_', ' ')}
                                                </Badge>
                                                {group.requires_approval && (
                                                    <Badge className="bg-amber-100 text-amber-800 text-xs">
                                                        Approval Required
                                                    </Badge>
                                                )}
                                            </div>
                                            {group.description && (
                                                <p className="text-sm text-slate-600 mb-3">{group.description}</p>
                                            )}
                                            <div className="space-y-1 text-xs text-slate-500 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-3 h-3" />
                                                    {group.member_count || 0} members
                                                    {group.max_members && ` (max ${group.max_members})`}
                                                </div>
                                                {group.meeting_schedule && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {group.meeting_schedule}
                                                    </div>
                                                )}
                                                {group.meeting_location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3 h-3" />
                                                        {group.meeting_location}
                                                    </div>
                                                )}
                                            </div>
                                            {pending ? (
                                                <Badge className="w-full justify-center bg-amber-100 text-amber-800">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Request Pending
                                                </Badge>
                                            ) : isFull ? (
                                                <Badge className="w-full justify-center bg-slate-100 text-slate-600">
                                                    Group Full
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => setSelectedGroup(group)}
                                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Join Group
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Join Confirmation Dialog */}
            {selectedGroup && (
                <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Join {selectedGroup.group_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedGroup.requires_approval && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                        <div className="text-sm text-amber-900">
                                            <p className="font-semibold">Leader Approval Required</p>
                                            <p className="mt-1">Your request will be reviewed by the group leaders.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {selectedGroup.requires_approval && (
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                                        Message to Leaders (Optional)
                                    </label>
                                    <Textarea
                                        placeholder="Tell the leaders why you'd like to join..."
                                        value={requestMessage}
                                        onChange={(e) => setRequestMessage(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleJoinGroup(selectedGroup)}
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <UserPlus className="w-4 h-4 mr-2" />
                                    )}
                                    {selectedGroup.requires_approval ? 'Submit Request' : 'Join Group'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}