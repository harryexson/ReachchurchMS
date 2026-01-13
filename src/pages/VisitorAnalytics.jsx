import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, UserCheck, UserPlus, Calendar, MapPin } from "lucide-react";

export default function VisitorAnalytics() {
    const [visitors, setVisitors] = useState([]);
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("30");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [visitorData, memberData] = await Promise.all([
                base44.entities.Visitor.list(),
                base44.entities.Member.list()
            ]);
            setVisitors(visitorData);
            setMembers(memberData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
        setIsLoading(false);
    };

    // Filter visitors by time range
    const getFilteredVisitors = () => {
        if (timeRange === "all") return visitors;
        const daysAgo = parseInt(timeRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        return visitors.filter(v => new Date(v.visit_date) >= cutoffDate);
    };

    const filteredVisitors = getFilteredVisitors();

    // Calculate key metrics
    const totalVisitors = filteredVisitors.length;
    const convertedToMembers = filteredVisitors.filter(v => v.converted_to_member).length;
    const conversionRate = totalVisitors > 0 ? ((convertedToMembers / totalVisitors) * 100).toFixed(1) : 0;
    const activeFollowUps = filteredVisitors.filter(v => 
        ['new', 'contacted_1', 'contacted_2', 'contacted_3', 'contacted_4'].includes(v.follow_up_status)
    ).length;

    // Visitors over time
    const getVisitorsOverTime = () => {
        const grouped = {};
        filteredVisitors.forEach(v => {
            const date = new Date(v.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            grouped[date] = (grouped[date] || 0) + 1;
        });
        return Object.entries(grouped).map(([date, count]) => ({ date, visitors: count })).slice(-30);
    };

    // Visitor sources
    const getVisitorSources = () => {
        const sources = {};
        filteredVisitors.forEach(v => {
            const source = v.how_did_you_hear || "Unknown";
            sources[source] = (sources[source] || 0) + 1;
        });
        return Object.entries(sources).map(([name, value]) => ({ name, value }));
    };

    // Interest trends
    const getInterestTrends = () => {
        const interests = {};
        filteredVisitors.forEach(v => {
            (v.interests || []).forEach(interest => {
                interests[interest] = (interests[interest] || 0) + 1;
            });
        });
        return Object.entries(interests)
            .map(([interest, count]) => ({ interest, count }))
            .sort((a, b) => b.count - a.count);
    };

    // Follow-up status distribution
    const getStatusDistribution = () => {
        const statuses = {
            'new': 0,
            'contacted_1': 0,
            'contacted_2': 0,
            'contacted_3': 0,
            'contacted_4': 0,
            'engaged': 0,
            'member': 0,
            'archived': 0
        };
        filteredVisitors.forEach(v => {
            const status = v.follow_up_status || 'new';
            statuses[status] = (statuses[status] || 0) + 1;
        });
        return Object.entries(statuses).map(([name, value]) => ({ 
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
            value 
        }));
    };

    // Conversion funnel
    const getConversionFunnel = () => {
        const newVisitors = filteredVisitors.filter(v => v.follow_up_status === 'new').length;
        const contacted = filteredVisitors.filter(v => v.follow_up_status?.startsWith('contacted')).length;
        const engaged = filteredVisitors.filter(v => v.follow_up_status === 'engaged').length;
        const converted = filteredVisitors.filter(v => v.converted_to_member).length;

        return [
            { stage: 'New Visitors', count: newVisitors },
            { stage: 'Contacted', count: contacted },
            { stage: 'Engaged', count: engaged },
            { stage: 'Converted', count: converted }
        ];
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    if (isLoading) {
        return <div className="p-6 text-center">Loading analytics...</div>;
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Visitor Analytics</h1>
                        <p className="text-slate-600 mt-1">Comprehensive insights into visitor engagement and conversion</p>
                    </div>
                    <div className="w-48">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 Days</SelectItem>
                                <SelectItem value="30">Last 30 Days</SelectItem>
                                <SelectItem value="90">Last 90 Days</SelectItem>
                                <SelectItem value="365">Last Year</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold">{totalVisitors}</p>
                                    <p className="text-sm text-slate-600">Total Visitors</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <UserCheck className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold">{convertedToMembers}</p>
                                    <p className="text-sm text-slate-600">Converted to Members</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-purple-600" />
                                <div>
                                    <p className="text-2xl font-bold">{conversionRate}%</p>
                                    <p className="text-sm text-slate-600">Conversion Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <UserPlus className="w-8 h-8 text-orange-600" />
                                <div>
                                    <p className="text-2xl font-bold">{activeFollowUps}</p>
                                    <p className="text-sm text-slate-600">Active Follow-ups</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="sources">Sources</TabsTrigger>
                        <TabsTrigger value="interests">Interests</TabsTrigger>
                        <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Visitors Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={getVisitorsOverTime()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Follow-up Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={getStatusDistribution()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {getStatusDistribution().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sources">
                        <Card>
                            <CardHeader>
                                <CardTitle>How Visitors Heard About Us</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie
                                            data={getVisitorSources()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {getVisitorSources().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="interests">
                        <Card>
                            <CardHeader>
                                <CardTitle>Visitor Interest Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={getInterestTrends()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="interest" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="conversion">
                        <Card>
                            <CardHeader>
                                <CardTitle>Visitor Conversion Funnel</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={getConversionFunnel()} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="stage" type="category" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {getConversionFunnel().map((stage, index) => (
                                        <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                                            <p className="text-2xl font-bold text-slate-900">{stage.count}</p>
                                            <p className="text-sm text-slate-600">{stage.stage}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}