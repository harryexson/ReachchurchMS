import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    BarChart3, Download, Mail, Loader2, FileText, 
    TrendingUp, DollarSign, Users, Calendar, Filter
} from "lucide-react";
import DonationFilters from "../components/reports/DonationFilters";
import FinancialCharts from "../components/reports/FinancialCharts";
import CategorySummary from "../components/reports/CategorySummary";
import DistributionModal from "../components/reports/DistributionModal";

export default function FinancialReportsPage() {
    const [donations, setDonations] = useState([]);
    const [filteredDonations, setFilteredDonations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [showDistribution, setShowDistribution] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        donationTypes: [],
        minAmount: null,
        maxAmount: null,
        memberStatus: 'all',
        recurringOnly: false
    });

    useEffect(() => {
        loadDonations();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [donations, filters]);

    const loadDonations = async () => {
        setIsLoading(true);
        try {
            const allDonations = await base44.entities.Donation.list('-donation_date', 10000);
            setDonations(allDonations);
        } catch (error) {
            console.error("Failed to load donations:", error);
        }
        setIsLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...donations];

        if (filters.dateFrom) {
            filtered = filtered.filter(d => d.donation_date >= filters.dateFrom);
        }

        if (filters.dateTo) {
            filtered = filtered.filter(d => d.donation_date <= filters.dateTo);
        }

        if (filters.donationTypes?.length > 0) {
            filtered = filtered.filter(d => filters.donationTypes.includes(d.donation_type));
        }

        if (filters.minAmount) {
            filtered = filtered.filter(d => d.amount >= filters.minAmount);
        }

        if (filters.maxAmount) {
            filtered = filtered.filter(d => d.amount <= filters.maxAmount);
        }

        if (filters.memberStatus === 'members') {
            filtered = filtered.filter(d => d.member_id);
        } else if (filters.memberStatus === 'non_members') {
            filtered = filtered.filter(d => !d.member_id);
        }

        if (filters.recurringOnly) {
            filtered = filtered.filter(d => d.recurring === true);
        }

        setFilteredDonations(filtered);
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const response = await base44.functions.invoke('exportFinancialReportCSV', {
                donations: filteredDonations,
                filters: filters
            });

            const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        }
        setIsExporting(false);
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const response = await base44.functions.invoke('exportFinancialReportPDF', {
                donations: filteredDonations,
                filters: filters
            });

            const blob = new Blob([new Uint8Array(response.data.pdf_data)], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("PDF export failed:", error);
            alert("PDF export failed. Please try again.");
        }
        setIsExporting(false);
    };

    const stats = {
        totalDonations: filteredDonations.reduce((sum, d) => sum + d.amount, 0),
        donationCount: filteredDonations.length,
        uniqueDonors: new Set(filteredDonations.map(d => d.donor_email)).size,
        averageGift: filteredDonations.length > 0 
            ? filteredDonations.reduce((sum, d) => sum + d.amount, 0) / filteredDonations.length 
            : 0
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                            Financial Reports
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Comprehensive donation analytics and reporting
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setShowDistribution(true)} variant="outline">
                            <Mail className="w-4 h-4 mr-2" />
                            Distribute Report
                        </Button>
                        <Button onClick={handleExportCSV} disabled={isExporting} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button onClick={handleExportPDF} disabled={isExporting} className="bg-red-600 hover:bg-red-700">
                            <FileText className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                <DonationFilters filters={filters} onChange={setFilters} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-3 bg-green-500 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600">Total Donations</p>
                            <p className="text-3xl font-bold text-slate-900">
                                ${stats.totalDonations.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-3 bg-blue-500 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600">Total Gifts</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.donationCount}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-3 bg-purple-500 rounded-xl">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600">Unique Donors</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.uniqueDonors}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-3 bg-orange-500 rounded-xl">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600">Average Gift</p>
                            <p className="text-3xl font-bold text-slate-900">
                                ${stats.averageGift.toFixed(0)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="charts" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="charts">Visual Analytics</TabsTrigger>
                        <TabsTrigger value="categories">Category Summary</TabsTrigger>
                        <TabsTrigger value="details">Detailed Transactions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="charts">
                        <FinancialCharts donations={filteredDonations} />
                    </TabsContent>

                    <TabsContent value="categories">
                        <CategorySummary donations={filteredDonations} />
                    </TabsContent>

                    <TabsContent value="details">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Transaction Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3">Date</th>
                                                <th className="text-left p-3">Donor</th>
                                                <th className="text-left p-3">Type</th>
                                                <th className="text-left p-3">Method</th>
                                                <th className="text-right p-3">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDonations.map((d, idx) => (
                                                <tr key={idx} className="border-b hover:bg-slate-50">
                                                    <td className="p-3">{new Date(d.donation_date).toLocaleDateString()}</td>
                                                    <td className="p-3">{d.donor_name}</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="capitalize">
                                                            {d.donation_type?.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 capitalize">{d.payment_method}</td>
                                                    <td className="p-3 text-right font-semibold text-green-600">
                                                        ${d.amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {showDistribution && (
                    <DistributionModal
                        reportData={filteredDonations}
                        filters={filters}
                        onClose={() => setShowDistribution(false)}
                    />
                )}
            </div>
        </div>
    );
}