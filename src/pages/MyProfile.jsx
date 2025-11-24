import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Member } from "@/entities/Member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User as UserIcon, Mail, Phone, MapPin, Calendar, Users } from "lucide-react";

export default function MyProfilePage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [memberProfile, setMemberProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            // Try to find linked member record
            const members = await Member.filter({ email: user.email });
            if (members.length > 0) {
                setMemberProfile(members[0]);
                setFormData({
                    phone: members[0].phone || "",
                    address: members[0].address || "",
                    notes: members[0].notes || ""
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
                await Member.update(memberProfile.id, formData);
            }
            await loadProfile();
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Failed to update profile. Please try again.");
        }
        setIsSaving(false);
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

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <UserIcon className="w-4 h-4" />
                                    Full Name
                                </Label>
                                <Input value={currentUser?.full_name || "N/A"} disabled />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Mail className="w-4 h-4" />
                                    Email Address
                                </Label>
                                <Input value={currentUser?.email || "N/A"} disabled />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Phone className="w-4 h-4" />
                                    Phone Number
                                </Label>
                                <Input 
                                    value={isEditing ? formData.phone : memberProfile?.phone || "Not provided"}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    Member Since
                                </Label>
                                <Input 
                                    value={memberProfile?.join_date ? new Date(memberProfile.join_date).toLocaleDateString() : "N/A"} 
                                    disabled 
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4" />
                                Address
                            </Label>
                            <Textarea 
                                value={isEditing ? formData.address : memberProfile?.address || "Not provided"}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                disabled={!isEditing}
                                rows={3}
                            />
                        </div>

                        {memberProfile?.ministry_involvement && memberProfile.ministry_involvement.length > 0 && (
                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4" />
                                    Ministry Involvement
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {memberProfile.ministry_involvement.map((ministry, index) => (
                                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {ministry}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

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

                <Card className="shadow-lg border-0 bg-blue-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-blue-900 mb-3">📝 Note About Profile Updates</h3>
                        <div className="space-y-2 text-sm text-blue-800">
                            <p>• You can update your phone number and address anytime</p>
                            <p>• To update your name or email, please contact the church office</p>
                            <p>• Ministry involvement is managed by church administrators</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}