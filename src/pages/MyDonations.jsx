import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    Heart, Download, Calendar, DollarSign, FileText, 
    Loader2, TrendingUp, CreditCard, Building2, RefreshCw,
    Edit, Save, X, Check
} from 'lucide-react';
import { format } from 'date-fns';

export default function MyDonations() {
    const [currentUser, setCurrentUser] = useState(null);
    const [donations, setDonations] = useState([]);
    const [recurringDonations, setRecurringDonations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [stats, setStats] = useState({
        totalGiven: 0,
        donationCount: 0,
        recurringCount: 0,
        avgDonation: 0
    });
    const [editingRecurring, setEditingRecurring] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editFrequency, setEditFrequency] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPaymentUpdate, setShowPaymentUpdate] = useState(null);

    useEffect(() => {
        loadData();
    }, [yearFilter]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Load all donations
            const allDonations = await base44.entities.Donation.filter({
                donor_email: user.email
            });

            // Filter by year
            const yearDonations = allDonations.filter(d => {
                const donationYear = new Date(d.donation_date).getFullYear();
                return donationYear === yearFilter;
            });

            setDonations(yearDonations.sort((a, b) => 
                new Date(b.donation_date) - new Date(a.donation_date)
            ));

            // Get recurring donations
            const recurring = allDonations.filter(d => 
                d.recurring && d.subscription_status === 'active'
            );
            
            // Deduplicate by subscription_id
            const uniqueRecurring = {};
            recurring.forEach(d => {
                if (d.stripe_subscription_id && !uniqueRecurring[d.stripe_subscription_id]) {
                    uniqueRecurring[d.stripe_subscription_id] = d;
                }
            });
            setRecurringDonations(Object.values(uniqueRecurring));

            // Calculate stats
            const totalGiven = yearDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
            setStats({
                totalGiven: totalGiven,
                donationCount: yearDonations.length,
                recurringCount: recurring.length,
                avgDonation: yearDonations.length > 0 ? totalGiven / yearDonations.length : 0
            });

        } catch (error) {
            console.error('Error loading donations:', error);
        }
        setIsLoading(false);
    };

    const handleDownloadReceipt = async (donation) => {
        try {
            const response = await base44.functions.invoke('generateReceiptPDF', {
                donation_id: donation.id
            });

            if (response.data?.pdf_url) {
                window.open(response.data.pdf_url, '_blank');
            }
        } catch (error) {
            console.error('Error downloading receipt:', error);
            alert('Failed to download receipt');
        }
    };

    const handleDownloadYearEndStatement = async () => {
        try {
            const response = await base44.functions.invoke('generateYearEndStatement', {
                year: yearFilter,
                donor_email: currentUser.email
            });

            if (response.data?.pdf_url) {
                window.open(response.data.pdf_url, '_blank');
            }
        } catch (error) {
            console.error('Error generating statement:', error);
            alert('Failed to generate year-end statement');
        }
    };

    const handleEditRecurring = (donation) => {
        setEditingRecurring(donation.id);
        setEditAmount(donation.amount.toString());
        setEditFrequency(donation.recurring_frequency);
    };

    const handleSaveRecurringChanges = async (donation) => {
        if (!editAmount || parseFloat(editAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setIsUpdating(true);
        try {
            await base44.functions.invoke('manageRecurringDonation', {
                subscription_id: donation.stripe_subscription_id,
                action: 'update',
                new_amount: parseFloat(editAmount),
                new_frequency: editFrequency
            });

            alert('Recurring donation updated successfully!');
            setEditingRecurring(null);
            loadData();
        } catch (error) {
            console.error('Error updating recurring donation:', error);
            alert('Failed to update recurring donation');
        }
        setIsUpdating(false);
    };

    const handleCancelEdit = () => {
        setEditingRecurring(null);
        setEditAmount('');
        setEditFrequency('');
    };

    const handlePauseResume = async (donation) => {
        const action = donation.subscription_status === 'active' ? 'pause' : 'resume';
        const confirmMsg = action === 'pause' 
            ? 'Pause this recurring donation?' 
            : 'Resume this recurring donation?';

        if (!confirm(confirmMsg)) return;

        setIsUpdating(true);
        try {
            await base44.functions.invoke('manageRecurringDonation', {
                subscription_id: donation.stripe_subscription_id,
                action: action
            });

            alert(`Recurring donation ${action}d successfully!`);
            loadData();
        } catch (error) {
            console.error(`Error ${action}ing recurring donation:`, error);
            alert(`Failed to ${action} recurring donation`);
        }
        setIsUpdating(false);
    };

    const handleCancelRecurring = async (donation) => {
        if (!confirm('Cancel this recurring donation? This cannot be undone.')) return;

        setIsUpdating(true);
        try {
            await base44.functions.invoke('manageRecurringDonation', {
                subscription_id: donation.stripe_subscription_id,
                action: 'cancel'
            });

            alert('Recurring donation cancelled successfully.');
            loadData();
        } catch (error) {
            console.error('Error cancelling recurring donation:', error);
            alert('Failed to cancel recurring donation');
        }
        setIsUpdating(false);
    };

    const handleUpdatePaymentMethod = async (donation) => {
        setIsUpdating(true);
        try {
            const response = await base44.functions.invoke('createPaymentUpdateSession', {
                subscription_id: donation.stripe_subscription_id
            });

            if (response.data?.portal_url) {
                window.location.href = response.data.portal_url;
            }
        } catch (error) {
            console.error('Error updating payment method:', error);
            alert('Failed to open payment update portal');
        }
        setIsUpdating(false);
    };

    const availableYears = Array.from(
        new Set(donations.map(d => new Date(d.donation_date).getFullYear()))
    ).sort((a, b) => b - a);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Heart className="w-8 h-8 text-red-500" />
                        <h1 className="text-3xl font-bold text-slate-900">My Donations</h1>
                    </div>
                    <Button
                        onClick={handleDownloadYearEndStatement}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {yearFilter} Statement
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Given ({yearFilter})</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        ${stats.totalGiven.toFixed(2)}
                                    </p>
                                </div>
                                <DollarSign className="w-10 h-10 text-green-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Donations</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.donationCount}</p>
                                </div>
                                <FileText className="w-10 h-10 text-blue-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active Recurring</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.recurringCount}</p>
                                </div>
                                <RefreshCw className="w-10 h-10 text-purple-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-amber-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Avg. Donation</p>
                                    <p className="text-3xl font-bold text-orange-600">
                                        ${stats.avgDonation.toFixed(2)}
                                    </p>
                                </div>
                                <TrendingUp className="w-10 h-10 text-orange-600 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recurring Donations Management */}
                {recurringDonations.length > 0 && (
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="w-5 h-5" />
                                Manage Recurring Donations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {recurringDonations.map(donation => (
                                <div key={donation.id} className="p-4 bg-slate-50 rounded-lg border">
                                    {editingRecurring === donation.id ? (
                                        <div className="space-y-4">
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Amount</Label>
                                                    <Input
                                                        type="number"
                                                        value={editAmount}
                                                        onChange={(e) => setEditAmount(e.target.value)}
                                                        min="1"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Frequency</Label>
                                                    <Select value={editFrequency} onValueChange={setEditFrequency}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="weekly">Weekly</SelectItem>
                                                            <SelectItem value="monthly">Monthly</SelectItem>
                                                            <SelectItem value="annually">Annually</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleSaveRecurringChanges(donation)}
                                                    disabled={isUpdating}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save Changes
                                                </Button>
                                                <Button
                                                    onClick={handleCancelEdit}
                                                    variant="outline"
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="text-2xl font-bold text-slate-900">
                                                        ${donation.amount.toFixed(2)} / {donation.recurring_frequency}
                                                    </p>
                                                    <p className="text-sm text-slate-600 capitalize">
                                                        {donation.donation_type.replace(/_/g, ' ')}
                                                    </p>
                                                </div>
                                                <Badge className={
                                                    donation.subscription_status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }>
                                                    {donation.subscription_status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    onClick={() => handleEditRecurring(donation)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit Amount/Frequency
                                                </Button>
                                                <Button
                                                    onClick={() => handleUpdatePaymentMethod(donation)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    Update Payment Method
                                                </Button>
                                                <Button
                                                    onClick={() => handlePauseResume(donation)}
                                                    size="sm"
                                                    variant="outline"
                                                    className={donation.subscription_status === 'active' 
                                                        ? 'text-orange-600' 
                                                        : 'text-green-600'
                                                    }
                                                >
                                                    {donation.subscription_status === 'active' ? 'Pause' : 'Resume'}
                                                </Button>
                                                <Button
                                                    onClick={() => handleCancelRecurring(donation)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Donation History */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Donation History</CardTitle>
                            <Select value={yearFilter.toString()} onValueChange={(val) => setYearFilter(parseInt(val))}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {donations.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">
                                    No donations found for {yearFilter}
                                </p>
                            ) : (
                                donations.map(donation => (
                                    <div key={donation.id} className="p-4 bg-slate-50 rounded-lg border hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <p className="text-2xl font-bold text-green-600">
                                                        ${donation.amount.toFixed(2)} {donation.currency || 'USD'}
                                                    </p>
                                                    {donation.recurring && (
                                                        <Badge className="bg-purple-100 text-purple-800">
                                                            <RefreshCw className="w-3 h-3 mr-1" />
                                                            Recurring
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-600 space-y-1">
                                                    <p className="capitalize">
                                                        <strong>Type:</strong> {donation.donation_type.replace(/_/g, ' ')}
                                                    </p>
                                                    <p>
                                                        <Calendar className="w-4 h-4 inline mr-1" />
                                                        {format(new Date(donation.donation_date), 'MMM d, yyyy')}
                                                    </p>
                                                    {donation.payment_method && (
                                                        <p className="flex items-center gap-1">
                                                            {donation.payment_method === 'credit_card' ? (
                                                                <CreditCard className="w-4 h-4" />
                                                            ) : (
                                                                <Building2 className="w-4 h-4" />
                                                            )}
                                                            {donation.payment_method.replace(/_/g, ' ')}
                                                        </p>
                                                    )}
                                                    {donation.receipt_number && (
                                                        <p className="text-xs text-slate-500">
                                                            Receipt: {donation.receipt_number}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleDownloadReceipt(donation)}
                                                size="sm"
                                                variant="outline"
                                                className="flex-shrink-0"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Receipt
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}