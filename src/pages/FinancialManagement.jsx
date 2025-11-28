import React, { useState, useEffect } from "react";
import FeatureGate from "../components/subscription/FeatureGate";
import { Expense } from "@/entities/Expense";
import { Budget } from "@/entities/Budget";
import { Donation } from "@/entities/Donation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Download, AlertTriangle, CheckCircle, Camera, Repeat, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import ExpenseForm from "../components/financial/ExpenseForm";
import BudgetForm from "../components/financial/BudgetForm";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

export default function FinancialManagementPage() {
    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [donations, setDonations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
    const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [selectedBudget, setSelectedBudget] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [expensesList, budgetsList, donationsList] = await Promise.all([
            Expense.list("-expense_date"),
            Budget.list(),
            Donation.list("-donation_date")
        ]);
        setExpenses(expensesList);
        setBudgets(budgetsList);
        setDonations(donationsList);
        setIsLoading(false);
    };

    const handleExpenseSubmit = async (data) => {
        if (selectedExpense) {
            await Expense.update(selectedExpense.id, data);
        } else {
            await Expense.create(data);
        }
        await loadData();
        setIsExpenseFormOpen(false);
        setSelectedExpense(null);
    };

    const handleBudgetSubmit = async (data) => {
        // Calculate derived fields
        const remaining = data.allocated_amount - (data.spent_amount || 0);
        const percentage = data.allocated_amount > 0 ? ((data.spent_amount || 0) / data.allocated_amount * 100) : 0;
        
        const budgetData = {
            ...data,
            remaining_amount: remaining,
            percentage_used: percentage,
            status: percentage > 100 ? 'over_budget' : percentage > 85 ? 'approaching_limit' : 'on_track'
        };

        if (selectedBudget) {
            await Budget.update(selectedBudget.id, budgetData);
        } else {
            await Budget.create(budgetData);
        }
        await loadData();
        setIsBudgetFormOpen(false);
        setSelectedBudget(null);
    };

    // Financial Calculations
    const currentYear = new Date().getFullYear();
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const yearlyIncome = donations.filter(d => {
        const date = new Date(d.donation_date);
        return date >= yearStart && date <= yearEnd;
    }).reduce((sum, d) => sum + (d.amount || 0), 0);

    const monthlyIncome = donations.filter(d => {
        const date = new Date(d.donation_date);
        return date >= monthStart && date <= monthEnd;
    }).reduce((sum, d) => sum + (d.amount || 0), 0);

    const yearlyExpenses = expenses.filter(e => {
        const date = new Date(e.expense_date);
        return date >= yearStart && date <= yearEnd;
    }).reduce((sum, e) => sum + (e.amount || 0), 0);

    const monthlyExpenses = expenses.filter(e => {
        const date = new Date(e.expense_date);
        return date >= monthStart && date <= monthEnd;
    }).reduce((sum, e) => sum + (e.amount || 0), 0);

    const netIncome = yearlyIncome - yearlyExpenses;
    const totalBudget = budgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0);

    // Expense by Category
    const expensesByCategory = {};
    expenses.forEach(e => {
        const cat = e.category || 'other';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.amount || 0);
    });
    const categoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
        name: category.replace('_', ' '),
        value: amount
    })).sort((a, b) => b.value - a.value);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    return (
        <FeatureGate 
            feature="financial_management_enabled"
            featureName="Financial Management"
            requiredPlan="Growth"
        >
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Financial Management</h1>
                            <p className="text-slate-600 mt-1">Track income, expenses, and budgets</p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => {
                                    // Trigger export modal
                                    const event = new CustomEvent('openExportModal', { detail: { reportType: 'financial' } });
                                    window.dispatchEvent(event);
                                }} 
                                variant="outline"
                                className="bg-green-600 text-white hover:bg-green-700"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export Report
                            </Button>
                            <Link to={createPageUrl("QuickExpense")}>
                            <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
                                <Camera className="w-5 h-5 mr-2" />
                                Scan Receipt
                            </Button>
                        </Link>
                        <Button onClick={() => setIsExpenseFormOpen(true)} variant="outline">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Expense
                        </Button>
                            <Button onClick={() => setIsBudgetFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-5 h-5 mr-2" />
                                Manage Budget
                            </Button>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-8 h-8 text-green-600" />
                                    <Badge className="bg-green-100 text-green-800">YTD</Badge>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">Total Income</p>
                                <p className="text-3xl font-bold text-green-600">${yearlyIncome.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-2">This month: ${monthlyIncome.toLocaleString()}</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-orange-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingDown className="w-8 h-8 text-red-600" />
                                    <Badge className="bg-red-100 text-red-800">YTD</Badge>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
                                <p className="text-3xl font-bold text-red-600">${yearlyExpenses.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-2">This month: ${monthlyExpenses.toLocaleString()}</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <DollarSign className="w-8 h-8 text-blue-600" />
                                    <Badge className={netIncome >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                        {netIncome >= 0 ? 'Surplus' : 'Deficit'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">Net Income</p>
                                <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    ${Math.abs(netIncome).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <PieChart className="w-8 h-8 text-purple-600" />
                                    <Badge className="bg-purple-100 text-purple-800">Budget</Badge>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">Budget Utilization</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
                                </p>
                                <p className="text-xs text-slate-500 mt-2">${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="expenses" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="expenses">Expenses</TabsTrigger>
                            <TabsTrigger value="budgets">Budgets</TabsTrigger>
                            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="expenses">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Expense Tracking</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Vendor</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {expenses.slice(0, 20).map(expense => (
                                                    <TableRow key={expense.id}>
                                                        <TableCell>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">
                                                                {expense.category?.replace('_', ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{expense.description}</TableCell>
                                                        <TableCell>{expense.vendor_name || 'N/A'}</TableCell>
                                                        <TableCell className="font-semibold">${expense.amount?.toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Badge className={
                                                                expense.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                expense.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }>
                                                                {expense.approval_status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                {expense.is_recurring && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        <Repeat className="w-3 h-3 mr-1" />
                                                                        {expense.recurring_frequency}
                                                                    </Badge>
                                                                )}
                                                                {expense.ai_extracted && (
                                                                    <Badge className="bg-purple-100 text-purple-800 text-xs">AI</Badge>
                                                                )}
                                                                {expense.submitted_via === 'receipt_scan' && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        <Smartphone className="w-3 h-3" />
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedExpense(expense);
                                                                    setIsExpenseFormOpen(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="budgets">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Budget Overview - {currentYear}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {budgets.map(budget => {
                                            const percentage = budget.percentage_used || 0;
                                            const isOverBudget = percentage > 100;
                                            const isApproachingLimit = percentage > 85 && percentage <= 100;

                                            return (
                                                <div key={budget.id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900">{budget.category}</h3>
                                                            {budget.ministry_area && (
                                                                <p className="text-sm text-slate-500">{budget.ministry_area}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isOverBudget && (
                                                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                                            )}
                                                            {!isOverBudget && !isApproachingLimit && (
                                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                            )}
                                                            <Badge className={
                                                                isOverBudget ? 'bg-red-100 text-red-800' :
                                                                isApproachingLimit ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }>
                                                                {percentage.toFixed(1)}% Used
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm text-slate-600">
                                                            <span>Allocated: ${budget.allocated_amount?.toLocaleString()}</span>
                                                            <span>Spent: ${(budget.spent_amount || 0).toLocaleString()}</span>
                                                            <span className={percentage > 100 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                                                Remaining: ${(budget.remaining_amount || 0).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all ${
                                                                    isOverBudget ? 'bg-red-600' :
                                                                    isApproachingLimit ? 'bg-yellow-500' :
                                                                    'bg-green-500'
                                                                }`}
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedBudget(budget);
                                                                setIsBudgetFormOpen(true);
                                                            }}
                                                        >
                                                            Edit Budget
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="reports">
                            <div className="grid lg:grid-cols-2 gap-6">
                                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle>Expenses by Category</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPie>
                                                    <Pie
                                                        data={categoryData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={100}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {categoryData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                                    <Legend />
                                                </RechartsPie>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle>Income vs Expenses</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm font-medium">Total Income</span>
                                                    <span className="text-sm font-bold text-green-600">${yearlyIncome.toLocaleString()}</span>
                                                </div>
                                                <div className="h-3 bg-green-100 rounded-full">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm font-medium">Total Expenses</span>
                                                    <span className="text-sm font-bold text-red-600">${yearlyExpenses.toLocaleString()}</span>
                                                </div>
                                                <div className
                                                    className="h-3 bg-red-100 rounded-full" 
                                                    style={{ width: `${yearlyIncome > 0 ? (yearlyExpenses / yearlyIncome * 100) : 0}%` }} 
                                                />
                                            </div>

                                            <div className="pt-4 border-t">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold">Net Position</span>
                                                    <span className={`font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {netIncome >= 0 ? '+' : '-'}${Math.abs(netIncome).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {netIncome >= 0 
                                                        ? 'Your church is operating with a surplus' 
                                                        : 'Your church is operating at a deficit'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {isExpenseFormOpen && (
                        <ExpenseForm
                            isOpen={isExpenseFormOpen}
                            setIsOpen={setIsExpenseFormOpen}
                            onSubmit={handleExpenseSubmit}
                            expense={selectedExpense}
                        />
                    )}

                    {isBudgetFormOpen && (
                        <BudgetForm
                            isOpen={isBudgetFormOpen}
                            setIsOpen={setIsBudgetFormOpen}
                            onSubmit={handleBudgetSubmit}
                            budget={selectedBudget}
                            currentYear={currentYear}
                        />
                    )}
                </div>
            </div>
        </FeatureGate>
    );
}