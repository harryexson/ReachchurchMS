import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Crown, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function TrialExpiredPaywall({ trialEndDate, churchName }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <Card className="max-w-2xl w-full shadow-2xl border-2 border-orange-200">
                <CardContent className="p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-10 h-10 text-white" />
                    </div>
                    
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">
                            Your Trial Period Has Ended
                        </h1>
                        <p className="text-lg text-slate-600">
                            Thank you for trying REACH Church Connect, {churchName || 'valued partner'}!
                        </p>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200 text-left">
                        <AlertDescription className="text-slate-700">
                            <strong className="text-blue-900">Good news!</strong> All your data, settings, and configurations have been preserved. 
                            Simply choose a subscription plan to continue where you left off.
                        </AlertDescription>
                    </Alert>

                    <div className="bg-slate-50 rounded-lg p-6 text-left">
                        <h3 className="font-semibold text-slate-900 mb-3">What happens next?</h3>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>All your member data remains intact</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>Your donation records are preserved</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>Event schedules and settings saved</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>Custom branding and configuration ready</span>
                            </li>
                        </ul>
                    </div>

                    <div className="pt-4">
                        <Link to={createPageUrl('SubscriptionPlans')}>
                            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-12 py-6 text-lg">
                                <Crown className="w-5 h-5 mr-2" />
                                Choose Your Plan
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <p className="text-sm text-slate-500">
                        Questions? Contact us at <a href="mailto:support@reachchurchms.com" className="text-blue-600 hover:underline">support@reachchurchms.com</a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}