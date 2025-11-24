import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";

export default function BackOfficeStats({ subscriptions, supportTickets, interactions }) {
    // Calculate business metrics only - no church operational data
    const totalRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.monthly_price || 0), 0);

    const conversionRate = subscriptions.length > 0 
        ? ((subscriptions.filter(s => s.status === 'active').length / subscriptions.length) * 100).toFixed(1)
        : 0;

    const avgTicketResolutionTime = supportTickets.filter(t => t.resolution_date).length > 0
        ? "2.3 hours" // This would be calculated from actual resolution times
        : "N/A";

    const customerSatisfactionScore = "4.8"; // This would come from customer surveys
    const revenueGrowth = "+12.5%"; // This would be calculated from month-over-month data
    const churnRate = "2.3%"; // This would be calculated from cancellations

    const stats = [
        {
            title: "Monthly Recurring Revenue",
            value: `$${totalRevenue.toLocaleString()}`,
            change: revenueGrowth,
            isPositive: true,
            description: "Total MRR from active subscriptions"
        },
        {
            title: "Trial Conversion Rate",
            value: `${conversionRate}%`,
            change: "+3.2%",
            isPositive: true,
            description: "Trial to paid conversion rate"
        },
        {
            title: "Avg Resolution Time",
            value: avgTicketResolutionTime,
            change: "-15min",
            isPositive: true,
            description: "Support ticket resolution time"
        },
        {
            title: "Platform Satisfaction",
            value: `${customerSatisfactionScore}/5`,
            change: "+0.2",
            isPositive: true,
            description: "Average customer platform rating"
        },
        {
            title: "Account Churn Rate",
            value: churnRate,
            change: "-0.5%",
            isPositive: true,
            description: "Monthly subscription churn rate"
        },
        {
            title: "Platform Usage",
            value: `${subscriptions.filter(s => s.status === 'active').length} Active`,
            change: "+8",
            isPositive: true,
            description: "Active platform subscriptions"
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Business Metrics Only</span>
                <span className="text-xs text-slate-500">• Church operational data protected</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                        stat.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {stat.isPositive ? (
                                            <TrendingUp className="w-3 h-3" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3" />
                                        )}
                                        {stat.change}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">{stat.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}