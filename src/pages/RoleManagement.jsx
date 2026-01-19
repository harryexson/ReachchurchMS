import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/components/rbac/usePermissions';
import { Shield, Plus, Edit2, Trash2, Save, X, Users, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserOrganization } from '@/components/hooks/useUserOrganization';

export default function RoleManagement() {
    const { user, isLoading: orgLoading } = useUserOrganization();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState(getEmptyRole());
    const { hasPermission, canAccessPage } = usePermissions();

    useEffect(() => {
        if (!orgLoading && user && canAccessPage('RoleManagement')) {
            loadRoles();
        } else if (!orgLoading) {
            setLoading(false);
        }
    }, [orgLoading, user]);

    const loadRoles = async () => {
        try {
            // Load all roles - they're organization-wide resources
            const data = await base44.entities.Role.list('-priority', 50);
            setRoles(data);
        } catch (error) {
            console.error('Error loading roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingRole) {
                await base44.entities.Role.update(editingRole.id, formData);
            } else {
                const user = await base44.auth.me();
                await base44.entities.Role.create({
                    ...formData,
                    created_by: user.email
                });
            }
            await loadRoles();
            setShowForm(false);
            setEditingRole(null);
            setFormData(getEmptyRole());
        } catch (error) {
            console.error('Error saving role:', error);
            alert('Failed to save role');
        }
    };

    const handleDelete = async (role) => {
        if (role.is_system_role) {
            alert('Cannot delete system roles');
            return;
        }

        if (!confirm(`Delete role "${role.role_name}"?`)) return;

        try {
            await base44.entities.Role.delete(role.id);
            await loadRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
            alert('Failed to delete role');
        }
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            role_name: role.role_name,
            description: role.description || '',
            priority: role.priority || 0,
            is_active: role.is_active !== false,
            permissions: role.permissions || getEmptyRole().permissions
        });
        setShowForm(true);
    };

    const togglePermission = (category, action) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [category]: {
                    ...prev.permissions[category],
                    [action]: !prev.permissions[category][action]
                }
            }
        }));
    };

    if (!canAccessPage('RoleManagement')) {
        return (
            <div className="p-6">
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-900">
                        You don't have permission to manage roles.
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

    const permissionCategories = [
        { key: 'members', label: 'Members', actions: ['view', 'create', 'edit', 'delete', 'export'] },
        { key: 'giving', label: 'Giving', actions: ['view', 'create', 'edit', 'delete', 'export', 'view_reports'] },
        { key: 'events', label: 'Events', actions: ['view', 'create', 'edit', 'delete', 'manage_registrations'] },
        { key: 'volunteers', label: 'Volunteers', actions: ['view', 'create', 'edit', 'delete', 'manage_hours'] },
        { key: 'communications', label: 'Communications', actions: ['view', 'create', 'send', 'delete'] },
        { key: 'reports', label: 'Reports', actions: ['view_financial', 'view_attendance', 'view_analytics', 'export'] },
        { key: 'settings', label: 'Settings', actions: ['view', 'edit', 'manage_users', 'manage_roles'] }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Role Management</h1>
                    <p className="text-slate-600 mt-1">Create and manage custom roles with granular permissions</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingRole(null); setFormData(getEmptyRole()); }} className="bg-blue-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                </Button>
            </div>

            {showForm && (
                <Card className="shadow-lg border-2 border-blue-200">
                    <CardHeader className="bg-blue-50 border-b">
                        <CardTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role Name *</Label>
                                <Input
                                    value={formData.role_name}
                                    onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                                    placeholder="e.g., Finance Manager"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Priority (0-100)</Label>
                                <Input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-slate-500">Higher priority wins in conflicts</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe this role's purpose"
                                rows={2}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <Label>Active</Label>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Permissions</h3>
                            {permissionCategories.map(cat => (
                                <Card key={cat.key} className="border-slate-200">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">{cat.label}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-3">
                                            {cat.actions.map(action => (
                                                <div key={action} className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={formData.permissions[cat.key][action]}
                                                        onCheckedChange={() => togglePermission(cat.key, action)}
                                                        id={`${cat.key}-${action}`}
                                                    />
                                                    <Label htmlFor={`${cat.key}-${action}`} className="text-sm capitalize cursor-pointer">
                                                        {action.replace(/_/g, ' ')}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => { setShowForm(false); setEditingRole(null); }}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="bg-green-600">
                                <Save className="w-4 h-4 mr-2" />
                                Save Role
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {roles.map(role => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-xl font-semibold">{role.role_name}</h3>
                                        {role.is_system_role && (
                                            <Badge variant="outline" className="text-xs">System</Badge>
                                        )}
                                        {!role.is_active && (
                                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                                        )}
                                        <Badge variant="secondary" className="text-xs">Priority: {role.priority || 0}</Badge>
                                    </div>
                                    <p className="text-slate-600 mb-3">{role.description || 'No description'}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(role.permissions || {}).map(([category, perms]) => {
                                            const activePerms = Object.entries(perms).filter(([_, v]) => v).map(([k]) => k);
                                            if (activePerms.length === 0) return null;
                                            return (
                                                <Badge key={category} variant="outline" className="text-xs capitalize">
                                                    {category}: {activePerms.join(', ').replace(/_/g, ' ')}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(role)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    {!role.is_system_role && (
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(role)} className="text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function getEmptyRole() {
    return {
        role_name: '',
        description: '',
        priority: 0,
        is_active: true,
        permissions: {
            members: { view: false, create: false, edit: false, delete: false, export: false },
            giving: { view: false, create: false, edit: false, delete: false, export: false, view_reports: false },
            events: { view: false, create: false, edit: false, delete: false, manage_registrations: false },
            volunteers: { view: false, create: false, edit: false, delete: false, manage_hours: false },
            communications: { view: false, create: false, send: false, delete: false },
            reports: { view_financial: false, view_attendance: false, view_analytics: false, export: false },
            settings: { view: false, edit: false, manage_users: false, manage_roles: false }
        }
    };
}