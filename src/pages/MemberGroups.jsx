import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, UserPlus, UserMinus, Loader2, Search } from 'lucide-react';

export default function MemberGroups() {
    const [groups, setGroups] = useState([]);
    const [members, setMembers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [showMemberModal, setShowMemberModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    const [groupForm, setGroupForm] = useState({
        group_name: '',
        description: '',
        group_type: 'custom',
        color: '#3b82f6'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const [groupsData, membersData, assignmentsData] = await Promise.all([
                base44.entities.MemberGroup.filter({ is_active: true }),
                base44.entities.Member.list('-created_date', 1000),
                base44.entities.MemberGroupAssignment.filter({ is_active: true })
            ]);

            setGroups(groupsData.sort((a, b) => b.created_date?.localeCompare(a.created_date)));
            setMembers(membersData);
            setAssignments(assignmentsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGroup = async () => {
        if (!groupForm.group_name) {
            alert('Please enter a group name');
            return;
        }

        try {
            if (editingGroup) {
                await base44.entities.MemberGroup.update(editingGroup.id, groupForm);
            } else {
                await base44.entities.MemberGroup.create({
                    ...groupForm,
                    created_by: currentUser.email,
                    member_count: 0
                });
            }

            await loadData();
            setShowGroupForm(false);
            setEditingGroup(null);
            setGroupForm({ group_name: '', description: '', group_type: 'custom', color: '#3b82f6' });
        } catch (error) {
            console.error('Error saving group:', error);
            alert('Failed to save group');
        }
    };

    const handleDeleteGroup = async (group) => {
        if (!confirm(`Delete group "${group.group_name}"? This will remove all member assignments.`)) return;

        try {
            const groupAssignments = assignments.filter(a => a.group_id === group.id);
            await Promise.all(groupAssignments.map(a => base44.entities.MemberGroupAssignment.delete(a.id)));
            await base44.entities.MemberGroup.delete(group.id);
            await loadData();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('Failed to delete group');
        }
    };

    const handleAddMember = async (member) => {
        try {
            const existing = assignments.find(
                a => a.group_id === showMemberModal.id && a.member_id === member.id
            );

            if (existing) {
                alert('Member already in this group');
                return;
            }

            await base44.entities.MemberGroupAssignment.create({
                group_id: showMemberModal.id,
                group_name: showMemberModal.group_name,
                member_id: member.id,
                member_name: `${member.first_name} ${member.last_name}`,
                member_email: member.email,
                assigned_by: currentUser.email,
                assigned_date: new Date().toISOString(),
                is_active: true
            });

            const newCount = (showMemberModal.member_count || 0) + 1;
            await base44.entities.MemberGroup.update(showMemberModal.id, { member_count: newCount });

            await loadData();
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member');
        }
    };

    const handleRemoveMember = async (assignment) => {
        if (!confirm(`Remove ${assignment.member_name} from this group?`)) return;

        try {
            await base44.entities.MemberGroupAssignment.delete(assignment.id);

            const group = groups.find(g => g.id === assignment.group_id);
            if (group) {
                const newCount = Math.max((group.member_count || 0) - 1, 0);
                await base44.entities.MemberGroup.update(group.id, { member_count: newCount });
            }

            await loadData();
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Failed to remove member');
        }
    };

    const getGroupMembers = (groupId) => assignments.filter(a => a.group_id === groupId);

    const filteredMembers = members.filter(m => {
        const search = searchTerm.toLowerCase();
        return (
            m.first_name?.toLowerCase().includes(search) ||
            m.last_name?.toLowerCase().includes(search) ||
            m.email?.toLowerCase().includes(search)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Member Groups</h1>
                    <p className="text-slate-600 mt-1">Organize members for targeted communication</p>
                </div>
                <Button onClick={() => setShowGroupForm(true)} className="bg-blue-600">
                    <Plus className="w-4 h-4 mr-2" />
                    New Group
                </Button>
            </div>

            {/* Group Form */}
            {showGroupForm && (
                <Card className="shadow-lg border-2 border-blue-200">
                    <CardHeader className="bg-blue-50">
                        <CardTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <Label>Group Name</Label>
                            <Input
                                value={groupForm.group_name}
                                onChange={(e) => setGroupForm({...groupForm, group_name: e.target.value})}
                                placeholder="e.g., Youth Ministry, Small Group Leaders"
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={groupForm.description}
                                onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                                placeholder="What is this group for?"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Group Type</Label>
                                <Select value={groupForm.group_type} onValueChange={(val) => setGroupForm({...groupForm, group_type: val})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ministry">Ministry</SelectItem>
                                        <SelectItem value="small_group">Small Group</SelectItem>
                                        <SelectItem value="committee">Committee</SelectItem>
                                        <SelectItem value="age_group">Age Group</SelectItem>
                                        <SelectItem value="interest">Interest</SelectItem>
                                        <SelectItem value="service_team">Service Team</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Color</Label>
                                <Input
                                    type="color"
                                    value={groupForm.color}
                                    onChange={(e) => setGroupForm({...groupForm, color: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => {
                                setShowGroupForm(false);
                                setEditingGroup(null);
                                setGroupForm({ group_name: '', description: '', group_type: 'custom', color: '#3b82f6' });
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveGroup} className="bg-green-600">
                                {editingGroup ? 'Update' : 'Create'} Group
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Groups Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => {
                    const groupMembers = getGroupMembers(group.id);
                    return (
                        <Card key={group.id} className="shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader style={{ background: `${group.color}15` }} className="border-b">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ background: group.color }} />
                                            {group.group_name}
                                        </CardTitle>
                                        <Badge variant="outline" className="mt-2 text-xs capitalize">
                                            {group.group_type.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditingGroup(group);
                                                setGroupForm({
                                                    group_name: group.group_name,
                                                    description: group.description || '',
                                                    group_type: group.group_type,
                                                    color: group.color
                                                });
                                                setShowGroupForm(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteGroup(group)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {group.description && (
                                    <p className="text-sm text-slate-600 mb-4">{group.description}</p>
                                )}

                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm font-medium">{groupMembers.length} members</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowMemberModal(group)}
                                        className="text-blue-600"
                                    >
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Manage
                                    </Button>
                                </div>

                                {groupMembers.length > 0 && (
                                    <div className="space-y-2">
                                        {groupMembers.slice(0, 3).map(assignment => (
                                            <div key={assignment.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                                                <span className="text-slate-700">{assignment.member_name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-red-600"
                                                    onClick={() => handleRemoveMember(assignment)}
                                                >
                                                    <UserMinus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        {groupMembers.length > 3 && (
                                            <p className="text-xs text-slate-500 text-center">
                                                +{groupMembers.length - 3} more
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Member Management Modal */}
            {showMemberModal && (
                <Dialog open={!!showMemberModal} onOpenChange={() => setShowMemberModal(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Manage Members - {showMemberModal.group_name}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search members..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                {filteredMembers.map(member => {
                                    const isInGroup = assignments.some(
                                        a => a.group_id === showMemberModal.id && a.member_id === member.id
                                    );

                                    return (
                                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <p className="text-sm text-slate-600">{member.email}</p>
                                            </div>
                                            {isInGroup ? (
                                                <Badge className="bg-green-100 text-green-800">In Group</Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddMember(member)}
                                                    className="bg-blue-600"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}