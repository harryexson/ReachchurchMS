import React from 'react';
import { useSubscription } from './useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MemberLimitGuard({ currentMemberCount, children, showAlert = true }) {
    const { features, loading, getPlanName } = useSubscription();

    if (loading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    const limit = features.member_limit || 100;
    const isAtLimit = currentMemberCount >= limit;
    const isNearLimit = currentMemberCount >= limit * 0.9; // 90% of limit

    if (isAtLimit && showAlert) {
        return (
            <Alert className="bg-red-50 border-red-200">
                <Users className="w-5 h-5 text-red-600" />
                <AlertDescription className="text-red-800 space-y-3">
                    <div>
                        <p className="font-semibold">Member Limit Reached</p>
                        <p className="text-sm mt-1">
                            You've reached the {limit} member limit for the {getPlanName()} plan.
                            Upgrade to add more members.
                        </p>
                    </div>
                    <Link to={createPageUrl('SubscriptionPlans')}>
                        <Button className="bg-red-600 hover:bg-red-700">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade Now
                        </Button>
                    </Link>
                </AlertDescription>
            </Alert>
        );
    }

    if (isNearLimit && showAlert) {
        return (
            <>
                <Alert className="bg-amber-50 border-amber-200 mb-4">
                    <Users className="w-5 h-5 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        <p className="font-semibold">Approaching Member Limit</p>
                        <p className="text-sm mt-1">
                            You have {limit - currentMemberCount} member slots remaining ({currentMemberCount}/{limit}).
                            Consider upgrading soon.
                        </p>
                    </AlertDescription>
                </Alert>
                {children}
            </>
        );
    }

    return <>{children}</>;
}