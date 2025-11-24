
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Users, Heart, Calendar, TrendingUp, Download, Youtube } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { createPageUrl } from "@/utils";
import MembershipGrowthChart from "../components/reports/MembershipGrowthChart";
import GivingTrendsChart from "../components/reports/GivingTrendsChart";
import EventAttendanceChart from "../components/reports/EventAttendanceChart";
import VolunteerEngagementChart from "../components/reports/VolunteerEngagementChart";
import SermonViewershipChart from "../components/reports/SermonViewershipChart";
import KidsCheckInReport from "../components/reports/KidsCheckInReport";
import ReportExportModal from "../components/reports/ReportExportModal";

export default function ReportsPage() {
    const [members, setMembers] = useState([]);
    const [donations, setDonations] = useState([]);
    const [events, setEvents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [sermons, setSermons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTimeRange, setSelectedTimeRange] = useState("12months");
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState('');

    useEffect(() => {
        checkAccess();
        loadData();
    }, []);

    const checkAccess = async () => {
        try {
            const user = await base44.auth.me();
            // Only admins and users with specific access can view kids reports
            if (user.role !== 'admin' && user.access_level !== 'pastor') {
                // Redirect non-authorized users
                alert("You don't have permission to view this page. This section is restricted to administrators and senior pastoral staff only.");
                window.location.href = createPageUrl('Dashboard');
            }
        } catch (error) {
            console.error("Access check error:", error);
            // Optionally, handle error by redirecting or showing a generic error message
            alert("Failed to verify access. Please try again or contact support.");
            window.location.href = createPageUrl('Login'); // Redirect to login or home
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        const [membersList, donationsList, eventsList, volunteersList, sermonList] = await Promise.all([
            base44.entities.Member.list("-created_date"),
            base44.entities.Donation.list("-donation_date"),
            base44.entities.Event.list("-start_datetime"),
            base44.entities.Volunteer.list("-created_date"),
            base44.entities.Sermon.list("-sermon_date")
        ]);
        setMembers(membersList);
        setDonations(donationsList);
        setEvents(eventsList);
        setVolunteers(volunteersList);
        setSermons(sermonList);
        setIsLoading(false);
    };

    const handleExportReport = (reportType) => {
        setSelectedReportType(reportType);
        setIsExportModalOpen(true);
    };

    // Calculate key metrics
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.member_status === 'member').length;
    const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const avgDonation = donations.length > 0 ? totalDonations / donations.length : 0;
    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    const activeVolunteers = volunteers.filter(v => v.status === 'active').length;

    // Member status distribution
    const memberStatusData = [
        { name: 'Members', value: members.filter(m => m.member_status === 'member').length, color: '#10b981' },
        { name: 'Regular Attendees', value: members.filter(m => m.member_status === 'regular_attendee').length, color: '#3b82f6' },
        { name: 'Visitors', value: members.filter(m => m.member_status === 'visitor').length, color: '#8b5cf6' },
        { name: 'Inactive', value: members.filter(m => m.member_status === 'inactive').length, color: '#6b7280' }
    ];

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Analytics & Reports</h1>
                        <p className="text-slate-600 mt-1">Comprehensive insights into your church's growth and health.</p>
                    </div>
                    <div className="flex gap-2">
                        <Select onValueChange={handleExportReport}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Export Report" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="financial">
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        Financial Report
                                    </div>
                                </SelectItem>
                                <SelectItem value="members">
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        Member Directory
                                    </div>
                                </SelectItem>
                                <SelectItem value="giving">
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        Giving Report
                                    </div>
                                </SelectItem>
                                <SelectItem value="events">
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        Event Attendance
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Key Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-10" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-600 mb-2">Total Members</p>
                                    <p className="text-2xl md:text-3xl font-bold text-slate-900">{totalMembers}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="text-slate-600">{activeMembers} active members</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full opacity-10" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-600 mb-2">Total Giving</p>
                                    <p className="text-2xl md:text-3xl font-bold text-slate-900">${totalDonations.toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                                    <Heart className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="text-slate-600">Avg: ${avgDonation.toFixed(0)} per gift</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full opacity-10" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-600 mb-2">Events</p>
                                    <p className="text-2xl md:text-3xl font-bold text-slate-900">{totalEvents}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="text-slate-600">{completedEvents} completed</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full opacity-10" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-600 mb-2">Active Volunteers</p>
                                    <p className="text-2xl md:text-3xl font-bold text-slate-900">{activeVolunteers}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="text-slate-600">{volunteers.length} total volunteers</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="giving" className="space-y-6">
                    <TabsList className="flex flex-wrap h-auto justify-start">
                        <TabsTrigger value="giving">Giving Trends</TabsTrigger>
                        <TabsTrigger value="membership">Membership Growth</TabsTrigger>
                        <TabsTrigger value="events">Event Attendance</TabsTrigger>
                        <TabsTrigger value="volunteers">Volunteer Engagement</TabsTrigger>
                        <TabsTrigger value="sermons">Sermon Analytics</TabsTrigger>
                        <TabsTrigger value="kids">Kids Check-In/Out</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="giving">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <GivingTrendsChart donations={donations} isLoading={isLoading} />
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Giving by Type</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="h-64 flex items-center justify-center">
                                            <Skeleton className="h-32 w-32 rounded-full" />
                                        </div>
                                    ) : (
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Tithes', value: donations.filter(d => d.donation_type === 'tithe').length },
                                                            { name: 'Offerings', value: donations.filter(d => d.donation_type === 'offering').length },
                                                            { name: 'Building Fund', value: donations.filter(d => d.donation_type === 'building_fund').length },
                                                            { name: 'Missions', value: donations.filter(d => d.donation_type === 'missions').length }
                                                        ].filter(item => item.value > 0)}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'].map((color, index) => (
                                                            <Cell key={`cell-${index}`} fill={color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="membership">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <MembershipGrowthChart members={members} isLoading={isLoading} />
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Membership Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="h-64 flex items-center justify-center">
                                            <Skeleton className="h-32 w-32 rounded-full" />
                                        </div>
                                    ) : (
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={memberStatusData.filter(item => item.value > 0)}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {memberStatusData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="events">
                        <EventAttendanceChart events={events} isLoading={isLoading} />
                    </TabsContent>
                    
                    <TabsContent value="volunteers">
                        <VolunteerEngagementChart volunteers={volunteers} isLoading={isLoading} />
                    </TabsContent>
                    
                    <TabsContent value="sermons">
                        <SermonViewershipChart sermons={sermons} isLoading={isLoading} />
                    </TabsContent>
                    
                    <TabsContent value="kids">
                        <KidsCheckInReport />
                    </TabsContent>
                </Tabs>
            </div>
            {isExportModalOpen && (
                <ReportExportModal
                    isOpen={isExportModalOpen}
                    setIsOpen={setIsExportModalOpen}
                    reportType={selectedReportType}
                />
            )}
        </div>
    );
}
