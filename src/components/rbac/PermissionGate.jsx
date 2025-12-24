import React from 'react';
import { usePermissions } from './usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

export default function PermissionGate({ category, action, children, fallback = null, showMessage = false }) {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
        return null;
    }

    const permitted = hasPermission(category, action);

    if (!permitted) {
        if (showMessage) {
            return (
                <Alert className="border-amber-200 bg-amber-50">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                        You don't have permission to access this feature.
                    </AlertDescription>
                </Alert>
            );
        }
        return fallback;
    }

    return <>{children}</>;
}