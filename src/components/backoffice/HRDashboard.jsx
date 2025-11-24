import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

export default function HRDashboard({ onRefresh, canManage }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Human Resources Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">HR Management</h3>
                        <p className="text-slate-600">
                            HR features and employee management will be available here
                        </p>
                    </div>
                </CardContent>
            </Card>

            {!canManage && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 text-center text-yellow-800">
                        You have view-only access to HR data
                    </CardContent>
                </Card>
            )}
        </div>
    );
}