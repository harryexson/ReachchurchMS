import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, TrendingUp, Users, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function GivingStats({ donations, isLoading }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-8 w-24 mb-4" />
                            <Skeleton className="h-4 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);
    
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);

    const currentMonthDonations = donations.filter(d => {
        const date = new Date(d.donation_date);
        return date >= currentMonthStart && date <= currentMonthEnd;
    });

    const lastMonthDonations = donations.filter(d => {
        const date = new Date(d.donation_date);
        return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const totalThisMonth = currentMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalLastMonth = lastMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalAllTime = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const uniqueDonors = new Set(donations.map(d => d.donor_email)).size;
    
    const monthlyGrowth = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth * 100).toFixed(1) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full opacity-10" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-600 mb-2">This Month</p>
                            <p className="text-2xl md:text-3xl font-bold text-slate-900">${totalThisMonth.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                        <span className="text-slate-600">{monthlyGrowth}% vs last month</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-10" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-600 mb-2">Total All Time</p>
                            <p className="text-2xl md:text-3xl font-bold text-slate-900">${totalAllTime.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm">
                        <span className="text-slate-600">{donations.length} donations</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full opacity-10" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-600 mb-2">Unique Donors</p>
                            <p className="text-2xl md:text-3xl font-bold text-slate-900">{uniqueDonors}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm">
                        <span className="text-slate-600">Active givers</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full opacity-10" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-600 mb-2">Average Gift</p>
                            <p className="text-2xl md:text-3xl font-bold text-slate-900">
                                ${donations.length > 0 ? (totalAllTime / donations.length).toFixed(0) : 0}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm">
                        <span className="text-slate-600">Per donation</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}