import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, Mail, Trash2, Edit, Users, Crown, Search, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import UserInviteModal from "@/components/users/UserInviteModal";
import AdminUserProfileEditor from "@/components/users/AdminUserProfileEditor";

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const navigate = useNavigate();

    const checkAuthAndLoadUsers = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            if (user.role !== 'admin') {
                alert("Only administrators can access user management");
                navigate(createPageUrl('Dashboard'));
                return;
            }

            await loadUsers();
        } catch (error) {
            console.error("Authentication failed:", error);
            await base44.auth.redirectToLogin();
        }
    };

    const loadUsers = async () => {
        setIsLoading(true);
        const usersList = await base44.entities.User.list("-created_date");
        
        // Fetch member profiles to get profile pictures
        const members = await base44.entities.Member.list();
        const memberMap = {};
        members.forEach(member => {
            memberMap[member.email] = member;
        });
        
        // Merge profile pictures into user data
        const usersWithPhotos = usersList.map(user => ({
            ...user,
            profile_picture_url: memberMap[user.email]?.profile_picture_url || null
        }));
        
        setUsers(usersWithPhotos);
        setIsLoading(false);
    };

    useEffect(() => {
        checkAuthAndLoadUsers();
    }, [navigate]);

    const handleUpdateUserRole = async (userId, newRole) => {
        if (!confirm("Are you sure you want to change this user's role?")) {
            return;
        }

        try {
            await base44.entities.User.update(userId, { role: newRole });
            await loadUsers();
            alert("User role updated successfully!");
        } catch (error) {
            console.error("Role update failed:", error);
            alert("Failed to update user role. Please try again.");
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsProfileEditorOpen(true);
    };

    const handleSaveUserEdits = async () => {
        if (!selectedUser) return;

        try {
            await base44.entities.User.update(selectedUser.id, {
                church_name: selectedUser.church_name,
                position: selectedUser.position
            });
            await loadUsers();
            setIsEditModalOpen(false);
            setSelectedUser(null);
            alert("User information updated successfully!");
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update user. Please try again.");
        }
    };

    const filteredUsers = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.church_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roleColors = {
        admin: "bg-red-100 text-red-800",
        user: "bg-blue-100 text-blue-800"
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                        <p className="text-slate-600 mt-1">Manage team members and access permissions.</p>
                    </div>
                    <Button onClick={() => setIsInviteModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Invite User
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Users</p>
                                    <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Administrators</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {users.filter(u => u.role === 'admin').length}
                                    </p>
                                </div>
                                <Crown className="w-8 h-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Standard Users</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {users.filter(u => u.role === 'user').length}
                                    </p>
                                </div>
                                <Shield className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search users by name, email, or church..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Church</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {user.profile_picture_url ? (
                                                            <img
                                                                src={user.profile_picture_url}
                                                                alt={user.full_name}
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                                                                <UserIcon className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-semibold">{user.full_name}</div>
                                                            <div className="text-sm text-slate-500 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.church_name || 'N/A'}</TableCell>
                                                <TableCell>{user.position || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge className={roleColors[user.role] || "bg-slate-100 text-slate-800"}>
                                                        {user.role === 'admin' ? (
                                                            <>
                                                                <Crown className="w-3 h-3 mr-1" />
                                                                Administrator
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Shield className="w-3 h-3 mr-1" />
                                                                User
                                                            </>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                       <Button 
                                                           size="sm" 
                                                           variant="outline"
                                                           onClick={() => handleEditUser(user)}
                                                           title="Edit full profile"
                                                       >
                                                           <Edit className="w-4 h-4 mr-1" />
                                                           Edit Profile
                                                       </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p className="text-slate-500">No users found</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* UserInviteModal Component */}
                <UserInviteModal
                    isOpen={isInviteModalOpen}
                    setIsOpen={setIsInviteModalOpen}
                    onInviteSuccess={loadUsers}
                />

                {/* Admin Profile Editor */}
                {selectedUser && (
                    <AdminUserProfileEditor
                        isOpen={isProfileEditorOpen}
                        onClose={() => {
                            setIsProfileEditorOpen(false);
                            setSelectedUser(null);
                        }}
                        userId={selectedUser.id}
                        onSave={loadUsers}
                    />
                )}

                {/* Role & Permissions Reference Card */}
                <Card className="mt-8 bg-blue-50 border-blue-200 shadow-lg backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Shield className="w-5 h-5" />
                            Role & Permission Definitions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <h4 className="font-bold text-blue-900 mb-3">Standard Roles:</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">👑 Admin</p>
                                        <p className="text-slate-600">Full access to all features, settings, and user management</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">⛪ Pastor</p>
                                        <p className="text-slate-600">Access to members, events, communications, reports (read-only financials)</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">💰 Treasurer</p>
                                        <p className="text-slate-600">Full financial access, giving records, tax statements</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">📊 Accountant</p>
                                        <p className="text-slate-600">View-only financial reports and donation records</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 mb-3">Permission Categories:</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">👥 Member Management</p>
                                        <p className="text-slate-600">View, edit, and manage church member records</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">💵 Financial Access</p>
                                        <p className="text-slate-600">View/process donations and giving records</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">📧 Communications</p>
                                        <p className="text-slate-600">Send emails, SMS, and create campaigns</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">👶 Kids Check-In</p>
                                        <p className="text-slate-600">Access kids ministry check-in/out system</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">📊 Reports</p>
                                        <p className="text-slate-600">Access analytics and reports dashboard</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                            <h4 className="font-bold text-slate-900 mb-2">🔒 Privacy Protection</h4>
                            <ul className="text-slate-600 space-y-1 text-sm list-disc pl-5">
                                <li><strong>Members</strong> can only view their own information and donation history</li>
                                <li><strong>Leaders</strong> can view members in their groups, but not financial data</li>
                                <li><strong>Staff</strong> need explicit permissions for financial/sensitive data access</li>
                                <li>All access is logged and auditable for security compliance</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit User Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User Information</DialogTitle>
                            <DialogDescription>
                                Update user details and permissions.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Email (Read Only)</Label>
                                    <Input value={selectedUser.email} disabled className="bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-church">Church Name</Label>
                                    <Input
                                        id="edit-church"
                                        value={selectedUser.church_name || ''}
                                        onChange={(e) => setSelectedUser({...selectedUser, church_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-position">Position</Label>
                                    <Input
                                        id="edit-position"
                                        value={selectedUser.position || ''}
                                        onChange={(e) => setSelectedUser({...selectedUser, position: e.target.value})}
                                        placeholder="e.g., Pastor, Administrator, Youth Leader"
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveUserEdits}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}