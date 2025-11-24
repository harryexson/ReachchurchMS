import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock } from "lucide-react";
import { format } from "date-fns";

const donationTypeColors = {
  tithe: "bg-blue-100 text-blue-800",
  offering: "bg-green-100 text-green-800",
  building_fund: "bg-purple-100 text-purple-800",
  missions: "bg-orange-100 text-orange-800",
  special_event: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800"
};

export default function RecentActivity({ donations, isLoading }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Heart className="w-5 h-5 text-green-600" />
          Recent Donations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : donations.length > 0 ? (
          donations.map((donation, index) => (
            <div key={donation.id || index} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{donation.donor_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={donationTypeColors[donation.donation_type] || donationTypeColors.other}>
                      {donation.donation_type?.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(donation.donation_date), 'MMM d')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">${donation.amount?.toFixed(2)}</p>
                <p className="text-xs text-slate-500">{donation.payment_method}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No recent donations</p>
            <p className="text-sm">Donations will appear here once received</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}