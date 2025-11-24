import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign } from "lucide-react";

export default function CategorySummary({ donations }) {
    const categoryStats = React.useMemo(() => {
        const stats = {};
        donations.forEach(d => {
            const type = d.donation_type || 'other';
            if (!stats[type]) {
                stats[type] = {
                    total: 0,
                    count: 0,
                    donors: new Set(),
                    recurringCount: 0
                };
            }
            stats[type].total += d.amount;
            stats[type].count++;
            stats[type].donors.add(d.donor_email);
            if (d.recurring) stats[type].recurringCount++;
        });

        return Object.entries(stats).map(([type, data]) => ({
            type,
            total: data.total,
            count: data.count,
            uniqueDonors: data.donors.size,
            recurringCount: data.recurringCount,
            average: data.count > 0 ? data.total / data.count : 0
        })).sort((a, b) => b.total - a.total);
    }, [donations]);

    const totalAmount = categoryStats.reduce((sum, cat) => sum + cat.total, 0);

    const formatType = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Category Summary
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {categoryStats.map((cat, idx) => {
                        const percentage = totalAmount > 0 ? (cat.total / totalAmount * 100) : 0;
                        const colors = [
                            'from-blue-500 to-indigo-600',
                            'from-green-500 to-emerald-600',
                            'from-purple-500 to-pink-600',
                            'from-orange-500 to-amber-600',
                            'from-red-500 to-rose-600',
                            'from-cyan-500 to-teal-600',
                            'from-yellow-500 to-orange-600',
                            'from-indigo-500 to-purple-600'
                        ];
                        const bgColors = [
                            'from-blue-50 to-indigo-50',
                            'from-green-50 to-emerald-50',
                            'from-purple-50 to-pink-50',
                            'from-orange-50 to-amber-50',
                            'from-red-50 to-rose-50',
                            'from-cyan-50 to-teal-50',
                            'from-yellow-50 to-orange-50',
                            'from-indigo-50 to-purple-50'
                        ];

                        return (
                            <div key={cat.type} className={`p-4 rounded-xl bg-gradient-to-br ${bgColors[idx % bgColors.length]} border border-slate-100`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900">{formatType(cat.type)}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {cat.count} donations
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {cat.uniqueDonors} donors
                                            </Badge>
                                            {cat.recurringCount > 0 && (
                                                <Badge className="bg-green-100 text-green-800 text-xs">
                                                    {cat.recurringCount} recurring
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900">
                                            ${cat.total.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            avg: ${cat.average.toFixed(0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative h-2 bg-white/60 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{percentage.toFixed(1)}% of total</p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}