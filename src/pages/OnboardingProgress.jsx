import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Users, CheckCircle, Clock, Mail, Send, Search, 
    TrendingUp, UserCheck, RefreshCw 
} from "lucide-react";
import SEO from "../components/shared/SEO";

export default function OnboardingProgressPage() {
    const [onboardingRecords, setOnboardingRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSendingFollowUps, setIsSendingFollowUps] = useState(false);

    useEffect(() => {
        loadOnboardingData();
    }, []);

    const loadOnboardingData = async () => {
        setIsLoading(true);
        try {
            const records = await base44.entities.OnboardingProgress.list('-created_date');
            setOnboardingRecords(records);
        } catch (error) {
            console.error("Failed to load onboarding records:", error);
        }
        setIsLoading(false);
    };

    const sendFollowUps = async () => {
        setIsSendingFollowUps(true);
        try {
            const result = await base44.functions.invoke('sendFollowUpEmail', {});
            alert(`Sent ${result.data.sent} follow-up emails successfully`);
            await loadOnboardingData();
        } catch (error) {
            console.error("Failed to send follow-ups:", error);
            alert("Failed to send follow-ups. Please try again.");
        }
        setIsSendingFollowUps(false);
    };

    const filteredRecords = onboardingRecords.filter(record => 
        record.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: onboardingRecords.length,
        completed: onboardingRecords.filter(r => r.onboarding_completed).length,
        inProgress: onboardingRecords.filter(r => !r.onboarding_completed).length,
        needsFollowUp: onboardingRecords.filter(r => 
            r.onboarding_completed && !r.follow_up_sent && r.follow_up_date &&
            new Date(r.follow_up_date) <= new Date()
        ).length
    };

    return (
        <>
            <SEO 
                title="Onboarding Progress - REACH Church Connect"
                description="Track and manage new member and visitor onboarding progress."
                url="/onboardingprogress"
            />
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Onboarding Progress</h1>
                            <p className="text-slate-600 mt-1">Track new member and visitor onboarding status</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={sendFollowUps}
                                disabled={isSendingFollowUps || stats.needsFollowUp === 0}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSendingFollowUps ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Follow-Ups ({stats.needsFollowUp})
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={loadOnboardingData}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Total Users</p>
                                        <p className="text-3xl font-bold">{stats.total}</p>
                                    </div>
                                    <Users className="w-10 h-10 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Completed</p>
                                        <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                                    </div>
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">In Progress</p>
                                        <p className="text-3xl font-bold text-orange-600">{stats.inProgress}</p>
                                    </div>
                                    <Clock className="w-10 h-10 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Need Follow-Up</p>
                                        <p className="text-3xl font-bold text-purple-600">{stats.needsFollowUp}</p>
                                    </div>
                                    <Mail className="w-10 h-10 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Records Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Onboarding Records ({filteredRecords.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Progress</TableHead>
                                            <TableHead>Interests</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Welcome Email</TableHead>
                                            <TableHead>Follow-Up</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRecords.map(record => {
                                            const progressPercent = (record.completed_steps?.length / 5) * 100;
                                            return (
                                                <TableRow key={record.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{record.user_name}</div>
                                                            <div className="text-xs text-slate-500">{record.user_email}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {record.user_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="w-32">
                                                            <Progress value={progressPercent} className="h-2 mb-1" />
                                                            <span className="text-xs text-slate-500">
                                                                Step {record.current_step}/5
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs">
                                                            {record.interests_selected?.length || 0} selected
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.onboarding_completed ? (
                                                            <Badge className="bg-green-100 text-green-800">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Completed
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-orange-100 text-orange-800">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                In Progress
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.welcome_email_sent ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <Clock className="w-5 h-5 text-slate-300" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.follow_up_sent ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                                        ) : record.follow_up_date && new Date(record.follow_up_date) <= new Date() ? (
                                                            <Badge className="bg-purple-100 text-purple-800">Due</Badge>
                                                        ) : (
                                                            <Clock className="w-5 h-5 text-slate-300" />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}