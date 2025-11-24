
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge"; // Not used in the changes but present in original code, keep it.
import { Crown, Church, DollarSign, FileText, Users, UserCheck, User } from 'lucide-react';
import { MultiSelect } from "@/components/ui/multi-select"; // Assuming this component exists in your UI library

// Define default permissions for each role
const ROLE_PRESETS_PERMISSIONS = {
    admin: {
        can_view_all_members: true,
        can_edit_members: true,
        can_view_financials: true,
        can_process_donations: true,
        can_send_communications: true,
        can_manage_events: true,
        can_access_reports: true,
        can_manage_volunteers: true,
        can_access_kids_checkin: true,
        can_create_mms: true
    },
    pastor: {
        can_view_all_members: true,
        can_edit_members: true,
        can_view_financials: false,
        can_process_donations: false,
        can_send_communications: true,
        can_manage_events: true,
        can_access_reports: true,
        can_manage_volunteers: true,
        can_access_kids_checkin: true,
        can_create_mms: true
    },
    treasurer: {
        can_view_all_members: false,
        can_edit_members: false,
        can_view_financials: true,
        can_process_donations: true,
        can_send_communications: false,
        can_manage_events: false,
        can_access_reports: true,
        can_manage_volunteers: false,
        can_access_kids_checkin: false,
        can_create_mms: false
    },
    accountant: { // New role
        can_view_all_members: false,
        can_edit_members: false,
        can_view_financials: true,
        can_process_donations: false,
        can_send_communications: false,
        can_manage_events: false,
        can_access_reports: true,
        can_manage_volunteers: false,
        can_access_kids_checkin: false,
        can_create_mms: false
    },
    leader: {
        can_view_all_members: false,
        can_edit_members: false,
        can_view_financials: false,
        can_process_donations: false,
        can_send_communications: true,
        can_manage_events: true,
        can_access_reports: false,
        can_manage_volunteers: true,
        can_access_kids_checkin: false,
        can_create_mms: false
    },
    staff: {
        can_view_all_members: true,
        can_edit_members: false,
        can_view_financials: false,
        can_process_donations: false,
        can_send_communications: false,
        can_manage_events: false,
        can_access_reports: false,
        can_manage_volunteers: false,
        can_access_kids_checkin: true,
        can_create_mms: false
    },
    member: { // New role
        can_view_all_members: false,
        can_edit_members: false,
        can_view_financials: false,
        can_process_donations: false,
        can_send_communications: false,
        can_manage_events: false,
        can_access_reports: false,
        can_manage_volunteers: false,
        can_access_kids_checkin: false,
        can_create_mms: false
    }
};

const initialFormData = {
    email: "",
    full_name: "",
    access_level: "staff",
    permissions: ROLE_PRESETS_PERMISSIONS.staff,
    ministry_areas: [],
};

export default function UserInviteModal({ isOpen, setIsOpen, onInviteSuccess }) {
    const [formData, setFormData] = useState(initialFormData);
    const [isSending, setIsSending] = useState(false);

    // Reset form data when the modal is opened
    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
        }
    }, [isOpen]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // If access_level changes, update permissions to the preset for that role
        if (field === 'access_level') {
            setFormData(prev => ({
                ...prev,
                permissions: ROLE_PRESETS_PERMISSIONS[value] || {}
            }));
        }
    };

    const handlePermissionChange = (permissionKey, checked) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permissionKey]: checked
            }
        }));
    };

    const handleInvite = async () => {
        if (!formData.email || !formData.full_name) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSending(true);

        try {
            const currentUser = await base44.auth.me();

            const response = await base44.functions.invoke('inviteUser', {
                email: formData.email,
                full_name: formData.full_name,
                access_level: formData.access_level,
                permissions: formData.permissions,
                ministry_areas: formData.ministry_areas, // Include ministry areas
                invited_by: currentUser.email,
                church_id: currentUser.church_id
            });

            if (response.data.success) {
                alert(`Invitation sent to ${formData.email}!`);
                setIsOpen(false);
                if (onInviteSuccess) onInviteSuccess();
            } else {
                throw new Error(response.data.error || 'Failed to send invitation');
            }

        } catch (error) {
            console.error('Invitation error:', error);
            alert(`Failed to send invitation: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite User to Your Organization</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                            id="fullName"
                            value={formData.full_name}
                            onChange={(e) => handleFieldChange('full_name', e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                            value={formData.access_level}
                            onValueChange={(value) => handleFieldChange('access_level', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select access level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                        <Crown className="w-4 h-4 text-yellow-600" />
                                        <div>
                                            <p className="font-semibold">Administrator</p>
                                            <p className="text-xs text-slate-500">Full system access</p>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="pastor">
                                    <div className="flex items-center gap-2">
                                        <Church className="w-4 h-4 text-blue-600" />
                                        <div>
                                            <p className="font-semibold">Pastor/Senior Leader</p>
                                            <p className="text-xs text-slate-500">Member & event management</p>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="treasurer">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        <div>
                                            <p className="font-semibold">Treasurer</p>
                                            <p className="text-xs text-slate-500">Financial management</p>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="accountant">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-purple-600" />
                                        <div>
                                            <p className="font-semibold">Accountant</p>
                                            <p className="text-xs text-slate-500">View-only financial reports</p>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="leader">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-600" />
                                        <div>
                                            <p className="font-semibold">Ministry Leader</p>
                                            <p className="text-xs text-slate-500">Group & event management</p>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="staff">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-slate-600" />
                                        <div>
                                            <p className="font-semibold">Staff Member</p>
                                            <p className="text-xs text-slate-500">Limited access</p>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="member">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="font-semibold">Member</p>
                                            <p className="text-xs text-slate-500">Personal dashboard only</p>
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Granular Permissions */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Specific Permissions</Label>
                        <p className="text-xs text-slate-500 -mt-2">
                            Fine-tune access beyond role defaults
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_view_all_members"
                                    checked={formData.permissions?.can_view_all_members || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_view_all_members', checked)}
                                />
                                <label htmlFor="can_view_all_members" className="text-sm font-medium">
                                    View All Members
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_edit_members"
                                    checked={formData.permissions?.can_edit_members || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_edit_members', checked)}
                                />
                                <label htmlFor="can_edit_members" className="text-sm font-medium">
                                    Edit Members
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_view_financials"
                                    checked={formData.permissions?.can_view_financials || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_view_financials', checked)}
                                />
                                <label htmlFor="can_view_financials" className="text-sm font-medium">
                                    View Financials
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_process_donations"
                                    checked={formData.permissions?.can_process_donations || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_process_donations', checked)}
                                />
                                <label htmlFor="can_process_donations" className="text-sm font-medium">
                                    Process Donations
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_send_communications"
                                    checked={formData.permissions?.can_send_communications || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_send_communications', checked)}
                                />
                                <label htmlFor="can_send_communications" className="text-sm font-medium">
                                    Send Communications
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_manage_events"
                                    checked={formData.permissions?.can_manage_events || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_manage_events', checked)}
                                />
                                <label htmlFor="can_manage_events" className="text-sm font-medium">
                                    Manage Events
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_access_kids_checkin"
                                    checked={formData.permissions?.can_access_kids_checkin || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_access_kids_checkin', checked)}
                                />
                                <label htmlFor="can_access_kids_checkin" className="text-sm font-medium">
                                    Kids Check-In Access
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_access_reports"
                                    checked={formData.permissions?.can_access_reports || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_access_reports', checked)}
                                />
                                <label htmlFor="can_access_reports" className="text-sm font-medium">
                                    Access Reports
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_manage_volunteers"
                                    checked={formData.permissions?.can_manage_volunteers || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_manage_volunteers', checked)}
                                />
                                <label htmlFor="can_manage_volunteers" className="text-sm font-medium">
                                    Manage Volunteers
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="can_create_mms"
                                    checked={formData.permissions?.can_create_mms || false}
                                    onCheckedChange={(checked) => handlePermissionChange('can_create_mms', checked)}
                                />
                                <label htmlFor="can_create_mms" className="text-sm font-medium">
                                    Create MMS Campaigns
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Ministry Areas */}
                    <div className="space-y-2">
                        <Label>Ministry Areas (Optional)</Label>
                        <MultiSelect
                            options={[
                                { value: "worship", label: "Worship & Music" },
                                { value: "kids", label: "Kids Ministry" },
                                { value: "youth", label: "Youth Ministry" },
                                { value: "small_groups", label: "Small Groups" },
                                { value: "outreach", label: "Outreach & Missions" },
                                { value: "hospitality", label: "Hospitality" },
                                { value: "media", label: "Media & Tech" },
                                { value: "prayer", label: "Prayer Ministry" }
                            ]}
                            value={formData.ministry_areas || []}
                            onChange={(values) => handleFieldChange('ministry_areas', values)}
                            placeholder="Select ministry areas..."
                        />
                        <p className="text-xs text-slate-500">
                            Assign this user to specific ministry teams
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>
                        Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={isSending}>
                        {isSending ? 'Sending...' : 'Send Invitation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
