import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { ContactGroup } from "@/entities/ContactGroup";
import { Volunteer } from "@/entities/Volunteer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyGroupsPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [myGroups, setMyGroups] = useState([]);
    const [myVolunteerRoles, setMyVolunteerRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMyGroups();
    }, []);

    const loadMyGroups = async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            // Find groups where I'm a member
            const allGroups = await ContactGroup.list();
            const memberGroups = allGroups.filter(group => 
                group.member_emails && group.member_emails.includes(user.email)
            );
            setMyGroups(memberGroups);

            // Find my volunteer roles
            const volunteerRoles = await Volunteer.filter({ email: user.email });
            setMyVolunteerRoles(volunteerRoles);
        } catch (error) {
            console.error("Failed to load groups:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Groups & Ministries</h1>
                    <p className="text-slate-600 mt-1">Your involvement in church community</p>
                </div>

                {/* My Groups */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Groups I'm Part Of
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array(2).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-24 w-full" />
                                ))}
                            </div>
                        ) : myGroups.length > 0 ? (
                            <div className="space-y-4">
                                {myGroups.map(group => (
                                    <div key={group.id} className="p-4 bg-blue-50 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{group.group_name}</h3>
                                                <p className="text-sm text-slate-600">{group.description}</p>
                                            </div>
                                            <Badge className="bg-blue-100 text-blue-800">
                                                {group.group_type}
                                            </Badge>
                                        </div>
                                        {group.leader_name && (
                                            <div className="flex items-center gap-2 text-sm text-slate-700 mt-3">
                                                <UserIcon className="w-4 h-4" />
                                                <span>Leader: {group.leader_name}</span>
                                                {group.leader_email && (
                                                    <a href={`mailto:${group.leader_email}`} className="text-blue-600 hover:underline ml-2">
                                                        <Mail className="w-4 h-4 inline" /> {group.leader_email}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>You're not currently part of any groups</p>
                                <p className="text-sm text-slate-400 mt-2">Contact the church office to join a group</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* My Volunteer Roles */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-green-600" />
                            My Volunteer Roles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array(2).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        ) : myVolunteerRoles.length > 0 ? (
                            <div className="space-y-4">
                                {myVolunteerRoles.map(role => (
                                    <div key={role.id} className="p-4 bg-green-50 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{role.role}</h3>
                                                <p className="text-sm text-slate-600 capitalize">{role.ministry.replace('_', ' ')}</p>
                                            </div>
                                            <Badge className={role.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                {role.status}
                                            </Badge>
                                        </div>
                                        {role.availability && role.availability.length > 0 && (
                                            <div className="mt-2 text-sm text-slate-600">
                                                <span className="font-medium">Available:</span> {role.availability.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <UserIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>You're not currently volunteering</p>
                                <p className="text-sm text-slate-400 mt-2">Contact the church office to start serving</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}