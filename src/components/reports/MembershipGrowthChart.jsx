import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Users } from "lucide-react";

export default function MembershipGrowthChart({ members, isLoading }) {
    if (isLoading) {
        return (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Membership Growth</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const currentMonth = new Date();
    const chartData = [];
    
    for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(currentMonth, i);
        const monthEnd = endOfMonth(monthDate);
        
        const membersUpToMonth = members.filter(m => {
            const joinDate = new Date(m.created_date);
            return joinDate <= monthEnd;
        });
        
        chartData.push({
            month: format(monthDate, 'MMM yyyy'),
            total: membersUpToMonth.length,
            active: membersUpToMonth.filter(m => m.member_status === 'member').length
        });
    }

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Membership Growth
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="month" 
                                stroke="#64748b"
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis 
                                stroke="#64748b"
                                fontSize={12}
                            />
                            <Tooltip 
                                labelStyle={{ color: '#334155' }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                name="Total Members"
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="active" 
                                stroke="#10b981" 
                                strokeWidth={3}
                                name="Active Members"
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}