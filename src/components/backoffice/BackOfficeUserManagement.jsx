import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserCog, Plus, Edit, Shield } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BackOfficeUserManagement({ onRefresh, currentUser }) {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        user_email: '',
        full_name: '',
        role: 'support',
        department: '',
        is_active: true,
        permissions: {}
    });

    const roleTemplates = {
        super_admin: {
            can_view_financials: true,
            can_process_refunds: true,
            can_manage_subscriptions: true,
            can_update_pricing: true,
            can_suspend_accounts: true,
            can_view_support_tickets: true,
            can_manage_support_tickets: true,
            can_view_crm: true,
            can_manage_crm: true,
            can_view_marketing: true,
            can_manage_marketing: true,
            can_view_hr: true,
            can_manage_hr: true,
            can_manage_users: true,
            can_view_analytics: true,
            can_export_data: true,
            can_manage_terms: true
        },
        accounting: {
            can_view_financials: true,
            can_process_refunds: true,
            can_manage_subscriptions: false,
            can_update_pricing: false,
            can_view_analytics: true,
            can_export_data: true
        },
        support: {
            can_view_support_tickets: true,
            can_manage_support_tickets: true,
            can_view_crm: true,
            can_suspend_accounts: false
        },
        marketing: {
            can_view_marketing: true,
            can_manage_marketing: true,
            can_view_crm: true,
            can_manage_crm: true,
            can_view_analytics: true
        },
        hr: {
            can_view_hr: true,
            can_manage_hr: true,
            can_manage_users: false
        },
        developer: {
            can_view_financials: true,
            can_manage_subscriptions: true,
            can_update_pricing: true,
            can_manage_terms: true,
            can_view_analytics: true,
            can_export_data: true
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const allUsers = await base44.entities.BackOfficeUser.list('-created_date');
        setUsers(allUsers);
    };

    const handleRoleChange = (role) => {
        setFormData({
            ...formData,
            role: role,
            permissions: roleTemplates[role] || {}
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = {
                ...formData,
                created_by: currentUser.email
            };

            if (editingUser) {
                await base44.entities.BackOfficeUser.update(editingUser.id, userData);
            } else {
                await base44.entities.BackOfficeUser.create(userData);
            }

            setIsModalOpen(false);
            loadUsers();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Failed to save user');
        }
    };

    const roleColors = {
        super_admin: 'bg-purple-100 text-purple-800',
        accounting: 'bg-green-100 text-green-800',
        support: 'bg-blue-100 text-blue-800',
        marketing: 'bg-pink-100 text-pink-800',
        hr: 'bg-orange-100 text-orange-800',
        developer: 'bg-slate-100 text-slate-800'
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <UserCog className="w-5 h-5" />
                            Back Office Users
                        </CardTitle>
                        <Button onClick={() => {
                            setEditingUser(null);
                            setFormData({
                                user_email: '',
                                full_name: '',
                                role: 'support',
                                department: '',
                                is_active: true,
                                permissions: roleTemplates.support
                            });
                            setIsModalOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-semibold">{user.full_name}</div>
                                            <div className="text-sm text-slate-500">{user.user_email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={roleColors[user.role]}>
                                            {user.role.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.department || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active ? 'default' : 'outline'}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingUser(user);
                                                setFormData(user);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'Edit Back Office User' : 'Add Back Office User'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={formData.user_email}
                                    onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Full Name *</Label>
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Role *</Label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={formData.role}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                    required
                                >
                                    <option value="super_admin">Super Admin</option>
                                    <option value="accounting">Accounting</option>
                                    <option value="support">Support</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="hr">Human Resources</option>
                                    <option value="developer">Developer</option>
                                </select>
                            </div>
                            <div>
                                <Label>Department</Label>
                                <Input
                                    value={formData.department}
                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    placeholder="e.g., Finance, Customer Success"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                            />
                            <Label>User is Active</Label>
                        </div>

                        <div className="border-2 border-slate-200 rounded-lg p-4">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Permissions for {formData.role.replace('_', ' ')}
                            </h4>
                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                                {Object.entries(formData.permissions).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <Badge variant={value ? 'default' : 'outline'}>
                                            {value ? '✓' : '×'}
                                        </Badge>
                                        <span>{key.replace(/_/g, ' ').replace('can ', '')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Save User
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}