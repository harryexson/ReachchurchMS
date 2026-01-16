import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User as UserIcon, Mail, Phone, MapPin, Calendar, Users, Upload, Plus, X, Loader2, Heart, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

export default function MyProfilePage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [memberProfile, setMemberProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [newFamilyMember, setNewFamilyMember] = useState({ name: '', relationship: '', age: '', phone: '' });
    const [newEmergencyContact, setNewEmergencyContact] = useState({ name: '', relationship: '', phone: '', email: '' });
    const [newInterest, setNewInterest] = useState('');
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Try to find linked member record
            const members = await base44.entities.Member.filter({ email: user.email });
            if (members.length > 0) {
                setMemberProfile(members[0]);
                setFormData({
                    phone: members[0].phone || "",
                    address: members[0].address || "",
                    city: members[0].city || "",
                    state: members[0].state || "",
                    zip_code: members[0].zip_code || "",
                    bio: members[0].bio || "",
                    profile_picture_url: members[0].profile_picture_url || "",
                    family_members: members[0].family_members || [],
                    emergency_contacts: members[0].emergency_contacts || [],
                    interests: members[0].interests || [],
                    skills: members[0].skills || []
                });
            }
        } catch (error) {
            console.error("Failed to load profile:", error);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (memberProfile) {
                await base44.entities.Member.update(memberProfile.id, formData);
            }
            await loadProfile();
            setIsEditing(false);
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            toast.error("Failed to update profile. Please try again.");
        }
        setIsSaving(false);
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

    const addFamilyMember = () => {
        if (!newFamilyMember.name) return;
        setFormData({
            ...formData,
            family_members: [...(formData.family_members || []), newFamilyMember]
        });
        setNewFamilyMember({ name: '', relationship: '', age: '', phone: '' });
    };

    const removeFamilyMember = (index) => {
        const updated = [...formData.family_members];
        updated.splice(index, 1);
        setFormData({ ...formData, family_members: updated });
    };

    const addEmergencyContact = () => {
        if (!newEmergencyContact.name || !newEmergencyContact.phone) return;
        setFormData({
            ...formData,
            emergency_contacts: [...(formData.emergency_contacts || []), newEmergencyContact]
        });
        setNewEmergencyContact({ name: '', relationship: '', phone: '', email: '' });
    };

    const removeEmergencyContact = (index) => {
        const updated = [...formData.emergency_contacts];
        updated.splice(index, 1);
        setFormData({ ...formData, emergency_contacts: updated });
    };

    const addInterest = () => {
        if (!newInterest.trim()) return;
        setFormData({
            ...formData,
            interests: [...(formData.interests || []), newInterest.trim()]
        });
        setNewInterest('');
    };

    const removeInterest = (index) => {
        const updated = [...formData.interests];
        updated.splice(index, 1);
        setFormData({ ...formData, interests: updated });
    };

    const addSkill = () => {
        if (!newSkill.trim()) return;
        setFormData({
            ...formData,
            skills: [...(formData.skills || []), newSkill.trim()]
        });
        setNewSkill('');
    };

    const removeSkill = (index) => {
        const updated = [...formData.skills];
        updated.splice(index, 1);
        setFormData({ ...formData, skills: updated });
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen flex items-center justify-center">
                <p className="text-slate-600">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                    <p className="text-slate-600 mt-1">View and manage your personal information</p>
                </div>

                {/* Profile Picture */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {formData.profile_picture_url ? (
                                    <img
                                        src={formData.profile_picture_url}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                                        <UserIcon className="w-12 h-12 text-blue-600" />
                                    </div>
                                )}
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 shadow-lg">
                                        <Upload className="w-4 h-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-slate-900">{currentUser?.full_name}</h2>
                                <p className="text-slate-600">{currentUser?.email}</p>
                                {memberProfile?.member_status && (
                                    <Badge className="mt-2 capitalize">
                                        {memberProfile.member_status.replace('_', ' ')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bio */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                            About Me
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label>Bio</Label>
                        <Textarea
                            value={isEditing ? formData.bio : memberProfile?.bio || "No bio yet"}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            disabled={!isEditing}
                            placeholder="Tell us about yourself..."
                            rows={4}
                        />
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-blue-600" />
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Phone Number</Label>
                                <Input 
                                    value={isEditing ? formData.phone : memberProfile?.phone || "Not provided"}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    disabled={!isEditing}
                                    placeholder="(555) 123-4567"
                                />
                            </div>

                            <div>
                                <Label>Member Since</Label>
                                <Input 
                                    value={memberProfile?.join_date ? new Date(memberProfile.join_date).toLocaleDateString() : "N/A"} 
                                    disabled 
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Street Address</Label>
                            <Input 
                                value={isEditing ? formData.address : memberProfile?.address || "Not provided"}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                disabled={!isEditing}
                                placeholder="123 Main St"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>City</Label>
                                <Input 
                                    value={isEditing ? formData.city : memberProfile?.city || ""}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div>
                                <Label>State</Label>
                                <Input 
                                    value={isEditing ? formData.state : memberProfile?.state || ""}
                                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div>
                                <Label>ZIP Code</Label>
                                <Input 
                                    value={isEditing ? formData.zip_code : memberProfile?.zip_code || ""}
                                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Family Members */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Family Members
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(formData.family_members || []).map((family, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">{family.name}</p>
                                    <p className="text-sm text-slate-600">{family.relationship} {family.age && `• Age ${family.age}`}</p>
                                    {family.phone && <p className="text-sm text-slate-600">{family.phone}</p>}
                                </div>
                                {isEditing && (
                                    <Button variant="ghost" size="sm" onClick={() => removeFamilyMember(idx)} className="text-red-600">
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {isEditing && (
                            <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        placeholder="Name"
                                        value={newFamilyMember.name}
                                        onChange={(e) => setNewFamilyMember({...newFamilyMember, name: e.target.value})}
                                    />
                                    <Input
                                        placeholder="Relationship"
                                        value={newFamilyMember.relationship}
                                        onChange={(e) => setNewFamilyMember({...newFamilyMember, relationship: e.target.value})}
                                    />
                                    <Input
                                        placeholder="Age (optional)"
                                        value={newFamilyMember.age}
                                        onChange={(e) => setNewFamilyMember({...newFamilyMember, age: e.target.value})}
                                    />
                                    <Input
                                        placeholder="Phone (optional)"
                                        value={newFamilyMember.phone}
                                        onChange={(e) => setNewFamilyMember({...newFamilyMember, phone: e.target.value})}
                                    />
                                </div>
                                <Button size="sm" onClick={addFamilyMember} variant="outline" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Family Member
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Emergency Contacts */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-red-600" />
                            Emergency Contacts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(formData.emergency_contacts || []).map((contact, idx) => (
                            <div key={idx} className="p-3 bg-red-50 rounded-lg flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">{contact.name}</p>
                                    <p className="text-sm text-slate-600">{contact.relationship}</p>
                                    <p className="text-sm text-slate-700 font-medium">{contact.phone}</p>
                                    {contact.email && <p className="text-sm text-slate-600">{contact.email}</p>}
                                </div>
                                {isEditing && (
                                    <Button variant="ghost" size="sm" onClick={() => removeEmergencyContact(idx)} className="text-red-600">
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {isEditing && (
                            <div className="p-4 border-2 border-dashed border-red-200 rounded-lg space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        placeholder="Name *"
                                        value={newEmergencyContact.name}
                                        onChange={(e) => setNewEmergencyContact({...newEmergencyContact, name: e.target.value})}
                                    />
                                    <Input
                                        placeholder="Relationship"
                                        value={newEmergencyContact.relationship}
                                        onChange={(e) => setNewEmergencyContact({...newEmergencyContact, relationship: e.target.value})}
                                    />
                                    <Input
                                        placeholder="Phone *"
                                        value={newEmergencyContact.phone}
                                        onChange={(e) => setNewEmergencyContact({...newEmergencyContact, phone: e.target.value})}
                                    />
                                    <Input
                                        placeholder="Email (optional)"
                                        value={newEmergencyContact.email}
                                        onChange={(e) => setNewEmergencyContact({...newEmergencyContact, email: e.target.value})}
                                    />
                                </div>
                                <Button size="sm" onClick={addEmergencyContact} variant="outline" className="w-full border-red-300 text-red-600">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Emergency Contact
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Basic Info */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">



                        <div className="flex justify-end gap-3 pt-4">
                            {isEditing ? (
                                <>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                phone: memberProfile?.phone || "",
                                                address: memberProfile?.address || "",
                                                notes: memberProfile?.notes || ""
                                            });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    onClick={() => setIsEditing(true)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Interests & Skills */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-purple-600" />
                            Interests & Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label className="mb-2 block">Interests</Label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(formData.interests || []).filter(i => i && typeof i === 'string').map((interest, idx) => (
                                    <Badge key={idx} className="bg-purple-100 text-purple-800">
                                        {interest}
                                        {isEditing && (
                                            <button onClick={() => removeInterest(idx)} className="ml-2 hover:text-purple-900">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add an interest..."
                                        value={newInterest}
                                        onChange={(e) => setNewInterest(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                                    />
                                    <Button size="sm" onClick={addInterest}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label className="mb-2 block">Skills & Talents</Label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(formData.skills || []).filter(s => s && typeof s === 'string').map((skill, idx) => (
                                    <Badge key={idx} className="bg-blue-100 text-blue-800">
                                        {skill}
                                        {isEditing && (
                                            <button onClick={() => removeSkill(idx)} className="ml-2 hover:text-blue-900">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add a skill..."
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                    />
                                    <Button size="sm" onClick={addSkill}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Ministry Involvement (Read-Only) */}
                {memberProfile?.ministry_involvement && memberProfile.ministry_involvement.length > 0 && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-green-600" />
                                Ministry Involvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {memberProfile.ministry_involvement.filter(m => m && typeof m === 'string').map((ministry, index) => (
                                    <Badge key={index} className="bg-green-100 text-green-800">
                                        {ministry}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-3">
                                Ministry involvement is managed by church administrators
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card className="shadow-lg border-0 bg-blue-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-blue-900 mb-3">📝 Note About Profile Updates</h3>
                        <div className="space-y-2 text-sm text-blue-800">
                            <p>• You can update contact info, bio, family members, interests, and skills anytime</p>
                            <p>• To update your name or email, please contact the church office</p>
                            <p>• Ministry involvement is managed by church administrators</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}