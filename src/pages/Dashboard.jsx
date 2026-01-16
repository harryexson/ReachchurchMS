import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    DollarSign,
    Calendar,
    TrendingUp,
    UserPlus,
    MapPin,
    AlertCircle
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalMembers, setTotalMembers] = useState(0);
    const [monthlyGiving, setMonthlyGiving] = useState(0);
    const [givingGrowth, setGivingGrowth] = useState(0);
    const [newVisitors, setNewVisitors] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [givingTrendData, setGivingTrendData] = useState([]);
    const [donorSegmentsData, setDonorSegmentsData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);

    const categoryStyles = {
        'Tithe': { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#3b82f6' },
        'Mission': { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#10b981' },
        'Building': { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#f59e0b' },
        'Special': { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#8b5cf6' },
        'General': { gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#6366f1' },
        'Other': { gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', color: '#94a3b8' }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const user = await base44.auth.me();
            if (!user) {
                throw new Error("Not authenticated");
            }

            const [members, donations, events] = await Promise.all([
                base44.entities.Member.list(),
                base44.entities.Donation.list(),
                base44.entities.Event.list()
            ]);

            setTotalMembers(members.length);

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const thisMonthDonations = donations.filter(d => {
                const donDate = new Date(d.donation_date);
                return donDate.getMonth() === currentMonth && donDate.getFullYear() === currentYear;
            });

            const lastMonth = new Date(currentYear, currentMonth - 1, 1);
            const lastMonthDonations = donations.filter(d => {
                const donDate = new Date(d.donation_date);
                return donDate.getMonth() === lastMonth.getMonth() && donDate.getFullYear() === lastMonth.getFullYear();
            });

            const thisMonthTotal = thisMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
            const lastMonthTotal = lastMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
            const growth = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;

            setMonthlyGiving(thisMonthTotal);
            setGivingGrowth(growth);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const last6Months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(currentYear, currentMonth - i, 1);
                const monthDonations = donations.filter(don => {
                    const donDate = new Date(don.donation_date);
                    return donDate.getMonth() === d.getMonth() && donDate.getFullYear() === d.getFullYear();
                });
                last6Months.push({
                    name: monthNames[d.getMonth()],
                    amount: monthDonations.reduce((sum, don) => sum + (don.amount || 0), 0)
                });
            }
            setGivingTrendData(last6Months);

            const categoryMap = {};
            thisMonthDonations.forEach(d => {
                const cat = d.category || 'General';
                categoryMap[cat] = (categoryMap[cat] || 0) + (d.amount || 0);
            });
            const catData = Object.entries(categoryMap).map(([category, amount]) => ({
                category,
                amount
            })).sort((a, b) => b.amount - a.amount);
            setCategoryData(catData);

            const activeCount = donations.filter(d => {
                const donDate = new Date(d.donation_date);
                const monthsAgo = (now - donDate) / (1000 * 60 * 60 * 24 * 30);
                return monthsAgo <= 3;
            }).length;

            const atRiskCount = donations.filter(d => {
                const donDate = new Date(d.donation_date);
                const monthsAgo = (now - donDate) / (1000 * 60 * 60 * 24 * 30);
                return monthsAgo > 3 && monthsAgo <= 6;
            }).length;

            const inactiveCount = Math.max(0, donations.length - activeCount - atRiskCount);

            setDonorSegmentsData([
                { name: 'Active', value: activeCount, color: '#10b981' },
                { name: 'At Risk', value: atRiskCount, color: '#f59e0b' },
                { name: 'Inactive', value: inactiveCount, color: '#ef4444' }
            ]);

            const upcoming = events
                .filter(e => new Date(e.start_datetime) >= now)
                .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
                .slice(0, 5);
            setUpcomingEvents(upcoming);

            const visitors = await base44.entities.Visitor.list();
            const thisMonthVisitors = visitors.filter(v => {
                const vDate = new Date(v.visit_date);
                return vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear;
            });
            setNewVisitors(thisMonthVisitors.length);

        } catch (err) {
            console.error("Dashboard error:", err);
            setError(err.message);
        }

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <Card className="max-w-md w-full border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                            <p className="text-blue-100 text-lg">Welcome back! Here's what's happening with your church.</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-200 mb-1">Today's Date</p>
                            <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-8 space-y-6 pb-12">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-0 overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-sm text-slate-600 mb-1">Total Members</p>
                            <h2 className="text-3xl font-bold text-slate-900">{totalMembers}</h2>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-0 overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    givingGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {givingGrowth >= 0 ? '+' : ''}{givingGrowth}%
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">Monthly Giving</p>
                            <h2 className="text-3xl font-bold text-slate-900">${monthlyGiving.toLocaleString()}</h2>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-0 overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-purple-600" />
                                </div>
                                <Badge className="bg-purple-100 text-purple-700 border-0">{upcomingEvents.length}</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">Upcoming Events</p>
                            <h2 className="text-3xl font-bold text-slate-900">{upcomingEvents.length}</h2>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-0 overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <UserPlus className="w-6 h-6 text-orange-600" />
                                </div>
                                <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">This Month</Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">New Visitors</p>
                            <h2 className="text-3xl font-bold text-slate-900">{newVisitors}</h2>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                    {/* Giving Trends Chart */}
                    <Card className="shadow-sm border-0 bg-white">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-slate-900">Giving Trends</span>
                            </CardTitle>
                            <p className="text-sm text-slate-500 mt-1">Last 6 months performance</p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={givingTrendData}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#94a3b8" 
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8" 
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            borderRadius: '12px', 
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            padding: '12px'
                                        }} 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="amount" 
                                        stroke="#3b82f6" 
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                        activeDot={{ r: 6, fill: '#2563eb' }}
                                        name="Giving"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Donor Segments */}
                    <Card className="shadow-sm border-0 bg-white">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-slate-900">Donor Segments</span>
                            </CardTitle>
                            <p className="text-sm text-slate-500 mt-1">Engagement breakdown</p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={donorSegmentsData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        innerRadius={60}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={2}
                                    >
                                        {donorSegmentsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            borderRadius: '12px', 
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            padding: '12px'
                                        }} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Giving by Category */}
                <Card className="shadow-sm border-0 bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-slate-900">Giving by Category</span>
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Where contributions are going</p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryData.map((cat) => (
                                <div key={cat.category} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ background: categoryStyles[cat.category]?.gradient || 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' }}
                                            >
                                                <DollarSign className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{cat.category}</span>
                                        </div>
                                        <span className="text-lg font-bold text-slate-900">${cat.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div
                                            className="h-2.5 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(cat.amount / categoryData.reduce((sum, c) => sum + c.amount, 0)) * 100}%`,
                                                background: categoryStyles[cat.category]?.gradient || 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {((cat.amount / categoryData.reduce((sum, c) => sum + c.amount, 0)) * 100).toFixed(1)}% of total giving
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card className="shadow-sm border-0 bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-slate-900">Upcoming Events</span>
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Next scheduled activities</p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No upcoming events</p>
                                </div>
                            ) : (
                                upcomingEvents.map((event) => (
                                    <div key={event.id} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 mb-2">{event.title}</h3>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {new Date(event.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4 text-slate-400" />
                                                        {event.location || 'TBD'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge className="capitalize bg-blue-50 text-blue-700 border-0 font-medium">
                                                {event.event_type?.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}