import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, TrendingUp, Users, Target } from 'lucide-react';
import EmailCampaignManager from './EmailCampaignManager';

export default function MarketingDashboard({ subscriptions, interactions, onRefresh, canManage }) {
    const totalCustomers = subscriptions.length;
    const activeCustomers = subscriptions.filter(s => s.status === 'active').length;
    const trialCustomers = subscriptions.filter(s => s.status === 'trial').length;
    const churnedCustomers = subscriptions.filter(s => s.status === 'cancelled').length;

    const conversionRate = trialCustomers > 0 ? ((activeCustomers / (activeCustomers + trialCustomers)) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Customers</p>
                                <p className="text-2xl font-bold">{totalCustomers}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Active</p>
                                <p className="text-2xl font-bold">{activeCustomers}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">In Trial</p>
                                <p className="text-2xl font-bold">{trialCustomers}</p>
                            </div>
                            <Target className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Conversion Rate</p>
                                <p className="text-2xl font-bold">{conversionRate}%</p>
                            </div>
                            <Megaphone className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Marketing Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded">
                            <span className="font-semibold">Trial-to-Paid Conversion:</span>
                            <Badge className="bg-green-500">{conversionRate}%</Badge>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded">
                            <span className="font-semibold">Churn Rate:</span>
                            <Badge className="bg-red-500">
                                {totalCustomers > 0 ? ((churnedCustomers / totalCustomers) * 100).toFixed(1) : 0}%
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded">
                            <span className="font-semibold">Customer Interactions:</span>
                            <Badge>{interactions.length}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Email Campaign Management */}
            <EmailCampaignManager />

            {!canManage && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 text-center text-yellow-800">
                        You have view-only access to marketing data
                    </CardContent>
                </Card>
            )}
        </div>
    );
}