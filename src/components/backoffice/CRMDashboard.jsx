import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Phone, Mail, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function CRMDashboard({ interactions, subscriptions, isLoading, onRefresh }) {
    const outcomeColors = {
        positive: "bg-green-100 text-green-800",
        neutral: "bg-yellow-100 text-yellow-800",
        negative: "bg-red-100 text-red-800",
        no_response: "bg-gray-100 text-gray-800"
    };

    const stageColors = {
        lead: "bg-blue-100 text-blue-800",
        prospect: "bg-indigo-100 text-indigo-800",
        demo_scheduled: "bg-purple-100 text-purple-800",
        proposal_sent: "bg-orange-100 text-orange-800",
        negotiation: "bg-amber-100 text-amber-800",
        closed_won: "bg-green-100 text-green-800",
        closed_lost: "bg-red-100 text-red-800"
    };

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Customer Relations</span>
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
                                <TableHead>Contact</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Outcome</TableHead>
                                <TableHead>Sales Stage</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                interactions.slice(0, 10).map(interaction => (
                                    <TableRow key={interaction.id}>
                                        <TableCell className="font-semibold">
                                            {interaction.church_name}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="text-sm font-medium">{interaction.contact_person}</div>
                                                <div className="text-xs text-slate-500">{interaction.contact_email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {interaction.interaction_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {interaction.subject}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={outcomeColors[interaction.outcome]}>
                                                {interaction.outcome.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={stageColors[interaction.sales_stage]}>
                                                {interaction.sales_stage.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(interaction.created_date), 'MMM d')}
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