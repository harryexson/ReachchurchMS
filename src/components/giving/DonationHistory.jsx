import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";

const donationTypeColors = {
  tithe: "bg-blue-100 text-blue-800",
  offering: "bg-green-100 text-green-800",
  building_fund: "bg-purple-100 text-purple-800",
  missions: "bg-orange-100 text-orange-800",
  special_event: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800"
};

export default function DonationHistory({ donations, isLoading, onEdit }) {
    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-green-600" />
                    Donation History
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Donor</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : donations.length > 0 ? (
                                donations.map(donation => (
                                    <TableRow key={donation.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{donation.donor_name}</div>
                                                <div className="text-sm text-slate-500">{donation.donor_email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-green-600">
                                                ${donation.amount?.toFixed(2)}
                                            </span>
                                            {donation.recurring && (
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                    {donation.recurring_frequency}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={donationTypeColors[donation.donation_type] || donationTypeColors.other}>
                                                {donation.donation_type?.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-slate-400" />
                                                <span className="capitalize">{donation.payment_method}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span>{format(new Date(donation.donation_date), 'MMM d, yyyy')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => onEdit(donation)}>
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-500">No donations recorded</p>
                                        <p className="text-sm text-slate-400">Donations will appear here once recorded</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}