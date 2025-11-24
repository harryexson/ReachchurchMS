import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

export default function DashboardStats({ title, value, icon: Icon, bgColor, trend, isLoading }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-gradient-to-br ${bgColor} rounded-full opacity-10 group-hover:opacity-15 transition-opacity duration-300`} />
      <CardContent className="p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{value}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${bgColor} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        {trend && !isLoading && (
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
            <span className="text-slate-600">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}