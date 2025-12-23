import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Repeat,
  FileText,
  Download,
  Loader2
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
  ResponsiveContainer,
  Legend
} from "recharts";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";

export default function DonationAnalytics() {
  const [donations, setDonations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("12months");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [donationsData, subscriptionsData] = await Promise.all([
        base44.entities.Donation.list('-donation_date', 1000),
        base44.entities.Subscription.list()
      ]);

      setDonations(donationsData);
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
    setIsLoading(false);
  };

  // Calculate key metrics
  const metrics = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = startOfMonth(now);
    
    // Total donations
    const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    // This month's donations
    const thisMonthDonations = donations
      .filter(d => new Date(d.donation_date) >= currentMonth)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    
    // This year's donations
    const thisYearDonations = donations
      .filter(d => new Date(d.donation_date).getFullYear() === currentYear)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    
    // Recurring donors count
    const recurringDonors = donations.filter(d => d.recurring).length;
    
    // Active subscriptions
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    
    // Unique donors
    const uniqueDonors = new Set(donations.map(d => d.donor_email)).size;
    
    // Average donation
    const avgDonation = donations.length > 0 ? totalDonations / donations.length : 0;
    
    // Tax deductible total for selected year
    const taxDeductible = donations
      .filter(d => {
        const year = new Date(d.donation_date).getFullYear();
        return year === selectedYear && d.tax_deductible;
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    return {
      totalDonations,
      thisMonthDonations,
      thisYearDonations,
      recurringDonors,
      activeSubscriptions,
      uniqueDonors,
      avgDonation,
      taxDeductible
    };
  }, [donations, subscriptions, selectedYear]);

  // Donations over time (monthly)
  const donationsTrendData = React.useMemo(() => {
    const months = timeRange === "12months" ? 12 : 6;
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthDonations = donations.filter(d => {
        const donationDate = new Date(d.donation_date);
        return donationDate >= monthStart && donationDate <= monthEnd;
      });
      
      const total = monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const oneTime = monthDonations.filter(d => !d.recurring).reduce((sum, d) => sum + (d.amount || 0), 0);
      const recurring = monthDonations.filter(d => d.recurring).reduce((sum, d) => sum + (d.amount || 0), 0);
      
      data.push({
        month: format(monthDate, 'MMM yyyy'),
        total: Math.round(total),
        oneTime: Math.round(oneTime),
        recurring: Math.round(recurring)
      });
    }
    
    return data;
  }, [donations, timeRange]);

  // Donation type breakdown
  const donationTypeData = React.useMemo(() => {
    const typeMap = {};
    
    donations.forEach(d => {
      const type = d.donation_type || 'other';
      if (!typeMap[type]) {
        typeMap[type] = { name: type.replace(/_/g, ' '), value: 0, count: 0 };
      }
      typeMap[type].value += d.amount || 0;
      typeMap[type].count += 1;
    });
    
    return Object.values(typeMap)
      .sort((a, b) => b.value - a.value)
      .map(item => ({
        ...item,
        value: Math.round(item.value)
      }));
  }, [donations]);

  // Payment method breakdown
  const paymentMethodData = React.useMemo(() => {
    const methodMap = {};
    
    donations.forEach(d => {
      const method = d.payment_method || 'unknown';
      if (!methodMap[method]) {
        methodMap[method] = { name: method.replace(/_/g, ' '), value: 0 };
      }
      methodMap[method].value += 1;
    });
    
    return Object.values(methodMap);
  }, [donations]);

  // Subscription status breakdown
  const subscriptionStatusData = React.useMemo(() => {
    const statusMap = {
      active: 0,
      cancelled: 0,
      past_due: 0,
      trial: 0
    };
    
    subscriptions.forEach(s => {
      if (statusMap.hasOwnProperty(s.status)) {
        statusMap[s.status] += 1;
      }
    });
    
    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value
    }));
  }, [subscriptions]);

  // Tax deductible donations by year
  const taxYears = React.useMemo(() => {
    const years = new Set(donations.map(d => new Date(d.donation_date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [donations]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const exportReport = async () => {
    try {
      const response = await base44.functions.invoke('exportFinancialReportPDF', {
        donations: donations,
        metrics: metrics,
        donationsTrend: donationsTrendData,
        typeBreakdown: donationTypeData
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donation-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export report");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Donation & Subscription Analytics</h1>
          <p className="text-slate-600 mt-1">Comprehensive insights into your giving and subscription data</p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">Total Donations</p>
            <p className="text-3xl font-bold text-slate-900">${metrics.totalDonations.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">This Month</p>
            <p className="text-3xl font-bold text-slate-900">${metrics.thisMonthDonations.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">Unique Donors</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.uniqueDonors}</p>
            <p className="text-xs text-slate-500 mt-1">{metrics.recurringDonors} recurring</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                <Repeat className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">Active Subscriptions</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.activeSubscriptions}</p>
            <p className="text-xs text-slate-500 mt-1">Platform subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="tax">Tax Reports</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Donation Trends</CardTitle>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={donationsTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Total"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="oneTime" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="One-Time"
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recurring" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Recurring"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Additional Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600">Average Donation</p>
                    <p className="text-2xl font-bold text-slate-900">${metrics.avgDonation.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600">This Year Total</p>
                    <p className="text-2xl font-bold text-slate-900">${metrics.thisYearDonations.toLocaleString()}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-900">{donations.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
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

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Donations by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={donationTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#64748b"
                        fontSize={12}
                        tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Total']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {donationTypeData.map((type, idx) => (
                    <div 
                      key={type.name}
                      className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg border border-slate-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 capitalize">{type.name}</p>
                          <p className="text-xs text-slate-500">{type.count} donations</p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">${type.value.toLocaleString()}</p>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                          style={{ 
                            width: `${(type.value / donationTypeData[0].value) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : null
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {subscriptionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionStatusData.map((status, idx) => (
                  <div key={status.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {status.name === 'active' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {status.name === 'cancelled' && <XCircle className="w-5 h-5 text-red-600" />}
                      {status.name === 'past due' && <CreditCard className="w-5 h-5 text-orange-600" />}
                      {status.name === 'trial' && <Calendar className="w-5 h-5 text-blue-600" />}
                      <div>
                        <p className="font-semibold text-slate-900 capitalize">{status.name}</p>
                        <p className="text-xs text-slate-500">Platform subscriptions</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{status.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscriptions.slice(0, 10).map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{sub.church_name || sub.church_admin_email}</p>
                      <p className="text-sm text-slate-600 capitalize">{sub.subscription_tier} plan</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' :
                        sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        sub.status === 'past_due' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Reports Tab */}
        <TabsContent value="tax" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tax-Deductible Donations</CardTitle>
              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taxYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border-2 border-green-200 mb-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 mb-2">Total Tax-Deductible for {selectedYear}</p>
                  <p className="text-5xl font-bold text-green-600">${metrics.taxDeductible.toLocaleString()}</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {donations.filter(d => 
                      new Date(d.donation_date).getFullYear() === selectedYear && d.tax_deductible
                    ).length} donations
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {taxYears.map(year => {
                  const yearTotal = donations
                    .filter(d => new Date(d.donation_date).getFullYear() === year && d.tax_deductible)
                    .reduce((sum, d) => sum + (d.amount || 0), 0);
                  
                  const yearCount = donations.filter(d => 
                    new Date(d.donation_date).getFullYear() === year && d.tax_deductible
                  ).length;

                  return (
                    <div key={year} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{year}</p>
                          <p className="text-xs text-slate-500">{yearCount} donations</p>
                        </div>
                        <p className="text-xl font-bold text-slate-900">${yearTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}