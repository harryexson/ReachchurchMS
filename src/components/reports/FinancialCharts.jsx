import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react";

export default function FinancialCharts({ donations }) {
    // Monthly trend data
    const monthlyData = React.useMemo(() => {
        const monthMap = {};
        donations.forEach(d => {
            const month = new Date(d.donation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!monthMap[month]) {
                monthMap[month] = { month, amount: 0, count: 0 };
            }
            monthMap[month].amount += d.amount;
            monthMap[month].count++;
        });
        return Object.values(monthMap).sort((a, b) => new Date(a.month) - new Date(b.month));
    }, [donations]);

    // Donation type distribution
    const typeData = React.useMemo(() => {
        const typeMap = {};
        donations.forEach(d => {
            const type = d.donation_type || 'other';
            const formatted = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (!typeMap[type]) {
                typeMap[type] = { name: formatted, value: 0, count: 0 };
            }
            typeMap[type].value += d.amount;
            typeMap[type].count++;
        });
        return Object.values(typeMap).sort((a, b) => b.value - a.value);
    }, [donations]);

    // Payment method distribution
    const methodData = React.useMemo(() => {
        const methodMap = {};
        donations.forEach(d => {
            const method = d.payment_method || 'unknown';
            const formatted = method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (!methodMap[method]) {
                methodMap[method] = { name: formatted, value: 0 };
            }
            methodMap[method].value += d.amount;
        });
        return Object.values(methodMap);
    }, [donations]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Giving Trend Over Time
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-purple-600" />
                        Distribution by Type
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                        Donations by Category
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={100} />
                                <YAxis fontSize={12} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}