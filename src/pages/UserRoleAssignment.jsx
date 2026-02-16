import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/components/rbac/usePermissions';
import { Users, Plus, Trash2, Search, Shield, Loader2, CheckSquare, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UserRoleAssignment() {
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const { canAccessPage, hasPermission, currentUser: permUser, loading: permLoading } = usePermissions();

    useEffect(() => {
        if (!permLoading) {
            loadData();
        }
    }, [permLoading]);

    const loadData = async () => {
        try {
            console.log('Starting to load members...');
            
            const membersData = await base44.entities.Member.list('-created_date', 1000);
            console.log('✅ Loaded members:', membersData.length, membersData);
            
            const rolesData = await base44.entities.Role.filter({ is_active: true });
            console.log('✅ Loaded roles:', rolesData.length, rolesData);
            
            const userRolesData = await base44.entities.UserRole.filter({ is_active: true });
            console.log('✅ Loaded user roles:', userRolesData.length);
            
            setMembers(membersData);
            setRoles(rolesData);
            setUserRoles(userRolesData);
            
            console.log('✅ State updated successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
            console.error('Error details:', error.message, error.stack);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async () => {
        if (!selectedMember || !selectedRole) {
            alert('Please select both member and role');
            return;
        }

        try {
            const member = members.find(m => m.email === selectedMember);
            const role = roles.find(r => r.id === selectedRole);
            const currentUser = await base44.auth.me();

            await base44.entities.UserRole.create({
                user_email: member.email,
                user_name: `${member.first_name} ${member.last_name}`,
                role_id: role.id,
                role_name: role.role_name,
                assigned_by: currentUser.email,
                assigned_date: new Date().toISOString(),
                is_active: true
            });

            await loadData();
            setShowAssignForm(false);
            setSelectedMember('');
            setSelectedRole('');
        } catch (error) {
            console.error('Error assigning role:', error);
            alert('Failed to assign role');
        }
    };

    const handleRemoveRole = async (userRole) => {
        if (!confirm(`Remove role "${userRole.role_name}" from ${userRole.user_name}?`)) return;

        try {
            await base44.entities.UserRole.delete(userRole.id);
            await loadData();
        } catch (error) {
            console.error('Error removing role:', error);
            alert('Failed to remove role');
        }
    };

    const handleDeleteUser = async (member) => {
        // Check if current user has permission to delete users
        if (!hasPermission('settings', 'manage_users')) {
            alert('You do not have permission to delete users. Contact an administrator.');
            return;
        }

        if (!confirm(`Delete ${member.first_name} ${member.last_name} from the system? This will remove their profile and all role assignments.`)) return;

        try {
            // Delete all user roles for this member
            const userRolesToDelete = userRoles.filter(ur => ur.user_email === member.email);
            for (const ur of userRolesToDelete) {
                await base44.entities.UserRole.delete(ur.id);
            }
            
            // Delete the member record
            await base44.entities.Member.delete(member.id);
            
            await loadData();
            alert('User profile deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user profile: ' + (error.message || 'Unknown error'));
        }
    };

    const toggleUserSelection = (email) => {
        setSelectedUsers(prev => 
            prev.includes(email) 
                ? prev.filter(e => e !== email)
                : [...prev, email]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredMembers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredMembers.map(m => m.email));
        }
    };

    const handleBulkDelete = async () => {
        // Check if current user has permission to delete users
        if (!hasPermission('settings', 'manage_users')) {
            alert('You do not have permission to delete users. Contact an administrator.');
            return;
        }

        if (selectedUsers.length === 0) {
            alert('Please select users to delete');
            return;
        }

        if (!confirm(`Delete ${selectedUsers.length} selected user(s) from the system? This will remove their profiles and all role assignments.`)) return;

        try {
            for (const email of selectedUsers) {
                const member = members.find(m => m.email === email);
                if (!member) continue;

                // Delete all user roles for this member
                const userRolesToDelete = userRoles.filter(ur => ur.user_email === email);
                for (const ur of userRolesToDelete) {
                    await base44.entities.UserRole.delete(ur.id);
                }
                
                // Delete the member record
                await base44.entities.Member.delete(member.id);
            }
            
            setSelectedUsers([]);
            await loadData();
            alert('Selected users deleted successfully');
        } catch (error) {
            console.error('Error deleting users:', error);
            alert('Failed to delete selected users: ' + (error.message || 'Unknown error'));
        }
    };

    if (loading || permLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const filteredMembers = members.filter(m => {
        const search = searchTerm.toLowerCase();
        return (
            m.first_name?.toLowerCase().includes(search) ||
            m.last_name?.toLowerCase().includes(search) ||
            m.email?.toLowerCase().includes(search) ||
            m.phone?.toLowerCase().includes(search) ||
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(search)
        );
    });

    const getMemberRoles = (email) => userRoles.filter(ur => ur.user_email === email);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Role Assignment</h1>
                    <p className="text-slate-600 mt-1">
                        Assign custom roles to members ({members.length} members loaded)
                        {selectedUsers.length > 0 && (
                            <span className="ml-2 text-blue-600 font-semibold">
                                ({selectedUsers.length} selected)
                            </span>
                        )}
                    </p>
                    {members.length === 0 && (
                        <Alert className="mt-2 border-yellow-200 bg-yellow-50">
                            <AlertDescription className="text-yellow-900">
                                No members found. Please add members in the <strong>Member Directory</strong> first.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                <div className="flex gap-2">
                    {selectedUsers.length > 0 && hasPermission('settings', 'manage_users') && (
                        <Button onClick={handleBulkDelete} variant="outline" className="text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedUsers.length})
                        </Button>
                    )}
                    <Button onClick={() => setShowAssignForm(!showAssignForm)} className="bg-blue-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Assign Role
                    </Button>
                </div>
            </div>

            {showAssignForm && (
                <Card className="shadow-lg border-2 border-blue-200">
                    <CardHeader className="bg-blue-50">
                        <CardTitle>Assign Role to User</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Select Member</Label>
                            <Select value={selectedMember} onValueChange={setSelectedMember}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a member" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                    {members.length === 0 ? (
                                        <div className="p-4 text-center text-slate-500 text-sm">
                                            No members found. Add members first in the Members directory.
                                        </div>
                                    ) : (
                                        <>
                                            {console.log('Rendering member dropdown with', members.length, 'members')}
                                            {members.map(member => {
                                                if (!member.email) {
                                                    console.warn('Member without email:', member);
                                                    return null;
                                                }
                                                return (
                                                    <SelectItem key={member.id} value={member.email}>
                                                        {member.first_name} {member.last_name} ({member.email})
                                                    </SelectItem>
                                                );
                                            })}
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Select Role</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.length === 0 ? (
                                        <div className="p-4 text-center text-slate-500 text-sm">
                                            No roles found. Create roles first in Role Management.
                                        </div>
                                    ) : (
                                        roles.map(role => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.role_name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setShowAssignForm(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAssignRole} className="bg-green-600">
                                Assign Role
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4 mb-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                    </div>
                    {filteredMembers.length > 0 && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                            <Checkbox
                                checked={selectedUsers.length === filteredMembers.length && filteredMembers.length > 0}
                                onCheckedChange={toggleSelectAll}
                                id="select-all"
                            />
                            <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">
                                Select All ({filteredMembers.length})
                            </Label>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredMembers.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No members found matching your search</p>
                            </div>
                        ) : (
                            filteredMembers.map(member => {
                                const roles = getMemberRoles(member.email);
                                return (
                                    <Card key={member.email || member.id} className="border-slate-200">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start gap-3">
                                                <Checkbox
                                                    checked={selectedUsers.includes(member.email)}
                                                    onCheckedChange={() => toggleUserSelection(member.email)}
                                                    className="mt-4"
                                                />
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <Users className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {member.first_name} {member.last_name}
                                                        </h3>
                                                        <p className="text-sm text-slate-600">{member.email}</p>
                                                        {member.phone && (
                                                            <p className="text-xs text-slate-500">{member.phone}</p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                            <Badge variant="outline" className="text-xs">
                                                                {member.member_status || 'Member'}
                                                            </Badge>
                                                            {roles.length > 0 ? (
                                                                roles.map(ur => (
                                                                    <div key={ur.id} className="flex items-center gap-1">
                                                                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                                            <Shield className="w-3 h-3 mr-1" />
                                                                            {ur.role_name}
                                                                        </Badge>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 text-red-600"
                                                                            onClick={() => handleRemoveRole(ur)}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-slate-500">No custom roles</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {hasPermission('settings', 'manage_users') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleDeleteUser(member)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete User
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}