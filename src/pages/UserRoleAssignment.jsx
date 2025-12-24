import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/components/rbac/usePermissions';
import { Users, Plus, Trash2, Search, Shield, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UserRoleAssignment() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const { canAccessPage } = usePermissions();

    useEffect(() => {
        if (canAccessPage('UserManagement')) {
            loadData();
        } else {
            setLoading(false);
        }
    }, []);

    const loadData = async () => {
        try {
            const [usersData, rolesData, userRolesData] = await Promise.all([
                base44.entities.User.list(),
                base44.entities.Role.filter({ is_active: true }),
                base44.entities.UserRole.filter({ is_active: true })
            ]);
            setUsers(usersData);
            setRoles(rolesData);
            setUserRoles(userRolesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRole) {
            alert('Please select both user and role');
            return;
        }

        try {
            const user = users.find(u => u.email === selectedUser);
            const role = roles.find(r => r.id === selectedRole);
            const currentUser = await base44.auth.me();

            await base44.entities.UserRole.create({
                user_email: user.email,
                user_name: user.full_name,
                role_id: role.id,
                role_name: role.role_name,
                assigned_by: currentUser.email,
                assigned_date: new Date().toISOString(),
                is_active: true
            });

            await loadData();
            setShowAssignForm(false);
            setSelectedUser('');
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

    if (!canAccessPage('UserManagement')) {
        return (
            <div className="p-6">
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-900">
                        You don't have permission to manage user roles.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const filteredUsers = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getUserRoles = (email) => userRoles.filter(ur => ur.user_email === email);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Role Assignment</h1>
                    <p className="text-slate-600 mt-1">Assign custom roles to users</p>
                </div>
                <Button onClick={() => setShowAssignForm(!showAssignForm)} className="bg-blue-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Role
                </Button>
            </div>

            {showAssignForm && (
                <Card className="shadow-lg border-2 border-blue-200">
                    <CardHeader className="bg-blue-50">
                        <CardTitle>Assign Role to User</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Select User</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user.email} value={user.email}>
                                            {user.full_name} ({user.email})
                                        </SelectItem>
                                    ))}
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
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.role_name}
                                        </SelectItem>
                                    ))}
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
                    <div className="flex items-center gap-4">
                        <Search className="w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredUsers.map(user => {
                            const roles = getUserRoles(user.email);
                            return (
                                <Card key={user.email} className="border-slate-200">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Users className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{user.full_name}</h3>
                                                    <p className="text-sm text-slate-600">{user.email}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {user.role === 'admin' ? 'Admin' : 'Member'}
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
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}