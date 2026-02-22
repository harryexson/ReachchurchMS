import React, { useState, useEffect } from "react";
import { Donation } from "@/entities/Donation";
import { Member } from "@/entities/Member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, PlusCircle, DollarSign, ArrowUpRight, Calendar, Users, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import DonationForm from "../components/giving/DonationForm";
import ReportExportModal from "../components/reports/ReportExportModal";
import GoalTracker from "../components/giving/GoalTracker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { base44 } from "@/api/base44Client";

export default function GivingPage() {
    const [donations, setDonations] = useState([]);
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [categoryStats, setCategoryStats] = useState([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const CATEGORY_COLORS = {
        tithe: { gradient: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50', pie: '#3b82f6' },
        offering: { gradient: 'from-green-500 to-emerald-600', bg: 'from-green-50 to-emerald-50', pie: '#10b981' },
        building_fund: { gradient: 'from-purple-500 to-pink-600', bg: 'from-purple-50 to-pink-50', pie: '#a855f7' },
        missions: { gradient: 'from-orange-500 to-amber-600', bg: 'from-orange-50 to-amber-50', pie: '#f97316' },
        special_event: { gradient: 'from-red-500 to-rose-600', bg: 'from-red-50 to-rose-50', pie: '#ef4444' },
        other: { gradient: 'from-cyan-500 to-teal-600', bg: 'from-cyan-50 to-teal-50', pie: '#06b6d4' }
    };

    useEffect(() => {
        loadData();

        // CRITICAL: Real-time updates when donations are added/modified in back office
        let unsubscribeDonations = null;
        
        base44.auth.me().then(user => {
            if (user) {
                unsubscribeDonations = base44.entities.Donation.subscribe((event) => {
                    const churchFilter = user.role === 'admin' ? user.email : user.email;
                    const isRelevant = user.role === 'admin' 
                        ? event.data.church_admin_email === churchFilter
                        : event.data.donor_email === churchFilter;
                    
                    if (isRelevant) {
                        console.log('🔄 Donation updated in real-time:', event.type);
                        loadData();
                    }
                });
            }
        }).catch(err => console.error('Error setting up donation listener:', err));

        return () => {
            if (unsubscribeDonations) unsubscribeDonations();
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        
        // Get current user to filter by organization
        const user = await base44.auth.me();
        
        // For admins: filter by church_admin_email to ensure proper data isolation
        // For members: filter by their own email
        const churchFilter = user.role === 'admin' 
            ? { church_admin_email: user.email }
            : { donor_email: user.email };
        
        const [donationsList, membersList] = await Promise.all([
            base44.entities.Donation.filter(churchFilter, "-donation_date"),
            base44.entities.Member.filter({ church_admin_email: user.email })
        ]);
        setDonations(donationsList);
        setMembers(membersList);

        // Calculate category statistics
        const categoryMap = {};
        donationsList.forEach(d => {
            const cat = d.donation_type || 'other';
            if (!categoryMap[cat]) {
                categoryMap[cat] = { 
                    category: cat, 
                    total: 0, 
                    count: 0,
                    donors: new Set()
                };
            }
            categoryMap[cat].total += d.amount || 0;
            categoryMap[cat].count += 1;
            categoryMap[cat].donors.add(d.donor_email);
        });
        
        const stats = Object.values(categoryMap).map(c => ({
            ...c,
            donorCount: c.donors.size
        })).sort((a, b) => b.total - a.total);
        
        setCategoryStats(stats);
        setIsLoading(false);
    };

    const handleFormSubmit = async (data) => {
        let donationId;
        if (selectedDonation) {
            await base44.entities.Donation.update(selectedDonation.id, data);
            donationId = selectedDonation.id;
        } else {
            const newDonation = await base44.entities.Donation.create(data);
            donationId = newDonation.id;
            
            // Automatically send receipt for new donations
            try {
                await base44.functions.invoke('sendDonationReceipt', {
                    donation_id: donationId,
                    donation_data: data
                });
            } catch (error) {
                console.error('Failed to send receipt:', error);
            }
        }
        await loadData();
        setIsFormOpen(false);
        setSelectedDonation(null);
    };

    const handleEdit = (donation) => {
        setSelectedDonation(donation);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedDonation(null);
        setIsFormOpen(true);
    };

    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthlyDonations = donations.filter(d => {
        const donationDate = new Date(d.donation_date);
        return donationDate >= monthStart && donationDate <= monthEnd;
    });

    const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalAllTime = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const uniqueDonors = new Set(donations.map(d => d.donor_email)).size;
    const avgDonation = donations.length > 0 ? totalAllTime / donations.length : 0;

    // Prepare pie chart data
    const pieData = categoryStats.map(cat => ({
        name: cat.category.replace('_', ' '),
        value: cat.total,
        color: CATEGORY_COLORS[cat.category]?.pie || '#64748b'
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/20">
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Giving & Donations</h1>
                        <p className="text-slate-600 mt-1">Track contributions and manage donor relationships.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setIsExportModalOpen(true)} 
                            variant="outline"
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Record Donation
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">This Month</p>
                            <p className="text-3xl font-bold text-slate-900">
                                ${monthlyTotal.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">{monthlyDonations.length} donations</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    <Heart className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Total All Time</p>
                            <p className="text-3xl font-bold text-slate-900">
                                ${totalAllTime.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">{donations.length} total gifts</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Unique Donors</p>
                            <p className="text-3xl font-bold text-slate-900">{uniqueDonors}</p>
                            <p className="text-xs text-slate-500 mt-2">Active givers</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">Average Gift</p>
                            <p className="text-3xl font-bold text-slate-900">
                                ${avgDonation.toFixed(0)}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">Per donation</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Financial Goal Tracker */}
                <GoalTracker donations={donations} />

                {/* Giving by Category - Featured Section */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-2xl text-slate-900">Giving by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Category Bars */}
                            <div className="space-y-4">
                                {categoryStats.map((cat, idx) => {
                                    const colorConfig = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.other;
                                    const percentage = totalAllTime > 0 ? (cat.total / totalAllTime * 100).toFixed(1) : 0;
                                    
                                    return (
                                        <div key={cat.category} className={`p-5 rounded-xl bg-gradient-to-br ${colorConfig.bg} border border-slate-100 hover:shadow-md transition-all`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 capitalize">
                                                        {cat.category.replace('_', ' ')}
                                                    </h3>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {cat.count} donations • {cat.donorCount} donors
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-slate-900">
                                                        ${cat.total.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{percentage}% of total</p>
                                                </div>
                                            </div>
                                            <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full bg-gradient-to-r ${colorConfig.gradient} rounded-full transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pie Chart */}
                            <div className="flex items-center justify-center">
                                <div className="w-full h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Donation History */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-slate-900">Recent Donations</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {donations.slice(0, 10).map(donation => {
                                const colorConfig = CATEGORY_COLORS[donation.donation_type] || CATEGORY_COLORS.other;
                                
                                return (
                                    <div key={donation.id} className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-100 hover:shadow-md transition-all flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 bg-gradient-to-br ${colorConfig.gradient} rounded-xl`}>
                                                <Heart className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{donation.donor_name}</h3>
                                                <p className="text-sm text-slate-600">{donation.donor_email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className="text-xs capitalize">
                                                        {donation.donation_type?.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500">
                                                        {format(new Date(donation.donation_date), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-600">
                                                ${donation.amount?.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-slate-500 capitalize">{donation.payment_method}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {isFormOpen && (
                    <DonationForm
                        isOpen={isFormOpen}
                        setIsOpen={setIsFormOpen}
                        onSubmit={handleFormSubmit}
                        donation={selectedDonation}
                        members={members}
                    />
                )}

                {isExportModalOpen && (
                    <ReportExportModal
                        isOpen={isExportModalOpen}
                        setIsOpen={setIsExportModalOpen}
                        reportType="giving"
                    />
                )}
            </div>
        </div>
    );
}