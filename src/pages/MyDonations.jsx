import React, { useState, useEffect } from "react";
import { Donation } from "@/entities/Donation";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, DollarSign, Download, TrendingUp, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function MyDonationsPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [myDonations, setMyDonations] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMyDonations();
    }, [selectedYear]);

    const loadMyDonations = async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            // Load donations for current user's email
            const allDonations = await Donation.filter({ 
                donor_email: user.donor_email || user.email 
            });
            
            setMyDonations(allDonations.sort((a, b) => 
                new Date(b.donation_date) - new Date(a.donation_date)
            ));
        } catch (error) {
            console.error("Failed to load donations:", error);
        }
        setIsLoading(false);
    };

    const yearDonations = myDonations.filter(d => {
        const donationYear = new Date(d.donation_date).getFullYear();
        return donationYear === selectedYear;
    });

    const yearTotal = yearDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const taxDeductibleTotal = yearDonations
        .filter(d => d.tax_deductible)
        .reduce((sum, d) => sum + (d.amount || 0), 0);

    const yearOptions = [];
    for (let year = new Date().getFullYear(); year >= 2020; year--) {
        yearOptions.push(year);
    }

    const donationTypeColors = {
        tithe: "bg-blue-100 text-blue-800",
        offering: "bg-green-100 text-green-800",
        building_fund: "bg-purple-100 text-purple-800",
        missions: "bg-orange-100 text-orange-800",
        special_event: "bg-pink-100 text-pink-800",
        other: "bg-gray-100 text-gray-800"
    };

    const handleDownloadReceipt = async (donation) => {
        try {
            await base44.functions.invoke('sendDonationReceipt', {
                donation_id: donation.id,
                donation_data: donation
            });
            alert('Receipt sent to your email!');
        } catch (error) {
            console.error('Failed to send receipt:', error);
            alert('Failed to send receipt. Please try again.');
        }
    };

    const exportToPDF = async () => {
        alert("Year-end tax statement will be sent via email by January 31st.\n\nFor individual receipts, use the 'Receipt' button next to each donation.");
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-green-50/30 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Giving History</h1>
                        <p className="text-slate-600 mt-1">Track your contributions and get tax statements</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="border border-slate-300 rounded-md px-3 py-2"
                        >
                            {yearOptions.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <Button onClick={exportToPDF} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Given ({selectedYear})</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${yearTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <Heart className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Tax Deductible</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ${taxDeductibleTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1"># of Donations</p>
                                    <p className="text-2xl font-bold text-purple-600">{yearDonations.length}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Donations Table */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Donation History - {selectedYear}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead>Tax Deductible</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                                </TableRow>
                                                ))
                                    ) : yearDonations.length > 0 ? (
                                        yearDonations.map(donation => (
                                            <TableRow key={donation.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {format(new Date(donation.donation_date), 'MMM d, yyyy')}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold text-green-600">
                                                    ${donation.amount?.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={donationTypeColors[donation.donation_type] || donationTypeColors.other}>
                                                        {donation.donation_type?.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="capitalize">{donation.payment_method}</TableCell>
                                                <TableCell>
                                                    {donation.tax_deductible ? (
                                                        <span className="text-green-600 font-medium">✓ Yes</span>
                                                    ) : (
                                                        <span className="text-slate-400">No</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownloadReceipt(donation)}
                                                        className="text-xs"
                                                    >
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        Receipt
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p className="text-slate-500">No donations recorded for {selectedYear}</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Tax Info Card */}
                <Card className="shadow-lg border-0 bg-blue-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-blue-900 mb-3">📋 Tax Statement Information</h3>
                        <div className="space-y-2 text-sm text-blue-800">
                            <p>• Official tax statements are generated annually in January</p>
                            <p>• You'll receive your {selectedYear} statement via email by January 31, {selectedYear + 1}</p>
                            <p>• Keep this giving history for your records</p>
                            <p>• Questions? Contact the church finance office</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}