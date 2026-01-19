import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { User, Shield, Phone, MapPin, Users, Heart, Briefcase, X, Plus, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_PERMISSIONS = {
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
    member: {
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

export default function AdminUserProfileEditor({ isOpen, onClose, userId, onSave }) {
    const [user, setUser] = useState(null);
    const [memberProfile, setMemberProfile] = useState(null);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadUserData();
        }
    }, [isOpen, userId]);

    const loadUserData = async () => {
        try {
            // Load user record
            const users = await base44.entities.User.filter({ id: userId });
            if (users.length > 0) {
                const userData = users[0];
                setUser(userData);
                
                // Load linked member profile
                const members = await base44.entities.Member.filter({ email: userData.email });
                if (members.length > 0) {
                    setMemberProfile(members[0]);
                    setFormData({
                        // User fields
                        full_name: userData.full_name || "",
                        role: userData.role || "user",
                        access_level: userData.access_level || "member",
                        permissions: userData.permissions || {},
                        ministry_areas: userData.ministry_areas || [],
                        // Member fields
                        phone: members[0].phone || "",
                        address: members[0].address || "",
                        city: members[0].city || "",
                        state: members[0].state || "",
                        zip_code: members[0].zip_code || "",
                        bio: members[0].bio || "",
                        profile_picture_url: members[0].profile_picture_url || "",
                        gender: members[0].gender || "",
                        age_group: members[0].age_group || "",
                        member_status: members[0].member_status || "member",
                        family_members: members[0].family_members || [],
                        emergency_contacts: members[0].emergency_contacts || [],
                        interests: members[0].interests || [],
                        skills: members[0].skills || [],
                        ministry_involvement: members[0].ministry_involvement || [],
                        volunteer_roles: members[0].volunteer_roles || []
                    });
                } else {
                    // No member profile, just user data
                    setFormData({
                        full_name: userData.full_name || "",
                        role: userData.role || "user",
                        access_level: userData.access_level || "member",
                        permissions: userData.permissions || {},
                        ministry_areas: userData.ministry_areas || []
                    });
                }
            }
        } catch (error) {
            console.error("Failed to load user data:", error);
            toast.error("Failed to load user profile");
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const result = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, profile_picture_url: result.file_url });
            toast.success('Photo uploaded!');
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Failed to upload photo');
        }
        setUploadingPhoto(false);
    };

    const handleAccessLevelChange = (newAccessLevel) => {
        setFormData({
            ...formData,
            access_level: newAccessLevel,
            permissions: ROLE_PERMISSIONS[newAccessLevel] || {}
        });
    };

    const handlePermissionChange = (key, value) => {
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                [key]: value
            }
        });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            // Update User entity
            await base44.entities.User.update(userId, {
                full_name: formData.full_name,
                role: formData.role,
                access_level: formData.access_level,
                permissions: formData.permissions,
                ministry_areas: formData.ministry_areas
            });

            // Update Member entity if exists
            if (memberProfile) {
                await base44.entities.Member.update(memberProfile.id, {
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zip_code,
                    bio: formData.bio,
                    profile_picture_url: formData.profile_picture_url,
                    gender: formData.gender,
                    age_group: formData.age_group,
                    member_status: formData.member_status,
                    family_members: formData.family_members,
                    emergency_contacts: formData.emergency_contacts,
                    interests: formData.interests,
                    skills: formData.skills,
                    ministry_involvement: formData.ministry_involvement,
                    volunteer_roles: formData.volunteer_roles
                });
            }

            toast.success("User profile updated successfully!");
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Failed to update user:", error);
            toast.error("Failed to update profile. Please try again.");
        }
        setIsSaving(false);
    };

    if (!user) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Edit User Profile - {user.email}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        {/* Profile Photo */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {formData.profile_picture_url ? (
                                    <img
                                        src={formData.profile_picture_url}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User className="w-10 h-10 text-blue-600" />
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-700">
                                    <Upload className="w-3 h-3" />
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                </label>
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-slate-500">Profile Picture</Label>
                                <p className="text-sm text-slate-600">Click to upload new photo</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Base Role *</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                                    <SelectItem value="user">User (Limited Access)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Access Level *</Label>
                            <Select value={formData.access_level} onValueChange={handleAccessLevelChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="pastor">Pastor/Senior Leader</SelectItem>
                                    <SelectItem value="treasurer">Treasurer</SelectItem>
                                    <SelectItem value="leader">Ministry Leader</SelectItem>
                                    <SelectItem value="staff">Staff Member</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {memberProfile && (
                            <>
                                <div className="space-y-2">
                                    <Label>Member Status</Label>
                                    <Select value={formData.member_status} onValueChange={(value) => setFormData({ ...formData, member_status: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="visitor">Visitor</SelectItem>
                                            <SelectItem value="regular_attendee">Regular Attendee</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Age Group</Label>
                                    <Select value={formData.age_group} onValueChange={(value) => setFormData({ ...formData, age_group: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select age group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="child">Child</SelectItem>
                                            <SelectItem value="teen">Teen</SelectItem>
                                            <SelectItem value="young_adult">Young Adult</SelectItem>
                                            <SelectItem value="adult">Adult</SelectItem>
                                            <SelectItem value="senior">Senior</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Bio</Label>
                                    <Textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="About this person..."
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="permissions" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Ministry Areas</Label>
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
                                selected={formData.ministry_areas || []}
                                onChange={(values) => setFormData({ ...formData, ministry_areas: values })}
                                placeholder="Select ministry areas..."
                            />
                        </div>

                        <div className="space-y-4 pt-4">
                            <Label className="text-base font-semibold">Specific Permissions</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries({
                                    can_view_all_members: "View All Members",
                                    can_edit_members: "Edit Members",
                                    can_view_financials: "View Financials",
                                    can_process_donations: "Process Donations",
                                    can_send_communications: "Send Communications",
                                    can_manage_events: "Manage Events",
                                    can_access_reports: "Access Reports",
                                    can_manage_volunteers: "Manage Volunteers",
                                    can_access_kids_checkin: "Kids Check-In",
                                    can_create_mms: "Create MMS Campaigns"
                                }).map(([key, label]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={formData.permissions?.[key] || false}
                                            onCheckedChange={(checked) => handlePermissionChange(key, checked)}
                                        />
                                        <label htmlFor={key} className="text-sm font-medium cursor-pointer">
                                            {label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email (Read Only)</Label>
                            <Input value={user.email} disabled className="bg-slate-50" />
                        </div>

                        {memberProfile && (
                            <>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="(555) 123-4567"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="123 Main St"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ZIP</Label>
                                        <Input
                                            value={formData.zip_code}
                                            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                        {memberProfile && (
                            <>
                                <div className="space-y-2">
                                    <Label>Interests</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {(formData.interests || []).map((interest, idx) => (
                                            <Badge key={idx} className="bg-purple-100 text-purple-800">
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500">User can manage their own interests</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Skills</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {(formData.skills || []).map((skill, idx) => (
                                            <Badge key={idx} className="bg-blue-100 text-blue-800">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500">User can manage their own skills</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Family Members</Label>
                                    {(formData.family_members || []).length > 0 ? (
                                        <div className="space-y-2">
                                            {formData.family_members.map((family, idx) => (
                                                <div key={idx} className="p-2 bg-slate-50 rounded text-sm">
                                                    <strong>{family.name}</strong> - {family.relationship}
                                                    {family.age && ` (Age ${family.age})`}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No family members added</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Emergency Contacts</Label>
                                    {(formData.emergency_contacts || []).length > 0 ? (
                                        <div className="space-y-2">
                                            {formData.emergency_contacts.map((contact, idx) => (
                                                <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                                                    <strong>{contact.name}</strong> - {contact.relationship}<br />
                                                    {contact.phone}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No emergency contacts added</p>
                                    )}
                                </div>
                            </>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}