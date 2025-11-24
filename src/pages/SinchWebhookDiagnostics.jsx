import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

export default function SinchWebhookDiagnostics() {
    const [diagnostics, setDiagnostics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        runDiagnostics();
    }, []);

    const runDiagnostics = async () => {
        setIsLoading(true);
        
        const results = {
            envVars: { status: 'unknown', details: {} },
            keywords: { status: 'unknown', count: 0 },
            recentMessages: { status: 'unknown', inbound: 0, outbound: 0, lastInbound: null },
            webhookTest: { status: 'unknown', message: '' }
        };

        // Check environment variables
        try {
            const response = await base44.functions.invoke('testSinchSetup');
            if (response.data?.all_configured) {
                results.envVars.status = 'success';
                results.envVars.details = response.data.environment_variables;
            } else {
                results.envVars.status = 'error';
                results.envVars.details = response.data?.environment_variables || {};
            }
            
            results.keywords.count = response.data?.keywords?.active || 0;
            results.keywords.status = results.keywords.count > 0 ? 'success' : 'warning';
        } catch (error) {
            results.envVars.status = 'error';
            results.envVars.message = error.message;
        }

        // Check recent messages
        try {
            const messages = await base44.entities.TextMessage.list('-created_date', 50);
            const inbound = messages.filter(m => m.direction === 'inbound');
            const outbound = messages.filter(m => m.direction === 'outbound');
            
            results.recentMessages.inbound = inbound.length;
            results.recentMessages.outbound = outbound.length;
            results.recentMessages.lastInbound = inbound[0]?.created_date || null;
            
            if (inbound.length === 0) {
                results.recentMessages.status = 'error';
                results.recentMessages.message = 'No inbound messages received - webhook likely not configured';
            } else if (inbound[0] && new Date() - new Date(inbound[0].created_date) > 7 * 24 * 60 * 60 * 1000) {
                results.recentMessages.status = 'warning';
                results.recentMessages.message = 'No recent inbound messages (7+ days)';
            } else {
                results.recentMessages.status = 'success';
            }
        } catch (error) {
            results.recentMessages.status = 'error';
            results.recentMessages.message = error.message;
        }

        // Test webhook accessibility
        try {
            const webhookUrl = "https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS";
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                results.webhookTest.status = 'success';
                results.webhookTest.message = 'Webhook endpoint is accessible';
            } else {
                results.webhookTest.status = 'warning';
                results.webhookTest.message = `Webhook returned ${response.status}`;
            }
        } catch (error) {
            results.webhookTest.status = 'error';
            results.webhookTest.message = 'Cannot reach webhook endpoint';
        }

        setDiagnostics(results);
        setIsLoading(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
            default: return <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'border-green-200 bg-green-50';
            case 'warning': return 'border-yellow-200 bg-yellow-50';
            case 'error': return 'border-red-200 bg-red-50';
            default: return 'border-slate-200 bg-slate-50';
        }
    };

    if (isLoading || !diagnostics) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-900 mb-6">SMS Diagnostics</h1>
                    <Card>
                        <CardContent className="p-12 text-center">
                            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                            <p className="text-slate-600">Running diagnostics...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const criticalIssue = diagnostics.recentMessages.status === 'error' || diagnostics.envVars.status === 'error';

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">SMS Diagnostics</h1>
                        <p className="text-slate-600 mt-1">System health check for SMS messaging</p>
                    </div>
                    <Button onClick={runDiagnostics} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Critical Issue Alert */}
                {criticalIssue && (
                    <Alert className="border-2 border-red-500 bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <AlertDescription>
                            <p className="font-bold text-red-900 mb-2">🚨 CRITICAL ISSUE DETECTED</p>
                            <p className="text-red-800">
                                {diagnostics.recentMessages.status === 'error' 
                                    ? "No inbound messages received - webhook is NOT configured in Sinch Dashboard"
                                    : "SMS system is not properly configured"}
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Environment Variables */}
                <Card className={`border-2 ${getStatusColor(diagnostics.envVars.status)}`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Environment Variables</CardTitle>
                            {getStatusIcon(diagnostics.envVars.status)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(diagnostics.envVars.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center p-2 bg-white rounded">
                                    <span className="font-mono text-sm">{key}</span>
                                    <span className={value.includes('✅') ? 'text-green-700' : 'text-red-700'}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Keywords */}
                <Card className={`border-2 ${getStatusColor(diagnostics.keywords.status)}`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Keywords</CardTitle>
                            {getStatusIcon(diagnostics.keywords.status)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-900">{diagnostics.keywords.count} Active Keywords</p>
                        {diagnostics.keywords.count === 0 && (
                            <p className="text-sm text-yellow-700 mt-2">No keywords created yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Messages */}
                <Card className={`border-2 ${getStatusColor(diagnostics.recentMessages.status)}`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Messages</CardTitle>
                            {getStatusIcon(diagnostics.recentMessages.status)}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-sm text-slate-600">Inbound</p>
                                <p className="text-3xl font-bold text-slate-900">{diagnostics.recentMessages.inbound}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-sm text-slate-600">Outbound</p>
                                <p className="text-3xl font-bold text-slate-900">{diagnostics.recentMessages.outbound}</p>
                            </div>
                        </div>
                        {diagnostics.recentMessages.lastInbound && (
                            <p className="text-sm text-slate-600">
                                Last inbound: {new Date(diagnostics.recentMessages.lastInbound).toLocaleString()}
                            </p>
                        )}
                        {diagnostics.recentMessages.message && (
                            <Alert className={diagnostics.recentMessages.status === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
                                <AlertDescription className={diagnostics.recentMessages.status === 'error' ? 'text-red-800' : 'text-yellow-800'}>
                                    {diagnostics.recentMessages.message}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Webhook Test */}
                <Card className={`border-2 ${getStatusColor(diagnostics.webhookTest.status)}`}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Webhook Endpoint</CardTitle>
                            {getStatusIcon(diagnostics.webhookTest.status)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-700">{diagnostics.webhookTest.message}</p>
                    </CardContent>
                </Card>

                {/* Action Required */}
                {diagnostics.recentMessages.status === 'error' && (
                    <Card className="border-2 border-orange-500 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="text-orange-900">⚡ Action Required</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="font-semibold text-orange-900">
                                Your webhook is NOT receiving inbound messages from Sinch.
                            </p>
                            <ol className="space-y-2 text-sm text-orange-800 list-decimal ml-5">
                                <li>Go to <a href="https://dashboard.sinch.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Sinch Dashboard</a></li>
                                <li>Click <strong>Numbers</strong> → Select <strong>+15743755450</strong></li>
                                <li>Find <strong>SMS Configuration</strong> or <strong>Webhooks</strong></li>
                                <li>Set the webhook URL to:
                                    <div className="bg-white p-2 rounded mt-1 font-mono text-xs break-all">
                                        https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS
                                    </div>
                                </li>
                                <li>Set method to <strong>POST</strong></li>
                                <li>Click <strong>Save</strong></li>
                                <li>Test by texting a keyword to your number</li>
                            </ol>
                            <Button 
                                onClick={() => window.open('https://dashboard.sinch.com', '_blank')}
                                className="w-full bg-orange-600 hover:bg-orange-700"
                            >
                                Open Sinch Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}