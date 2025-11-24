import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "../components/subscription/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    CheckCircle, XCircle, AlertTriangle, RefreshCw, 
    Database, User as UserIcon, CreditCard, Key, Loader2, Wrench
} from "lucide-react";

export default function SystemDiagnosticsPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [allSubscriptions, setAllSubscriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [diagnosticResults, setDiagnosticResults] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResults, setSyncResults] = useState(null);
    
    const { 
        subscription, 
        features, 
        loading: subLoading,
        canUseKidsCheckIn,
        getPlanName,
        refresh,
        debugInfo
    } = useSubscription();

    useEffect(() => {
        runDiagnostics();
    }, []);

    const runDiagnostics = async () => {
        setIsLoading(true);
        const results = {
            user: null,
            subscriptions: [],
            activeSubscription: null,
            features: null,
            issues: []
        };

        try {
            // 1. Check current user
            const user = await base44.auth.me();
            results.user = user;
            setCurrentUser(user);

            if (!user) {
                results.issues.push({
                    level: 'error',
                    message: 'No user authenticated'
                });
                setDiagnosticResults(results);
                setIsLoading(false);
                return;
            }

            // 2. Get ALL subscriptions
            const allSubs = await base44.entities.Subscription.list();
            results.subscriptions = allSubs;
            setAllSubscriptions(allSubs);

            console.log('🔍 All subscriptions in database:', allSubs.length);

            // 3. Find subscriptions for current user
            const emailsToCheck = [user.email, user.donor_email, user.church_admin_email].filter(Boolean);
            console.log(`📧 Checking emails:`, emailsToCheck);

            const userSubs = allSubs.filter(s => 
                emailsToCheck.includes(s.church_admin_email)
            );

            console.log(`📧 Subscriptions for user:`, userSubs.length);

            if (userSubs.length === 0) {
                results.issues.push({
                    level: 'error',
                    message: `No subscriptions found for emails: ${emailsToCheck.join(', ')}`,
                    fix: 'Complete the subscription checkout process at Plans & Pricing'
                });
            } else {
                // Find active subscriptions
                const activeSubs = userSubs.filter(s => 
                    s.status === 'active' || s.status === 'trial'
                );

                console.log(`✅ Active subscriptions:`, activeSubs.length);

                if (activeSubs.length === 0) {
                    results.issues.push({
                        level: 'warning',
                        message: 'You have subscription records but none are active',
                        details: userSubs.map(s => `${s.subscription_tier} - ${s.status}`).join(', '),
                        fix: 'Use the "Force Sync with Stripe" button below'
                    });
                } else {
                    // Sort by tier priority
                    const tierPriority = { premium: 3, growth: 2, starter: 1, standard: 2, basic: 1 };
                    activeSubs.sort((a, b) => {
                        const aPriority = tierPriority[a.subscription_tier] || 0;
                        const bPriority = tierPriority[b.subscription_tier] || 0;
                        return bPriority - aPriority;
                    });

                    results.activeSubscription = activeSubs[0];
                    console.log(`🎯 Selected active subscription:`, results.activeSubscription);

                    // Check features object
                    if (!results.activeSubscription.features || 
                        Array.isArray(results.activeSubscription.features)) {
                        results.issues.push({
                            level: 'error',
                            message: 'Subscription has OLD feature format (array)',
                            fix: 'Click "Force Sync with Stripe" to update features',
                            details: `Current format: ${JSON.stringify(results.activeSubscription.features)}`
                        });
                    } else if (typeof results.activeSubscription.features === 'object') {
                        results.features = results.activeSubscription.features;
                        
                        // Check kids check-in for Growth/Premium
                        if ((results.activeSubscription.subscription_tier === 'growth' || 
                             results.activeSubscription.subscription_tier === 'premium') &&
                            !results.features.kids_checkin_enabled) {
                            results.issues.push({
                                level: 'error',
                                message: 'kids_checkin_enabled is FALSE but you have Growth/Premium plan',
                                fix: 'Click "Force Sync with Stripe" to fix features'
                            });
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Diagnostic error:', error);
            results.issues.push({
                level: 'error',
                message: 'Failed to run diagnostics',
                details: error.message
            });
        }

        setDiagnosticResults(results);
        setIsLoading(false);
    };

    const handleForceSyncWithStripe = async () => {
        if (!confirm('This will force a sync with Stripe to fix any subscription mismatches. Continue?')) {
            return;
        }

        setIsSyncing(true);
        setSyncResults(null);

        try {
            const response = await base44.functions.invoke('syncSubscription');
            console.log('Sync response:', response);
            
            setSyncResults(response.data);
            
            // Wait a moment then refresh everything
            await new Promise(resolve => setTimeout(resolve, 2000));
            await runDiagnostics();
            await refresh();
            
            alert('✅ Sync completed! Check the results below.');
        } catch (error) {
            console.error('Sync error:', error);
            alert('❌ Sync failed: ' + error.message);
            setSyncResults({ success: false, error: error.message });
        }

        setIsSyncing(false);
    };

    const StatusIcon = ({ level }) => {
        switch (level) {
            case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'info': return <CheckCircle className="w-5 h-5 text-blue-600" />;
            default: return <CheckCircle className="w-5 h-5 text-green-600" />;
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">System Diagnostics</h1>
                        <p className="text-slate-600">Subscription & Feature Analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={runDiagnostics} disabled={isLoading} variant="outline" className="gap-2">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button 
                            onClick={handleForceSyncWithStripe} 
                            disabled={isSyncing}
                            className="gap-2 bg-orange-600 hover:bg-orange-700"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <Wrench className="w-4 h-4" />
                                    Force Sync with Stripe
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Sync Results */}
                {syncResults && (
                    <Card className={syncResults.success ? "border-2 border-green-200 bg-green-50" : "border-2 border-red-200 bg-red-50"}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {syncResults.success ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-green-900">Sync Completed</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-red-900">Sync Failed</span>
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {syncResults.success ? (
                                <div className="space-y-3">
                                    <p className="text-green-900 font-medium">{syncResults.message}</p>
                                    <div className="text-sm space-y-2">
                                        <p>✅ Checked: {syncResults.subscriptions_checked} subscription(s)</p>
                                        {syncResults.results && syncResults.results.map((result, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded border">
                                                <p className="font-semibold">
                                                    {result.status === 'updated' && '🔄 Updated'}
                                                    {result.status === 'up_to_date' && '✅ Already Synced'}
                                                    {result.status === 'error' && '❌ Error'}
                                                    {result.status === 'skipped' && '⏭️ Skipped'}
                                                </p>
                                                <p className="text-sm text-slate-600">{result.message}</p>
                                                {result.old_tier && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {result.old_tier} → {result.new_tier}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-red-900">{syncResults.error}</p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Current User */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5" />
                            Current User
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentUser ? (
                            <div className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {currentUser.full_name}</p>
                                <p><strong>Email:</strong> {currentUser.email}</p>
                                <p><strong>Role:</strong> {currentUser.role}</p>
                                {currentUser.donor_email && (
                                    <p><strong>Donor Email:</strong> {currentUser.donor_email}</p>
                                )}
                                {currentUser.church_admin_email && (
                                    <p><strong>Church Admin Email:</strong> {currentUser.church_admin_email}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-600">Loading...</p>
                        )}
                    </CardContent>
                </Card>

                {/* useSubscription Hook Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            useSubscription Hook Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                {subLoading ? (
                                    <Badge className="bg-yellow-100 text-yellow-800">Loading...</Badge>
                                ) : subscription ? (
                                    <Badge className="bg-green-100 text-green-800">✅ Loaded</Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-800">❌ No Subscription</Badge>
                                )}
                            </div>

                            {subscription && (
                                <div className="space-y-2 text-sm">
                                    <p><strong>Tier:</strong> {subscription.subscription_tier}</p>
                                    <p><strong>Status:</strong> {subscription.status}</p>
                                    <p><strong>Plan Name:</strong> {getPlanName()}</p>
                                    <p><strong>Email:</strong> {subscription.church_admin_email}</p>
                                </div>
                            )}

                            <div className="border-t pt-3 mt-3">
                                <p className="font-semibold mb-2 text-lg">🔍 Kids Check-In Feature:</p>
                                <div className="flex items-center gap-2">
                                    {canUseKidsCheckIn ? (
                                        <>
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                            <span className="text-green-700 font-bold text-lg">ENABLED ✅</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-6 h-6 text-red-600" />
                                            <span className="text-red-700 font-bold text-lg">DISABLED ❌</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {debugInfo && (
                                <details className="border-t pt-3 mt-3">
                                    <summary className="cursor-pointer font-semibold text-blue-700 hover:text-blue-900">
                                        🐛 Debug Information
                                    </summary>
                                    <div className="mt-2 space-y-2 text-xs">
                                        <p><strong>Subscription ID:</strong> {debugInfo.subscriptionId}</p>
                                        <p><strong>Tier:</strong> {debugInfo.tier}</p>
                                        <p><strong>Status:</strong> {debugInfo.status}</p>
                                        <p><strong>Calculated At:</strong> {new Date(debugInfo.calculatedAt).toLocaleString()}</p>
                                        
                                        <div className="bg-slate-100 p-2 rounded mt-2">
                                            <p className="font-semibold">Base Plan Features:</p>
                                            <pre className="text-xs overflow-x-auto">{JSON.stringify(debugInfo.basePlanFeatures, null, 2)}</pre>
                                        </div>
                                        
                                        <div className="bg-slate-100 p-2 rounded mt-2">
                                            <p className="font-semibold">Stored Features:</p>
                                            <pre className="text-xs overflow-x-auto">{JSON.stringify(debugInfo.storedFeatures, null, 2)}</pre>
                                        </div>
                                        
                                        <div className="bg-green-100 p-2 rounded mt-2">
                                            <p className="font-semibold">Final Merged Features:</p>
                                            <pre className="text-xs overflow-x-auto">{JSON.stringify(debugInfo.mergedFeatures, null, 2)}</pre>
                                        </div>
                                    </div>
                                </details>
                            )}

                            {features && (
                                <div className="border-t pt-3 mt-3">
                                    <p className="font-semibold mb-2">All Features:</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {Object.entries(features).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2 bg-slate-50 p-2 rounded">
                                                {value === true || value > 0 ? (
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-3 h-3 text-red-400" />
                                                )}
                                                <span className={value === true || value > 0 ? 'text-green-700' : 'text-slate-400'}>
                                                    {key}: {typeof value === 'boolean' ? (value ? '✅' : '❌') : value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Diagnostic Results */}
                {diagnosticResults && (
                    <>
                        {/* Issues Found */}
                        {diagnosticResults.issues.length > 0 && (
                            <Card className="border-2 border-red-200 bg-red-50">
                                <CardHeader>
                                    <CardTitle className="text-red-900 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Issues Found ({diagnosticResults.issues.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {diagnosticResults.issues.map((issue, idx) => (
                                            <Alert key={idx} className={
                                                issue.level === 'error' ? 'bg-red-100 border-red-300' :
                                                issue.level === 'warning' ? 'bg-yellow-100 border-yellow-300' :
                                                'bg-blue-100 border-blue-300'
                                            }>
                                                <StatusIcon level={issue.level} />
                                                <AlertDescription>
                                                    <p className="font-semibold">{issue.message}</p>
                                                    {issue.details && (
                                                        <p className="text-sm mt-1 text-slate-600">{issue.details}</p>
                                                    )}
                                                    {issue.fix && (
                                                        <p className="text-sm mt-2 font-medium text-blue-700">
                                                            💡 Fix: {issue.fix}
                                                        </p>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* All Subscriptions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="w-5 h-5" />
                                    Your Subscriptions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {diagnosticResults.subscriptions.filter(s => 
                                    currentUser && [currentUser.email, currentUser.donor_email, currentUser.church_admin_email]
                                        .filter(Boolean)
                                        .includes(s.church_admin_email)
                                ).length === 0 ? (
                                    <Alert className="bg-red-50 border-red-200">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <AlertDescription>
                                            <p className="font-semibold text-red-900">No subscriptions found!</p>
                                            <p className="text-sm text-red-700 mt-1">
                                                You need to complete the subscription checkout process.
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="space-y-4">
                                        {diagnosticResults.subscriptions
                                            .filter(s => currentUser && [currentUser.email, currentUser.donor_email, currentUser.church_admin_email]
                                                .filter(Boolean)
                                                .includes(s.church_admin_email))
                                            .map(sub => (
                                                <div key={sub.id} className="border rounded-lg p-4 bg-slate-50">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-bold text-lg">{sub.church_name}</h3>
                                                            <p className="text-sm text-slate-600">{sub.church_admin_email}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Badge className={
                                                                sub.status === 'active' || sub.status === 'trial'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }>
                                                                {sub.status}
                                                            </Badge>
                                                            <Badge className="bg-blue-100 text-blue-800">
                                                                {sub.subscription_tier}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="text-sm space-y-2">
                                                        <p><strong>ID:</strong> {sub.id}</p>
                                                        <p><strong>Created:</strong> {new Date(sub.created_date).toLocaleString()}</p>
                                                        <p><strong>Updated:</strong> {new Date(sub.updated_date).toLocaleString()}</p>
                                                        {sub.stripe_subscription_id && (
                                                            <p><strong>Stripe ID:</strong> {sub.stripe_subscription_id}</p>
                                                        )}
                                                        
                                                        <div className="border-t pt-2 mt-2">
                                                            <p className="font-semibold mb-1">Feature Check:</p>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    {sub.features?.kids_checkin_enabled ? (
                                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                                    ) : (
                                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                                    )}
                                                                    <span className={sub.features?.kids_checkin_enabled ? 'text-green-700 font-medium' : 'text-red-700'}>
                                                                        kids_checkin_enabled: {sub.features?.kids_checkin_enabled ? 'true ✅' : 'false ❌'}
                                                                    </span>
                                                                </div>
                                                                
                                                                <details className="mt-2">
                                                                    <summary className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm">
                                                                        View all features →
                                                                    </summary>
                                                                    <pre className="bg-white p-2 rounded text-xs overflow-x-auto mt-2 max-h-96">
                                                                        {JSON.stringify(sub.features, null, 2)}
                                                                    </pre>
                                                                </details>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}