import React from 'react';
import { useSubscription } from './useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UsageLimitAlert({ limitType, currentUsage }) {
    const { features, subscription, getPlanName } = useSubscription();

    const configs = {
        sms: {
            limit: features.sms_monthly_limit || 0,
            enabled: features.sms_enabled,
            icon: MessageSquare,
            name: 'SMS Messages',
            color: 'blue'
        },
        mms: {
            limit: features.mms_monthly_limit || 0,
            enabled: features.mms_enabled,
            icon: MessageSquare,
            name: 'MMS Campaigns',
            color: 'purple'
        },
        video: {
            limit: features.video_max_participants || 0,
            enabled: features.video_enabled,
            icon: MessageSquare,
            name: 'Video Meeting Participants',
            color: 'green'
        }
    };

    const config = configs[limitType];
    if (!config) return null;

    const Icon = config.icon;
    const remaining = config.limit - (currentUsage || 0);
    const percentUsed = config.limit > 0 ? (currentUsage / config.limit) * 100 : 0;

    if (!config.enabled) {
        return (
            <Alert className="bg-slate-50 border-slate-200">
                <AlertCircle className="w-5 h-5 text-slate-600" />
                <AlertDescription className="text-slate-700 space-y-3">
                    <div>
                        <p className="font-semibold">{config.name} Not Available</p>
                        <p className="text-sm mt-1">
                            This feature is not included in the {getPlanName()} plan.
                        </p>
                    </div>
                    <Link to={createPageUrl('SubscriptionPlans')}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade to Growth Plan
                        </Button>
                    </Link>
                </AlertDescription>
            </Alert>
        );
    }

    if (remaining <= 0) {
        return (
            <Alert className="bg-red-50 border-red-200">
                <Icon className="w-5 h-5 text-red-600" />
                <AlertDescription className="text-red-800 space-y-3">
                    <div>
                        <p className="font-semibold">Monthly Limit Reached</p>
                        <p className="text-sm mt-1">
                            You've used all {config.limit} {config.name} for this month.
                            Upgrade for unlimited access.
                        </p>
                    </div>
                    <Link to={createPageUrl('SubscriptionPlans')}>
                        <Button className="bg-red-600 hover:bg-red-700">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade to Premium
                        </Button>
                    </Link>
                </AlertDescription>
            </Alert>
        );
    }

    if (percentUsed >= 90) {
        return (
            <Alert className="bg-amber-50 border-amber-200">
                <Icon className="w-5 h-5 text-amber-600" />
                <AlertDescription className="text-amber-800">
                    <p className="font-semibold">Approaching Limit</p>
                    <p className="text-sm mt-1">
                        {remaining} {config.name} remaining this month ({currentUsage}/{config.limit} used)
                    </p>
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}