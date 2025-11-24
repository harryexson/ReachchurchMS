import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    CheckCircle, XCircle, AlertTriangle, RefreshCw, 
    MessageSquare, Database, Key, Server, Loader2, Copy, ExternalLink
} from "lucide-react";

export default function SMSDiagnosticReport() {
    const [diagnostics, setDiagnostics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [testResults, setTestResults] = useState(null);

    useEffect(() => {
        runDiagnostics();
    }, []);

    const runDiagnostics = async () => {
        setIsLoading(true);
        const results = {
            churchSettings: null,
            keywords: [],
            recentMessages: [],
            subscribers: [],
            environmentVariables: {
                SINCH_SERVICE_PLAN_ID: false,
                SINCH_API_TOKEN: false,
                SINCH_PHONE_NUMBER: false
            },
            webhookURL: null,
            issues: [],
            recommendations: []
        };

        try {
            // Check church settings
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                results.churchSettings = settings[0];
                
                // Validate Sinch configuration
                if (!results.churchSettings.sinch_service_plan_id) {
                    results.issues.push({
                        severity: 'error',
                        area: 'Database Configuration',
                        message: 'Sinch Service Plan ID is not set in ChurchSettings',
                        fix: 'Go to Settings → SMS/Sinch tab and configure your Sinch credentials'
                    });
                }
                
                if (!results.churchSettings.sinch_api_token) {
                    results.issues.push({
                        severity: 'error',
                        area: 'Database Configuration',
                        message: 'Sinch API Token is not set in ChurchSettings',
                        fix: 'Go to Settings → SMS/Sinch tab and configure your Sinch credentials'
                    });
                }
                
                if (!results.churchSettings.sinch_phone_number) {
                    results.issues.push({
                        severity: 'error',
                        area: 'Database Configuration',
                        message: 'Sinch Phone Number is not set in ChurchSettings',
                        fix: 'Go to Settings → SMS/Sinch tab and configure your Sinch phone number'
                    });
                }
            } else {
                results.issues.push({
                    severity: 'error',
                    area: 'Database Configuration',
                    message: 'No ChurchSettings record found',
                    fix: 'Create church settings from the Settings page'
                });
            }

            // Check for keywords
            results.keywords = await base44.entities.TextKeyword.list('-created_date', 10);
            
            if (results.keywords.length === 0) {
                results.issues.push({
                    severity: 'warning',
                    area: 'Keywords',
                    message: 'No SMS keywords configured',
                    fix: 'Create at least one keyword in Text Messaging page'
                });
            }

            const activeKeywords = results.keywords.filter(k => k.is_active);
            if (activeKeywords.length === 0 && results.keywords.length > 0) {
                results.issues.push({
                    severity: 'warning',
                    area: 'Keywords',
                    message: 'No active keywords - all keywords are disabled',
                    fix: 'Enable at least one keyword in Text Messaging page'
                });
            }

            // Check for recent messages
            results.recentMessages = await base44.entities.TextMessage.list('-created_date', 20);
            
            const inboundMessages = results.recentMessages.filter(m => m.direction === 'inbound');
            if (inboundMessages.length === 0) {
                results.issues.push({
                    severity: 'critical',
                    area: 'Inbound Messages',
                    message: 'NO INBOUND MESSAGES EVER RECEIVED',
                    fix: 'This is the core issue - webhook is not receiving messages from Sinch',
                    details: 'Either webhook URL is wrong, not configured, or Sinch is not sending to it'
                });
            } else {
                const latestInbound = inboundMessages[0];
                const hoursSinceLastInbound = (Date.now() - new Date(latestInbound.created_date)) / (1000 * 60 * 60);
                
                if (hoursSinceLastInbound > 24) {
                    results.issues.push({
                        severity: 'warning',
                        area: 'Inbound Messages',
                        message: `Last inbound message was ${Math.round(hoursSinceLastInbound)} hours ago`,
                        fix: 'Test by sending a keyword to your Sinch number'
                    });
                }
            }

            // Check subscribers
            results.subscribers = await base44.entities.TextSubscriber.filter({ status: 'active' });

            // Generate webhook URL
            results.webhookURL = 'https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS';

            // Generate recommendations
            if (results.issues.length === 0) {
                results.recommendations.push('✅ All systems appear to be configured correctly!');
                results.recommendations.push('Send a test message to verify end-to-end functionality');
            } else {
                results.recommendations.push('🔧 Fix the issues listed above in priority order');
                results.recommendations.push('⚠️ Environment variables MUST be set for webhooks to work');
                results.recommendations.push('🌐 Verify webhook URL in Sinch dashboard matches exactly');
            }

        } catch (error) {
            console.error('Diagnostic error:', error);
            results.issues.push({
                severity: 'error',
                area: 'System',
                message: 'Failed to run diagnostics',
                details: error.message
            });
        }

        setDiagnostics(results);
        setIsLoading(false);
    };

    const testSinchSetup = async () => {
        setIsTesting(true);
        try {
            const response = await base44.functions.invoke('testSinchSetup');
            setTestResults(response.data);
        } catch (error) {
            setTestResults({
                all_configured: false,
                error: error.message
            });
        }
        setIsTesting(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('✅ Copied to clipboard!');
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-slate-600">Running comprehensive SMS diagnostics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">SMS Diagnostic Report</h1>
                        <p className="text-slate-600 mt-1">Deep dive analysis of your SMS configuration</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={testSinchSetup} disabled={isTesting} variant="outline" className="gap-2">
                            {isTesting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <Server className="w-4 h-4" />
                                    Test Sinch Connection
                                </>
                            )}
                        </Button>
                        <Button onClick={runDiagnostics} variant="outline" className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Test Results */}
                {testResults && (
                    <Card className={testResults.all_configured ? "border-2 border-green-500 bg-green-50" : "border-2 border-red-500 bg-red-50"}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {testResults.all_configured ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-green-900">✅ Connection Test Passed</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-red-900">❌ Connection Test Failed</span>
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-lg border-2 ${testResults.environment_variables_set ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                                    <p className="text-sm font-semibold mb-1">Environment Variables</p>
                                    <Badge className={testResults.environment_variables_set ? 'bg-green-600' : 'bg-red-600'}>
                                        {testResults.environment_variables_set ? '✅ Set' : '❌ Missing'}
                                    </Badge>
                                </div>
                                <div className={`p-4 rounded-lg border-2 ${testResults.database_credentials_set ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                                    <p className="text-sm font-semibold mb-1">Database Settings</p>
                                    <Badge className={testResults.database_credentials_set ? 'bg-green-600' : 'bg-red-600'}>
                                        {testResults.database_credentials_set ? '✅ Configured' : '❌ Not Set'}
                                    </Badge>
                                </div>
                                <div className={`p-4 rounded-lg border-2 ${testResults.api_test?.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                                    <p className="text-sm font-semibold mb-1">API Connection</p>
                                    <Badge className={testResults.api_test?.success ? 'bg-green-600' : 'bg-red-600'}>
                                        {testResults.api_test?.success ? '✅ Connected' : '❌ Failed'}
                                    </Badge>
                                </div>
                            </div>
                            
                            {testResults.next_steps && testResults.next_steps.length > 0 && (
                                <div className="bg-white p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">Next Steps:</h4>
                                    <ol className="list-decimal ml-5 space-y-1 text-sm">
                                        {testResults.next_steps.map((step, idx) => (
                                            <li key={idx} className={step.includes('✅') ? 'text-green-700 font-semibold' : 'text-slate-700'}>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Critical Issues First */}
                {diagnostics.issues.length > 0 && (
                    <Card className="border-2 border-red-500 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-900">
                                <AlertTriangle className="w-5 h-5" />
                                Issues Found ({diagnostics.issues.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {diagnostics.issues
                                .sort((a, b) => {
                                    const severityOrder = { critical: 0, error: 1, warning: 2 };
                                    return severityOrder[a.severity] - severityOrder[b.severity];
                                })
                                .map((issue, idx) => (
                                    <Alert key={idx} className={
                                        issue.severity === 'critical' ? 'bg-red-100 border-red-400' :
                                        issue.severity === 'error' ? 'bg-orange-100 border-orange-400' :
                                        'bg-yellow-100 border-yellow-400'
                                    }>
                                        <AlertDescription>
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    {issue.severity === 'critical' && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                                                    {issue.severity === 'error' && <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />}
                                                    {issue.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                                                    <div className="flex-1">
                                                        <Badge className={
                                                            issue.severity === 'critical' ? 'bg-red-600' :
                                                            issue.severity === 'error' ? 'bg-orange-600' :
                                                            'bg-yellow-600'
                                                        }>
                                                            {issue.area}
                                                        </Badge>
                                                        <p className="font-semibold mt-1">{issue.message}</p>
                                                        {issue.details && (
                                                            <p className="text-sm text-slate-600 mt-1">{issue.details}</p>
                                                        )}
                                                        <p className="text-sm mt-2 font-medium text-blue-700">
                                                            💡 Fix: {issue.fix}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ))}
                        </CardContent>
                    </Card>
                )}

                {/* Webhook Configuration - THE MOST CRITICAL */}
                <Card className="border-2 border-purple-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-900">
                            <Server className="w-5 h-5" />
                            Webhook Configuration (CRITICAL)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="bg-purple-50 border-purple-300">
                            <AlertTriangle className="w-5 h-5 text-purple-600" />
                            <AlertDescription>
                                <p className="font-semibold text-purple-900 mb-2">
                                    🚨 THIS IS THE #1 REASON SMS DOESN'T WORK
                                </p>
                                <p className="text-sm text-purple-800 mb-3">
                                    If you're not receiving inbound messages, the webhook URL in Sinch dashboard is either:
                                </p>
                                <ul className="text-sm text-purple-800 list-disc ml-5 space-y-1">
                                    <li>Not configured at all</li>
                                    <li>Set to the wrong URL (old Twilio handler)</li>
                                    <li>Configured on the wrong phone number</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        <div className="bg-white p-4 rounded-lg border-2 border-purple-300">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-purple-900">✅ Correct Webhook URL:</p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => copyToClipboard(diagnostics.webhookURL)}
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy URL
                                </Button>
                            </div>
                            <code className="block text-xs font-mono bg-purple-50 p-3 rounded break-all text-purple-900">
                                {diagnostics.webhookURL}
                            </code>
                            <p className="text-xs text-purple-700 mt-2 font-semibold">
                                ⚠️ Must end with "handleIncomingSinchSMS" (notice the "Sinch" at the end!)
                            </p>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                            <p className="font-semibold text-red-900 mb-2">❌ WRONG URL (Do NOT use):</p>
                            <code className="block text-xs font-mono bg-red-100 p-3 rounded break-all text-red-900 line-through">
                                https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSMS
                            </code>
                            <p className="text-xs text-red-700 mt-2">
                                This is the OLD Twilio handler - it expects XML responses, not JSON
                            </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">How to Update in Sinch:</h4>
                            <ol className="list-decimal ml-5 space-y-2 text-sm text-blue-800">
                                <li>Login to <a href="https://dashboard.sinch.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                                    dashboard.sinch.com <ExternalLink className="w-3 h-3" />
                                </a></li>
                                <li>Go to <strong>Numbers</strong> → Click your phone number <strong>({diagnostics.churchSettings?.sinch_phone_number || '+15743755450'})</strong></li>
                                <li>Find <strong>SMS Configuration</strong> or <strong>Webhooks</strong> section</li>
                                <li>Set <strong>Inbound SMS Webhook URL</strong> to the CORRECT URL above</li>
                                <li>Set HTTP Method to <strong>POST</strong></li>
                                <li>Click <strong>Save</strong></li>
                                <li>Send a test SMS to verify!</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>

                {/* Church Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Church Settings (Database)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {diagnostics.churchSettings ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-slate-700">Service Plan ID:</p>
                                        <p className={diagnostics.churchSettings.sinch_service_plan_id ? 'text-green-600 font-mono text-xs' : 'text-red-600'}>
                                            {diagnostics.churchSettings.sinch_service_plan_id || '❌ Not Set'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-700">API Token:</p>
                                        <p className={diagnostics.churchSettings.sinch_api_token ? 'text-green-600' : 'text-red-600'}>
                                            {diagnostics.churchSettings.sinch_api_token ? `✅ Set (${diagnostics.churchSettings.sinch_api_token.length} chars)` : '❌ Not Set'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-700">Phone Number:</p>
                                        <p className={diagnostics.churchSettings.sinch_phone_number ? 'text-green-600 font-mono' : 'text-red-600'}>
                                            {diagnostics.churchSettings.sinch_phone_number || '❌ Not Set'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-700">Configured Status:</p>
                                        <Badge className={diagnostics.churchSettings.sinch_configured ? 'bg-green-600' : 'bg-red-600'}>
                                            {diagnostics.churchSettings.sinch_configured ? '✅ Yes' : '❌ No'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Alert className="bg-red-50">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <AlertDescription>
                                    No church settings found in database
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Keywords Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            Keywords Status ({diagnostics.keywords.length} total)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {diagnostics.keywords.length > 0 ? (
                            <div className="space-y-2">
                                {diagnostics.keywords.map(kw => (
                                    <div key={kw.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <span className="font-bold text-blue-600">{kw.keyword}</span>
                                            <span className="text-sm text-slate-600 ml-3">Used {kw.usage_count || 0} times</span>
                                        </div>
                                        <Badge className={kw.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                            {kw.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-600">No keywords configured</p>
                        )}
                    </CardContent>
                </Card>

                {/* Message Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Recent Message Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {diagnostics.recentMessages.length > 0 ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-blue-600 font-semibold">Inbound</p>
                                        <p className="text-2xl font-bold text-blue-900">
                                            {diagnostics.recentMessages.filter(m => m.direction === 'inbound').length}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <p className="text-sm text-green-600 font-semibold">Outbound</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {diagnostics.recentMessages.filter(m => m.direction === 'outbound').length}
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <p className="text-sm text-purple-600 font-semibold">Total</p>
                                        <p className="text-2xl font-bold text-purple-900">
                                            {diagnostics.recentMessages.length}
                                        </p>
                                    </div>
                                </div>

                                <details className="bg-slate-50 p-3 rounded-lg">
                                    <summary className="cursor-pointer font-semibold text-blue-700 hover:text-blue-900">
                                        View Recent Messages →
                                    </summary>
                                    <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                                        {diagnostics.recentMessages.slice(0, 10).map(msg => (
                                            <div key={msg.id} className="p-2 bg-white rounded border text-xs">
                                                <div className="flex justify-between items-center mb-1">
                                                    <Badge className={msg.direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                                        {msg.direction === 'inbound' ? '← IN' : '→ OUT'}
                                                    </Badge>
                                                    <span className="text-slate-500">
                                                        {new Date(msg.created_date).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-slate-700">{msg.message_body?.substring(0, 100)}</p>
                                                {msg.keyword_triggered && (
                                                    <Badge variant="outline" className="mt-1">{msg.keyword_triggered}</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        ) : (
                            <Alert className="bg-yellow-50">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                <AlertDescription>
                                    No message history found - SMS has never been used
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="border-2 border-green-500">
                    <CardHeader>
                        <CardTitle className="text-green-900">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {diagnostics.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                    <span className="text-slate-700">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}