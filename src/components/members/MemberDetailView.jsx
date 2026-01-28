import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Calendar, Users, Heart, Briefcase, Gift, MessageSquare, Link as LinkIcon, Target } from "lucide-react";
import EngagementInsights from "@/components/engagement/EngagementInsights";

export default function MemberDetailView({ isOpen, onClose, memberId, onEdit }) {
    const [member, setMember] = useState(null);
    const [donations, setDonations] = useState([]);
    const [events, setEvents] = useState([]);
    const [linkedUser, setLinkedUser] = useState(null);

    useEffect(() => {
        if (isOpen && memberId) {
            loadMemberData();
        }
    }, [isOpen, memberId]);

    const loadMemberData = async () => {
        try {
            const members = await base44.entities.Member.filter({ id: memberId });
            if (members.length > 0) {
                setMember(members[0]);

                // Load donations
                const donationList = await base44.entities.Donation.filter({ 
                    donor_email: members[0].email 
                });
                setDonations(donationList.sort((a, b) => 
                    new Date(b.donation_date) - new Date(a.donation_date)
                ).slice(0, 10));

                // Load linked user account
                if (members[0].email) {
                    const users = await base44.entities.User.filter({ email: members[0].email });
                    if (users.length > 0) {
                        setLinkedUser(users[0]);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load member data:', error);
        }
    };

    if (!member) {
        return null;
    }

    const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {member.profile_picture_url ? (
                                <img src={member.profile_picture_url} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold">{member.first_name} {member.last_name}</h2>
                                <Badge className={
                                    member.member_status === 'member' ? 'bg-green-100 text-green-800' :
                                    member.member_status === 'visitor' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }>
                                    {member.member_status?.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                        <Button onClick={() => onEdit(member)}>Edit</Button>
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="info">Info</TabsTrigger>
                        <TabsTrigger value="engagement">
                            <Target className="w-4 h-4 mr-1" />
                            Engagement
                        </TabsTrigger>
                        <TabsTrigger value="family">Family</TabsTrigger>
                        <TabsTrigger value="giving">Giving</TabsTrigger>
                        <TabsTrigger value="ministry">Ministry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="engagement" className="space-y-4">
                        <EngagementInsights memberId={member.id} memberName={`${member.first_name} ${member.last_name}`} />
                    </TabsContent>

                    <TabsContent value="info" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                    <span>{member.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-slate-500" />
                                    <span>{member.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                                    <div>
                                        {member.address && <p>{member.address}</p>}
                                        {(member.city || member.state || member.zip_code) && (
                                            <p>{[member.city, member.state, member.zip_code].filter(Boolean).join(', ')}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Member Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Join Date:</span>
                                    <span className="font-medium">
                                        {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Birth Date:</span>
                                    <span className="font-medium">
                                        {member.birth_date ? new Date(member.birth_date).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Gender:</span>
                                    <span className="font-medium capitalize">{member.gender || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Age Group:</span>
                                    <span className="font-medium capitalize">
                                        {member.age_group?.replace('_', ' ') || 'N/A'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {linkedUser && (
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 text-green-800">
                                        <LinkIcon className="w-4 h-4" />
                                        <p className="text-sm font-medium">Linked User Account</p>
                                    </div>
                                    <p className="text-xs text-green-700 mt-1">
                                        This member has an active user account and can access the portal
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {member.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{member.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="family" className="space-y-4">
                        {(member.family_members || []).length > 0 ? (
                            <div className="space-y-3">
                                {member.family_members.map((family, index) => (
                                    <Card key={index}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-slate-900">{family.name}</p>
                                                    <p className="text-sm text-slate-600 capitalize">{family.relationship}</p>
                                                    {family.age && <p className="text-sm text-slate-500">Age: {family.age}</p>}
                                                    {family.phone && <p className="text-sm text-slate-500">{family.phone}</p>}
                                                    {family.email && <p className="text-sm text-slate-500">{family.email}</p>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500">No family members added</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="giving" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Giving Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-green-600 mb-1">Total Donations</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            ${totalDonations.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-600 mb-1">Number of Gifts</p>
                                        <p className="text-2xl font-bold text-blue-700">{donations.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {donations.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Recent Donations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {donations.map(donation => (
                                            <div key={donation.id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                                                <div>
                                                    <p className="font-medium">${donation.amount}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(donation.donation_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="capitalize">
                                                    {donation.donation_type?.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="ministry" className="space-y-4">
                        {member.ministry_involvement && member.ministry_involvement.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Ministry Involvement</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {member.ministry_involvement.map((ministry, index) => (
                                            <Badge key={index} className="bg-blue-100 text-blue-800 capitalize">
                                                {ministry.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        {member.volunteer_roles && member.volunteer_roles.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Volunteer Roles</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {member.volunteer_roles.map((role, index) => (
                                            <Badge key={index} className="bg-purple-100 text-purple-800">
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {member.skills && member.skills.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Skills & Talents</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {member.skills.map((skill, index) => (
                                            <Badge key={index} variant="outline">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {member.interests && member.interests.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Interests</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {member.interests.map((interest, index) => (
                                            <Badge key={index} className="bg-purple-50 text-purple-700">
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}