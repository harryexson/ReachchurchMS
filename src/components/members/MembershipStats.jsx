import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, UserX, TrendingUp, TrendingDown, Calendar } from "lucide-react";

export default function MembershipStats({ members }) {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.member_status === 'member').length;
    const visitors = members.filter(m => m.member_status === 'visitor').length;
    const regularAttendees = members.filter(m => m.member_status === 'regular_attendee').length;
    const inactiveMembers = members.filter(m => m.member_status === 'inactive').length;

    // Calculate recent growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMembers = members.filter(m => 
        m.join_date && new Date(m.join_date) >= thirtyDaysAgo
    ).length;

    // Demographics
    const byAgeGroup = {
        child: members.filter(m => m.age_group === 'child').length,
        teen: members.filter(m => m.age_group === 'teen').length,
        young_adult: members.filter(m => m.age_group === 'young_adult').length,
        adult: members.filter(m => m.age_group === 'adult').length,
        senior: members.filter(m => m.age_group === 'senior').length
    };

    const byGender = {
        male: members.filter(m => m.gender === 'male').length,
        female: members.filter(m => m.gender === 'female').length,
        other: members.filter(m => m.gender === 'other' || m.gender === 'prefer_not_to_say').length
    };

    // Ministry involvement
    const ministryInvolved = members.filter(m => 
        m.ministry_involvement && m.ministry_involvement.length > 0
    ).length;

    const stats = [
        {
            title: "Total Members",
            value: totalMembers,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "Active Members",
            value: activeMembers,
            icon: UserCheck,
            color: "text-green-600",
            bgColor: "bg-green-50",
            percentage: totalMembers > 0 ? `${Math.round((activeMembers / totalMembers) * 100)}%` : '0%'
        },
        {
            title: "Visitors",
            value: visitors,
            icon: UserPlus,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        },
        {
            title: "New (30 days)",
            value: recentMembers,
            icon: recentMembers > 0 ? TrendingUp : Calendar,
            color: recentMembers > 0 ? "text-green-600" : "text-slate-600",
            bgColor: recentMembers > 0 ? "bg-green-50" : "bg-slate-50"
        },
        {
            title: "Regular Attendees",
            value: regularAttendees,
            icon: Users,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50"
        },
        {
            title: "Inactive",
            value: inactiveMembers,
            icon: UserX,
            color: "text-gray-600",
            bgColor: "bg-gray-50"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className="shadow-md border-0 bg-white/80">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                <p className="text-xs text-slate-600">{stat.title}</p>
                                {stat.percentage && (
                                    <p className="text-xs text-slate-500 mt-1">{stat.percentage} of total</p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Demographics Overview */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-md border-0 bg-white/80">
                    <CardHeader>
                        <CardTitle className="text-base">Age Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.entries(byAgeGroup).map(([group, count]) => {
                            const percentage = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
                            return (
                                <div key={group} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="capitalize text-slate-600">{group.replace('_', ' ')}</span>
                                        <span className="font-medium text-slate-900">{count} ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card className="shadow-md border-0 bg-white/80">
                    <CardHeader>
                        <CardTitle className="text-base">Ministry Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <div>
                                <p className="text-sm text-slate-600">Ministry Involved</p>
                                <p className="text-2xl font-bold text-green-700">{ministryInvolved}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-600">Engagement Rate</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {totalMembers > 0 ? Math.round((ministryInvolved / totalMembers) * 100) : 0}%
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Male</span>
                                <span className="font-medium">{byGender.male}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Female</span>
                                <span className="font-medium">{byGender.female}</span>
                            </div>
                            {byGender.other > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Other/Prefer Not to Say</span>
                                    <span className="font-medium">{byGender.other}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}