import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function SupportDashboard({ supportTickets, isLoading, onRefresh }) {
    const statusColors = {
        open: "bg-red-100 text-red-800",
        in_progress: "bg-yellow-100 text-yellow-800",
        waiting_customer: "bg-blue-100 text-blue-800",
        resolved: "bg-green-100 text-green-800",
        closed: "bg-gray-100 text-gray-800"
    };

    const priorityColors = {
        low: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-orange-100 text-orange-800",
        urgent: "bg-red-100 text-red-800"
    };

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Support & Tickets</span>
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
                                <TableHead>Ticket ID</TableHead>
                                <TableHead>Church</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                supportTickets.slice(0, 10).map(ticket => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-mono text-sm">
                                            {ticket.ticket_id}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-semibold text-sm">{ticket.church_name}</div>
                                                <div className="text-xs text-slate-500">{ticket.contact_name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {ticket.subject}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={priorityColors[ticket.priority]}>
                                                {ticket.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[ticket.status]}>
                                                {ticket.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(ticket.created_date), 'MMM d')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline">
                                                    <MessageSquare className="w-3 h-3" />
                                                </Button>
                                                {ticket.status === 'open' && (
                                                    <Button size="sm" variant="outline">
                                                        <CheckCircle className="w-3 h-3" />
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
    );
}