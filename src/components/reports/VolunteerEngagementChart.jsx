import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCheck } from "lucide-react";

export default function VolunteerEngagementChart({ volunteers, isLoading }) {
    if (isLoading) {
        return (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Volunteer Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const ministryData = [
        { ministry: 'Worship Team', count: volunteers.filter(v => v.ministry === 'worship_team').length },
        { ministry: 'Children\'s Ministry', count: volunteers.filter(v => v.ministry === 'children_ministry').length },
        { ministry: 'Hospitality', count: volunteers.filter(v => v.ministry === 'hospitality').length },
        { ministry: 'Media & Tech', count: volunteers.filter(v => v.ministry === 'media_tech').length },
        { ministry: 'Outreach', count: volunteers.filter(v => v.ministry === 'outreach').length }
    ].filter(item => item.count > 0);

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-600" />
                    Volunteers by Ministry
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ministryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="ministry" 
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
                            <Bar 
                                dataKey="count" 
                                fill="#f59e0b"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}