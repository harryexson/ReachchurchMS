import React from "react";
import { PlatformExpense } from "@/entities/PlatformExpense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, PieChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';

export default function AccountingDashboard({ invoices, expenses, subscriptions, refunds, isLoading, onRefresh }) {
    const [showExpenseForm, setShowExpenseForm] = React.useState(false);

    // Calculate financial metrics
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
    const totalExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalRefunds = refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses - totalRefunds;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Monthly revenue data
    const monthlyData = [
        { month: 'Jan', revenue: 12500, expenses: 8200 },
        { month: 'Feb', revenue: 15200, expenses: 8500 },
        { month: 'Mar', revenue: 18900, expenses: 9100 },
        { month: 'Apr', revenue: 21400, expenses: 9800 },
        { month: 'May', revenue: 24100, expenses: 10200 },
        { month: 'Jun', revenue: totalRevenue / 1000, expenses: totalExpenses / 1000 },
    ];

    // Expense breakdown
    const expenseCategories = [
        { name: 'Server Hosting', value: expenses.filter(e => e.category === 'server_hosting').reduce((sum, e) => sum + e.amount, 0), color: '#3b82f6' },
        { name: 'API Costs', value: expenses.filter(e => e.category === 'api_costs').reduce((sum, e) => sum + e.amount, 0), color: '#8b5cf6' },
        { name: 'Marketing', value: expenses.filter(e => e.category === 'marketing').reduce((sum, e) => sum + e.amount, 0), color: '#ec4899' },
        { name: 'Other', value: expenses.filter(e => !['server_hosting', 'api_costs', 'marketing'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0), color: '#10b981' },
    ].filter(cat => cat.value > 0);

    return (
        <div className="space-y-6">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Net Profit</p>
                                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${netProfit.toLocaleString()}
                                </p>
                            </div>
                            <Wallet className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Profit Margin</p>
                                <p className="text-2xl font-bold text-blue-600">{profitMargin}%</p>
                            </div>
                            <PieChart className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue vs Expenses Chart */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Revenue vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Breakdown */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <RechartsPie>
                                <Pie
                                    data={expenseCategories}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expenseCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Expenses */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Recent Expenses</span>
                            <Button size="sm" onClick={() => setShowExpenseForm(true)}>
                                <Receipt className="w-4 h-4 mr-2" />
                                Add Expense
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {expenses.slice(0, 5).map(expense => (
                                <div key={expense.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                                    <div>
                                        <p className="font-medium text-slate-900">{expense.description}</p>
                                        <p className="text-xs text-slate-500 capitalize">{expense.category?.replace('_', ' ')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-900">${expense.amount?.toLocaleString()}</p>
                                        <Badge variant="outline" className="text-xs">{expense.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}