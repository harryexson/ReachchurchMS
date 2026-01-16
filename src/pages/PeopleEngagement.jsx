import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Users, AlertTriangle, TrendingDown, Clock, 
    CheckCircle, Phone, Mail, MessageSquare, Search
} from "lucide-react";

export default function PeopleEngagementPage() {
    const [engagementData, setEngagementData] = useState([]);
    const [followUpTasks, setFollowUpTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTab, setSelectedTab] = useState("at_risk");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [engagement, tasks] = await Promise.all([
            base44.entities.MemberEngagement.list('-engagement_score'),
            base44.entities.FollowUpTask.filter({ status: "pending" }, '-priority')
        ]);
        setEngagementData(engagement);
        setFollowUpTasks(tasks);
    };

    const atRiskMembers = engagementData.filter(e => e.risk_level === "high" || e.risk_level === "critical");
    const needsFollowUp = engagementData.filter(e => e.needs_follow_up);
    const inactive = engagementData.filter(e => e.lifecycle_stage === "inactive" || e.days_since_contact > 30);

    const getRiskColor = (level) => {
        switch (level) {
            case "critical": return "bg-red-600 text-white";
            case "high": return "bg-red-100 text-red-800";
            case "medium": return "bg-yellow-100 text-yellow-800";
            default: return "bg-green-100 text-green-800";
        }
    };

    const getStageColor = (stage) => {
        switch (stage) {
            case "first_time_visitor": return "bg-purple-100 text-purple-800";
            case "regular_attendee": return "bg-blue-100 text-blue-800";
            case "active_member": return "bg-green-100 text-green-800";
            case "leader": return "bg-indigo-100 text-indigo-800";
            case "inactive": return "bg-red-100 text-red-800";
            case "at_risk": return "bg-orange-100 text-orange-800";
            default: return "bg-slate-100 text-slate-800";
        }
    };

    const createFollowUpTask = async (member) => {
        const currentUser = await base44.auth.me();
        await base44.entities.FollowUpTask.create({
            member_id: member.member_id,
            member_name: member.member_name,
            task_type: "check_in",
            priority: member.risk_level === "critical" ? "urgent" : "high",
            assigned_to: currentUser.email,
            assigned_to_name: currentUser.full_name,
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: member.follow_up_reason || "Regular check-in needed"
        });
        
        await base44.entities.MemberEngagement.update(member.id, {
            needs_follow_up: false,
            assigned_to: currentUser.email
        });
        
        loadData();
    };

    const filteredData = engagementData.filter(e => {
        const matchesSearch = !searchQuery || 
            e.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.member_email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (selectedTab === "at_risk") return matchesSearch && (e.risk_level === "high" || e.risk_level === "critical");
        if (selectedTab === "inactive") return matchesSearch && (e.lifecycle_stage === "inactive" || e.days_since_contact > 30);
        if (selectedTab === "new") return matchesSearch && e.lifecycle_stage === "first_time_visitor";
        return matchesSearch;
    });

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">People Engagement</h1>
                        <p className="text-slate-600">Keep everyone connected - no one falls through the cracks</p>
                    </div>
                </div>

                {/* Alert Banner */}
                {atRiskMembers.length > 0 && (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-900">
                            <strong>{atRiskMembers.length} people</strong> need immediate attention
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-slate-600">At Risk</div>
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="text-3xl font-bold text-red-600">{atRiskMembers.length}</div>
                            <p className="text-xs text-slate-500 mt-1">Need immediate follow-up</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-slate-600">Inactive</div>
                                <TrendingDown className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="text-3xl font-bold text-orange-600">{inactive.length}</div>
                            <p className="text-xs text-slate-500 mt-1">30+ days no contact</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-slate-600">Pending Tasks</div>
                                <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-blue-600">{followUpTasks.length}</div>
                            <p className="text-xs text-slate-500 mt-1">Follow-up tasks</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-slate-600">Total Tracked</div>
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-green-600">{engagementData.length}</div>
                            <p className="text-xs text-slate-500 mt-1">People monitored</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card className="shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex gap-4 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Search people..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                                <TabsList>
                                    <TabsTrigger value="at_risk">At Risk</TabsTrigger>
                                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                                    <TabsTrigger value="new">New Visitors</TabsTrigger>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                {/* People List */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>People Requiring Attention</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredData.map(person => (
                                <div key={person.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{person.member_name}</h4>
                                                <p className="text-sm text-slate-600">{person.member_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-13">
                                            <Badge className={getRiskColor(person.risk_level)}>
                                                {person.risk_level} risk
                                            </Badge>
                                            <Badge className={getStageColor(person.lifecycle_stage)}>
                                                {person.lifecycle_stage?.replace(/_/g, ' ')}
                                            </Badge>
                                            <Badge variant="outline">
                                                Score: {person.engagement_score}/100
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-slate-600 mb-2">
                                            Last contact: {person.days_since_contact} days ago
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.location.href = `mailto:${person.member_email}`}
                                            >
                                                <Mail className="h-4 w-4 mr-1" />
                                                Email
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => createFollowUpTask(person)}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Create Task
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}