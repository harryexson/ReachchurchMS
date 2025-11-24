import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign, Target, Heart, UserCheck, Activity, Loader2 } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export default function AnalyticsDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('12');
    const [donations, setDonations] = useState([]);
    const [events, setEvents] = useState([]);
    const [members, setMembers] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    
    const [metrics, setMetrics] = useState({
        totalDonations: 0,
        avgDonation: 0,
        donorRetention: 0,
        recurringDonors: 0,
        totalEvents: 0,
        avgAttendance: 0,
        rsvpRate: 0,
        newMembers: 0,
        activeUsers: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [donationsData, eventsData, membersData, visitorsData, regsData] = await Promise.all([
                base44.entities.Donation.list('-donation_date', 1000),
                base44.entities.Event.list('-start_datetime', 200),
                base44.entities.Member.list(),
                base44.entities.Visitor.list(),
                base44.entities.EventRegistration.list()
            ]);

            setDonations(donationsData);
            setEvents(eventsData);
            setMembers(membersData);
            setVisitors(visitorsData);
            setRegistrations(regsData);

            calculateMetrics(donationsData, eventsData, membersData, visitorsData, regsData);
        } catch (error) {
            console.error("Failed to load analytics:", error);
        }
        setIsLoading(false);
    };

    const calculateMetrics = (donationsData, eventsData, membersData, visitorsData, regsData) => {
        const now = new Date();
        const threeMonthsAgo = subMonths(now, 3);
        const sixMonthsAgo = subMonths(now, 6);

        // Donation Metrics
        const totalDonations = donationsData.reduce((sum, d) => sum + (d.amount || 0), 0);
        const avgDonation = donationsData.length > 0 ? totalDonations / donationsData.length : 0;

        // Donor Retention: donors who gave in last 3 months AND in previous 3 months
        const recentDonors = new Set(donationsData
            .filter(d => new Date(d.donation_date) >= threeMonthsAgo)
            .map(d => d.donor_email));
        
        const oldDonors = new Set(donationsData
            .filter(d => {
                const date = new Date(d.donation_date);
                return date >= sixMonthsAgo && date < threeMonthsAgo;
            })
            .map(d => d.donor_email));

        const retainedDonors = [...recentDonors].filter(email => oldDonors.has(email));
        const donorRetention = oldDonors.size > 0 ? (retainedDonors.length / oldDonors.size) * 100 : 0;

        const recurringDonors = donationsData.filter(d => d.recurring).length;

        // Event Metrics
        const pastEvents = eventsData.filter(e => new Date(e.start_datetime) < now);
        const avgAttendance = pastEvents.length > 0 
            ? pastEvents.reduce((sum, e) => sum + (e.actual_attendance || 0), 0) / pastEvents.length 
            : 0;

        const eventsWithRegs = pastEvents.filter(e => {
            const eventRegs = regsData.filter(r => r.event_id === e.id);
            return eventRegs.length > 0;
        });

        const totalExpected = eventsWithRegs.reduce((sum, e) => {
            return sum + regsData.filter(r => r.event_id === e.id).length;
        }, 0);

        const totalAttended = eventsWithRegs.reduce((sum, e) => {
            return sum + regsData.filter(r => r.event_id === e.id && r.checked_in).length;
        }, 0);

        const rsvpRate = totalExpected > 0 ? (totalAttended / totalExpected) * 100 : 0;

        // Member & Activity Metrics
        const newMembers = membersData.filter(m => {
            return m.join_date && new Date(m.join_date) >= threeMonthsAgo;
        }).length;

        const activeUsers = membersData.length + visitorsData.filter(v => 
            v.last_visit_date && new Date(v.last_visit_date) >= subMonths(now, 1)
        ).length;

        setMetrics({
            totalDonations,
            avgDonation,
            donorRetention,
            recurringDonors,
            totalEvents: eventsData.length,
            avgAttendance,
            rsvpRate,
            newMembers,
            activeUsers
        });
    };

    const getDonationTrends = () => {
        const months = parseInt(timeRange);
        const trends = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const monthDate = subMonths(now, i);
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);

            const monthDonations = donations.filter(d => {
                const date = new Date(d.donation_date);
                return date >= monthStart && date <= monthEnd;
            });

            const total = monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
            const count = monthDonations.length;
            const uniqueDonors = new Set(monthDonations.map(d => d.donor_email)).size;

            trends.push({
                month: format(monthDate, 'MMM yyyy'),
                amount: total,
                count: count,
                donors: uniqueDonors
            });
        }

        return trends;
    };

    const getDonationsByCategory = () => {
        const categoryMap = {};
        donations.forEach(d => {
            const cat = d.donation_type || 'other';
            if (!categoryMap[cat]) {
                categoryMap[cat] = { name: cat, value: 0 };
            }
            categoryMap[cat].value += d.amount || 0;
        });
        return Object.values(categoryMap).sort((a, b) => b.value - a.value).slice(0, 6);
    };

    const getEventPerformance = () => {
        const now = new Date();
        return events
            .filter(e => new Date(e.start_datetime) < now)
            .slice(0, 10)
            .map(e => {
                const eventRegs = registrations.filter(r => r.event_id === e.id);
                const attended = eventRegs.filter(r => r.checked_in).length;
                return {
                    name: e.title.substring(0, 20),
                    registered: eventRegs.length,
                    attended: e.actual_attendance || attended
                };
            });
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
                        <p className="text-slate-600 mt-1">Comprehensive insights and performance metrics</p>
                    </div>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6">Last 6 Months</SelectItem>
                            <SelectItem value="12">Last 12 Months</SelectItem>
                            <SelectItem value="24">Last 24 Months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-500 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Total Donations</p>
                            <p className="text-3xl font-bold text-slate-900">
                                ${metrics.totalDonations.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-green-500 rounded-xl">
                                    <Heart className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Donor Retention</p>
                            <p className="text-3xl font-bold text-slate-900">
                                {metrics.donorRetention.toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-purple-500 rounded-xl">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Avg Event Attendance</p>
                            <p className="text-3xl font-bold text-slate-900">
                                {Math.round(metrics.avgAttendance)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-orange-500 rounded-xl">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Active Users</p>
                            <p className="text-3xl font-bold text-slate-900">
                                {metrics.activeUsers}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="donations" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="donations">Donation Analytics</TabsTrigger>
                        <TabsTrigger value="donors">Donor Insights</TabsTrigger>
                        <TabsTrigger value="events">Event Performance</TabsTrigger>
                        <TabsTrigger value="activity">Activity Metrics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="donations" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle>Donation Trends</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={getDonationTrends()}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="month" fontSize={12} />
                                                <YAxis fontSize={12} />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} name="Amount ($)" />
                                                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Count" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle>Donations by Category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={getDonationsByCategory()}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {getDonationsByCategory().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="donors" className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Average Donation</p>
                                        <Target className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        ${metrics.avgDonation.toFixed(2)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Recurring Donors</p>
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {metrics.recurringDonors}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Retention Rate</p>
                                        <Heart className="w-5 h-5 text-red-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {metrics.donorRetention.toFixed(1)}%
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Donor Growth</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getDonationTrends()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" fontSize={12} />
                                            <YAxis fontSize={12} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="donors" fill="#8b5cf6" name="Unique Donors" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="events" className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Total Events</p>
                                        <Calendar className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {metrics.totalEvents}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Avg Attendance</p>
                                        <Users className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {Math.round(metrics.avgAttendance)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">RSVP Rate</p>
                                        <UserCheck className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {metrics.rsvpRate.toFixed(1)}%
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Recent Event Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getEventPerformance()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" fontSize={12} />
                                            <YAxis fontSize={12} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="registered" fill="#3b82f6" name="Registered" />
                                            <Bar dataKey="attended" fill="#10b981" name="Attended" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Total Members</p>
                                        <Users className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {members.length}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">New Members (3mo)</p>
                                        <UserCheck className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {metrics.newMembers}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-600">Total Visitors</p>
                                        <Activity className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {visitors.length}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Activity Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                        <span className="font-medium">Total Donations Processed</span>
                                        <span className="text-2xl font-bold text-blue-600">{donations.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                                        <span className="font-medium">Total Event Registrations</span>
                                        <span className="text-2xl font-bold text-green-600">{registrations.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                                        <span className="font-medium">Active Users (Last 30 Days)</span>
                                        <span className="text-2xl font-bold text-purple-600">{metrics.activeUsers}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}