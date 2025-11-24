import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Pause, Play, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function SubscriptionDashboard({ subscriptions, isLoading, onRefresh }) {
    const statusColors = {
        active: "bg-green-100 text-green-800",
        trial: "bg-blue-100 text-blue-800",
        past_due: "bg-yellow-100 text-yellow-800",
        suspended: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-800"
    };

    const tierColors = {
        basic: "bg-slate-100 text-slate-800",
        standard: "bg-blue-100 text-blue-800",
        premium: "bg-purple-100 text-purple-800"
    };

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Subscription Management</span>
                    <Button onClick={onRefresh} variant="outline" size="sm">
                        Refresh Data
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Church</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Next Billing</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                subscriptions.map(subscription => (
                                    <TableRow key={subscription.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-semibold">{subscription.church_name}</div>
                                                <div className="text-sm text-slate-500">{subscription.church_admin_email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={tierColors[subscription.subscription_tier]}>
                                                {subscription.subscription_tier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[subscription.status]}>
                                                {subscription.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            ${subscription.monthly_price}
                                        </TableCell>
                                        <TableCell>
                                            {subscription.next_billing_date ? 
                                                format(new Date(subscription.next_billing_date), 'MMM d, yyyy') : 'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline">
                                                    <CreditCard className="w-3 h-3" />
                                                </Button>
                                                <Button size="sm" variant="outline">
                                                    <Pause className="w-3 h-3" />
                                                </Button>
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
    );
}