import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Church, Users } from "lucide-react";

export default function MemberContactsPage() {
    const [leaderContacts, setLeaderContacts] = useState([]);
    const [churchInfo, setChurchInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            
            // CRITICAL: Get church admin email from member record
            const members = await base44.entities.Member.filter({ email: user.email });
            let churchAdminEmail = null;
            
            if (members.length > 0 && members[0].church_admin_email) {
                churchAdminEmail = members[0].church_admin_email;
            }
            
            // Load church settings using church admin email
            if (churchAdminEmail) {
                const settings = await base44.entities.ChurchSettings.filter({
                    church_admin_email: churchAdminEmail
                });
                if (settings.length > 0) {
                    setChurchInfo(settings[0]);
                }
            }

            // Load groups to get leader contacts
            const groups = await base44.entities.ContactGroup.list();
            const leaders = groups
                .filter(g => g.leader_email)
                .map(g => ({
                    name: g.leader_name,
                    email: g.leader_email,
                    role: `${g.group_name} Leader`
                }));
            setLeaderContacts(leaders);
        } catch (error) {
            console.error("Failed to load contacts:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Church Contacts</h1>
                    <p className="text-slate-600 mt-1">Get in touch with church leadership and group leaders</p>
                </div>

                {/* Church Office Contact */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Church className="w-5 h-5 text-blue-600" />
                            Church Office
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {churchInfo && (
                            <>
                                <div className="flex items-start gap-3">
                                    <Church className="w-5 h-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-slate-900">{churchInfo.church_name}</p>
                                        <p className="text-sm text-slate-600">Main Office</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-slate-700 mb-2">
                                        For general inquiries, event information, or administrative matters, please contact the church office during business hours.
                                    </p>
                                    <a 
                                        href="mailto:office@church.com" 
                                        className="text-blue-600 hover:underline text-sm font-medium"
                                    >
                                        office@church.com
                                    </a>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Group Leaders */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-600" />
                            Group Leaders
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {leaderContacts.length > 0 ? (
                            <div className="space-y-4">
                                {leaderContacts.map((leader, index) => (
                                    <div key={index} className="p-4 bg-green-50 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{leader.name}</h4>
                                                <p className="text-sm text-slate-600">{leader.role}</p>
                                            </div>
                                            <a 
                                                href={`mailto:${leader.email}`}
                                                className="text-green-600 hover:text-green-700"
                                            >
                                                <Mail className="w-5 h-5" />
                                            </a>
                                        </div>
                                        <a 
                                            href={`mailto:${leader.email}`} 
                                            className="text-sm text-green-600 hover:underline mt-2 inline-block"
                                        >
                                            {leader.email}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 py-8">No group leader contacts available</p>
                        )}
                    </CardContent>
                </Card>

                {/* Pastoral Team */}
                <Card className="shadow-lg border-0 bg-purple-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Pastoral Care & Prayer Requests
                        </h3>
                        <p className="text-sm text-purple-800 mb-3">
                            For pastoral care, prayer requests, or spiritual guidance, please reach out to our pastoral team:
                        </p>
                        <a 
                            href="mailto:pastoral@church.com" 
                            className="text-purple-600 hover:underline font-medium"
                        >
                            pastoral@church.com
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}