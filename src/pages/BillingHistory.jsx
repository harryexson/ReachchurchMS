import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Search, DollarSign, Receipt, Tag, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function BillingHistory() {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [accountActions, setAccountActions] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadBillingData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, statusFilter, startDate, endDate, subscriptions, invoices, accountActions]);

    const loadBillingData = async () => {
        try {
            setLoading(true);
            
            // Load all subscriptions
            const subs = await base44.asServiceRole.entities.Subscription.list();
            setSubscriptions(subs);

            // Load invoices
            const invs = await base44.asServiceRole.entities.Invoice.list('-created_date');
            setInvoices(invs);

            // Load account actions (for discount tracking)
            const actions = await base44.asServiceRole.entities.AccountAction.filter({
                action_type: { $in: ['discount_applied', 'discount_scheduled', 'payment_received', 'refund_issued'] }
            });
            setAccountActions(actions);

        } catch (error) {
            console.error('Error loading billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        // Combine all billing records
        let combined = [];

        // Add invoices
        invoices.forEach(invoice => {
            const sub = subscriptions.find(s => s.stripe_customer_id === invoice.customer_id || s.church_admin_email === invoice.customer_email);
            combined.push({
                type: 'invoice',
                id: invoice.id,
                date: invoice.created_date,
                church_name: sub?.church_name || invoice.customer_email,
                church_email: sub?.church_admin_email || invoice.customer_email,
                amount: invoice.amount_due,
                status: invoice.status,
                subscription_status: sub?.status || 'unknown',
                description: `Invoice #${invoice.invoice_number || 'N/A'}`,
                details: invoice
            });
        });

        // Add account actions
        accountActions.forEach(action => {
            const sub = subscriptions.find(s => s.id === action.subscription_id);
            combined.push({
                type: action.action_type,
                id: action.id,
                date: action.action_date || action.created_date,
                church_name: action.church_name || sub?.church_name || 'N/A',
                church_email: sub?.church_admin_email || 'N/A',
                amount: null,
                status: 'completed',
                subscription_status: sub?.status || 'unknown',
                description: action.notes,
                details: action
            });
        });

        // Apply filters
        let filtered = combined;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.church_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.church_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => item.subscription_status === statusFilter);
        }

        // Date range filter
        if (startDate) {
            filtered = filtered.filter(item => new Date(item.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(item => new Date(item.date) <= new Date(endDate));
        }

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        setFilteredData(filtered);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'invoice':
                return <Receipt className="w-4 h-4" />;
            case 'payment_received':
                return <DollarSign className="w-4 h-4" />;
            case 'discount_applied':
            case 'discount_scheduled':
                return <Tag className="w-4 h-4" />;
            default:
                return <Calendar className="w-4 h-4" />;
        }
    };

    const getTypeBadge = (type) => {
        const variants = {
            invoice: 'default',
            payment_received: 'default',
            discount_applied: 'secondary',
            discount_scheduled: 'outline',
            refund_issued: 'destructive'
        };
        return variants[type] || 'default';
    };

    const getStatusBadge = (status) => {
        const variants = {
            active: 'default',
            trial: 'secondary',
            past_due: 'destructive',
            cancelled: 'outline',
            paid: 'default',
            open: 'secondary',
            void: 'outline'
        };
        const colors = {
            active: 'bg-green-100 text-green-800',
            trial: 'bg-blue-100 text-blue-800',
            past_due: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
            paid: 'bg-green-100 text-green-800',
            open: 'bg-yellow-100 text-yellow-800',
            void: 'bg-gray-100 text-gray-800'
        };
        return { variant: variants[status] || 'default', className: colors[status] || '' };
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Church Name', 'Email', 'Type', 'Description', 'Amount', 'Status'];
        const rows = filteredData.map(item => [
            format(new Date(item.date), 'yyyy-MM-dd HH:mm'),
            item.church_name,
            item.church_email,
            item.type,
            item.description,
            item.amount ? `$${item.amount.toFixed(2)}` : 'N/A',
            item.status
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Billing History</h1>
                    <p className="text-gray-600 mt-1">Complete record of invoices, payments, and discounts</p>
                </div>
                <Button onClick={exportToCSV} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Church name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Subscription Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="past_due">Past Due</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setStartDate('');
                                setEndDate('');
                            }}
                        >
                            Clear Filters
                        </Button>
                        <div className="text-sm text-gray-600 flex items-center">
                            Showing {filteredData.length} records
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Church</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Record Status</TableHead>
                                    <TableHead>Subscription Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            No billing records found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((item) => (
                                        <TableRow key={`${item.type}-${item.id}`}>
                                            <TableCell className="font-medium">
                                                {format(new Date(item.date), 'MMM dd, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{item.church_name}</div>
                                                    <div className="text-xs text-gray-500">{item.church_email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getTypeBadge(item.type)} className="flex items-center gap-1 w-fit">
                                                    {getTypeIcon(item.type)}
                                                    {item.type.replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="truncate" title={item.description}>
                                                    {item.description}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {item.amount !== null ? (
                                                    <span className="font-semibold text-green-600">
                                                        ${item.amount.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={getStatusBadge(item.status).variant}
                                                    className={getStatusBadge(item.status).className}
                                                >
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={getStatusBadge(item.subscription_status).variant}
                                                    className={getStatusBadge(item.subscription_status).className}
                                                >
                                                    {item.subscription_status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}