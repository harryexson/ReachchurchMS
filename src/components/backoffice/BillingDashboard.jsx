import React, { useState } from "react";
import { Invoice } from "@/entities/Invoice";
import { Refund } from "@/entities/Refund";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, DollarSign, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import InvoiceForm from "./InvoiceForm";
import RefundForm from "./RefundForm";

export default function BillingDashboard({ invoices, refunds, subscriptions, isLoading, onRefresh }) {
    const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
    const [isRefundFormOpen, setIsRefundFormOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const statusColors = {
        draft: "bg-gray-100 text-gray-800",
        sent: "bg-blue-100 text-blue-800",
        paid: "bg-green-100 text-green-800",
        overdue: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-800",
        refunded: "bg-purple-100 text-purple-800"
    };

    const refundStatusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-blue-100 text-blue-800",
        processing: "bg-indigo-100 text-indigo-800",
        completed: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800"
    };

    const handleMarkAsPaid = async (invoice) => {
        await Invoice.update(invoice.id, {
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0]
        });
        onRefresh();
    };

    const handleProcessRefund = async (refund) => {
        await Refund.update(refund.id, {
            status: 'completed',
            processed_date: new Date().toISOString()
        });
        onRefresh();
    };

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
    const pendingRefunds = refunds.filter(r => r.status === 'pending').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Overdue Invoices</p>
                                <p className="text-2xl font-bold text-slate-900">{overdueInvoices}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Pending Refunds</p>
                                <p className="text-2xl font-bold text-slate-900">{pendingRefunds}</p>
                            </div>
                            <RefreshCw className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Invoices</span>
                        <Button onClick={() => { setSelectedInvoice(null); setIsInvoiceFormOpen(true); }} size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Create Invoice
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Church</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    invoices.slice(0, 20).map(invoice => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                                            <TableCell>{invoice.church_name}</TableCell>
                                            <TableCell className="font-semibold">${invoice.total_amount?.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[invoice.status]}>
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                                        <Button size="sm" onClick={() => handleMarkAsPaid(invoice)}>
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                    {invoice.status === 'paid' && (
                                                        <Button size="sm" variant="outline" onClick={() => { setSelectedInvoice(invoice); setIsRefundFormOpen(true); }}>
                                                            <RefreshCw className="w-3 h-3 mr-1" />
                                                            Refund
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Refunds Table */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Refund Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Refund #</TableHead>
                                    <TableHead>Church</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    refunds.map(refund => (
                                        <TableRow key={refund.id}>
                                            <TableCell className="font-mono text-sm">{refund.refund_number}</TableCell>
                                            <TableCell>{refund.church_name}</TableCell>
                                            <TableCell className="font-semibold">${refund.refund_amount?.toLocaleString()}</TableCell>
                                            <TableCell className="capitalize">{refund.refund_reason?.replace('_', ' ')}</TableCell>
                                            <TableCell>
                                                <Badge className={refundStatusColors[refund.status]}>
                                                    {refund.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {refund.status === 'pending' && (
                                                    <Button size="sm" onClick={() => handleProcessRefund(refund)}>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Process
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {isInvoiceFormOpen && (
                <InvoiceForm
                    isOpen={isInvoiceFormOpen}
                    setIsOpen={setIsInvoiceFormOpen}
                    invoice={selectedInvoice}
                    subscriptions={subscriptions}
                    onSave={onRefresh}
                />
            )}

            {isRefundFormOpen && (
                <RefundForm
                    isOpen={isRefundFormOpen}
                    setIsOpen={setIsRefundFormOpen}
                    invoice={selectedInvoice}
                    onSave={onRefresh}
                />
            )}
        </div>
    );
}