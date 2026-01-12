import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";

export default function SMSDiagnostics() {
    const [diagnostics, setDiagnostics] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Hello from ChurchConnect! This is a test message.');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const runDiagnostics = async () => {
        setIsRunning(true);
        const results = {
            timestamp: new Date().toISOString(),
            checks: []
        };

        // Check 1: Test Sinch Connection
        try {
            console.log('Testing Sinch connection...');
            const { data: connectionTest } = await base44.functions.invoke('testSinchConnection');
            
            if (connectionTest.success) {
                results.checks.push({
                    name: "Sinch API Connection",
                    status: "success",
                    message: connectionTest.message,
                    details: connectionTest.details
                });
            } else {
                results.checks.push({
                    name: "Sinch API Connection",
                    status: "error",
                    message: connectionTest.error,
                    details: connectionTest.details
                });
            }
        } catch (error) {
            results.checks.push({
                name: "Sinch API Connection",
                status: "error",
                message: `Connection test failed: ${error.message}`
            });
        }

        // Check 2: Church Settings
        try {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length === 0) {
                results.checks.push({
                    name: "Church Settings",
                    status: "error",
                    message: "No church settings found. Go to Settings page to configure."
                });
            } else {
                const churchSettings = settings[0];
                const hasServicePlanId = !!churchSettings.sinch_service_plan_id;
                const hasApiToken = !!churchSettings.sinch_api_token;
                const hasPhoneNumber = !!churchSettings.sinch_phone_number;

                if (hasServicePlanId && hasApiToken && hasPhoneNumber) {
                    results.checks.push({
                        name: "Church Settings - Sinch Credentials",
                        status: "success",
                        message: `All credentials present in database. Phone: ${churchSettings.sinch_phone_number}`,
                        details: {
                            service_plan_id: "✅ Set",
                            api_token: "✅ Set",
                            phone_number: churchSettings.sinch_phone_number
                        }
                    });
                } else {
                    results.checks.push({
                        name: "Church Settings - Sinch Credentials",
                        status: "error",
                        message: "Some Sinch credentials are missing in database",
                        details: {
                            service_plan_id: hasServicePlanId ? "✅ Set" : "❌ Missing",
                            api_token: hasApiToken ? "✅ Set" : "❌ Missing",
                            phone_number: hasPhoneNumber ? "✅ Set" : "❌ Missing"
                        }
                    });
                }
            }
        } catch (error) {
            results.checks.push({
                name: "Church Settings",
                status: "error",
                message: `Error loading settings: ${error.message}`
            });
        }

        // Check 3: Keywords
        try {
            const keywords = await base44.entities.TextKeyword.list();
            const activeKeywords = keywords.filter(k => k.is_active);
            
            if (keywords.length === 0) {
                results.checks.push({
                    name: "SMS Keywords",
                    status: "warning",
                    message: "No keywords created yet. Create at least one keyword to test."
                });
            } else if (activeKeywords.length === 0) {
                results.checks.push({
                    name: "SMS Keywords",
                    status: "warning",
                    message: `You have ${keywords.length} keyword(s) but none are active.`,
                    details: keywords.map(k => ({
                        keyword: k.keyword,
                        active: k.is_active,
                        response: k.auto_response?.substring(0, 50) + '...'
                    }))
                });
            } else {
                results.checks.push({
                    name: "SMS Keywords",
                    status: "success",
                    message: `${activeKeywords.length} active keyword(s) found`,
                    details: activeKeywords.map(k => ({
                        keyword: k.keyword,
                        response_type: k.response_type,
                        usage_count: k.usage_count || 0,
                        response: k.auto_response?.substring(0, 100)
                    }))
                });
            }
        } catch (error) {
            results.checks.push({
                name: "SMS Keywords",
                status: "error",
                message: `Error loading keywords: ${error.message}`
            });
        }

        // Check 4: Recent Messages
        try {
            const messages = await base44.entities.TextMessage.list('-created_date', 10);
            
            if (messages.length === 0) {
                results.checks.push({
                    name: "Message History",
                    status: "warning",
                    message: "No messages in system yet. Text a keyword to test."
                });
            } else {
                const inbound = messages.filter(m => m.direction === 'inbound');
                const outbound = messages.filter(m => m.direction === 'outbound');
                const failed = messages.filter(m => m.status === 'failed');

                results.checks.push({
                    name: "Message History",
                    status: failed.length > 0 ? "warning" : "success",
                    message: `${messages.length} recent messages found`,
                    details: {
                        inbound: inbound.length,
                        outbound: outbound.length,
                        failed: failed.length,
                        recent_messages: messages.slice(0, 5).map(m => ({
                            direction: m.direction,
                            phone: m.phone_number,
                            keyword: m.keyword_triggered,
                            status: m.status,
                            error: m.error_message,
                            message: m.message_body?.substring(0, 50),
                            date: new Date(m.created_date).toLocaleString()
                        }))
                    }
                });
            }
        } catch (error) {
            results.checks.push({
                name: "Message History",
                status: "error",
                message: `Error loading messages: ${error.message}`
            });
        }

        // Check 5: Webhook URL
        results.checks.push({
            name: "Webhook Configuration",
            status: "info",
            message: "Verify this URL is set in Sinch Dashboard",
            details: {
                correct_url: "https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS",
                location: "Sinch Dashboard → Numbers → Your Number → Webhooks → Inbound SMS",
                important: "URL MUST end with 'handleIncomingSinchSMS' (not 'handleIncomingSMS')"
            }
        });

        // Check 6: Environment Variables
        results.checks.push({
            name: "Environment Variables",
            status: "warning",
            message: "CRITICAL: Environment variables must be set for webhooks to work",
            details: {
                required_vars: [
                    "SINCH_SERVICE_PLAN_ID",
                    "SINCH_API_TOKEN",
                    "SINCH_PHONE_NUMBER"
                ],
                location: "Dashboard → Code → Environment Variables",
                note: "Webhooks come from external servers and CANNOT access database settings. Environment variables are required!"
            }
        });

        setDiagnostics(results);
        setIsRunning(false);
    };

    const sendTestSMS = async () => {
        if (!testPhone || !testMessage) {
            alert('Please enter both phone number and message');
            return;
        }

        setIsSendingTest(true);
        setTestResult(null);

        try {
            const { data } = await base44.functions.invoke('sendSinchSMS', {
                to: testPhone,
                message: testMessage
            });

            if (data.success) {
                setTestResult({
                    success: true,
                    message: `✅ Test SMS sent successfully to ${testPhone}!`,
                    details: data
                });
            } else {
                setTestResult({
                    success: false,
                    message: `❌ Failed to send test SMS`,
                    details: data
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: `❌ Error: ${error.message}`,
                error: error.message
            });
        }

        setIsSendingTest(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-blue-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">SMS System Diagnostics</h1>
                    <p className="text-slate-600 mt-1">Run comprehensive checks on your SMS keyword system</p>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>System Health Check</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={runDiagnostics} 
                            disabled={isRunning}
                            className="w-full"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Running Diagnostics...
                                </>
                            ) : (
                                "Run Full Diagnostics"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Send Test SMS</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="testPhone">Test Phone Number</Label>
                            <Input
                                id="testPhone"
                                type="tel"
                                placeholder="+15551234567"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                            />
                            <p className="text-xs text-slate-500">Include country code (e.g., +1 for US)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="testMessage">Test Message</Label>
                            <Input
                                id="testMessage"
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                            />
                        </div>
                        <Button 
                            onClick={sendTestSMS} 
                            disabled={isSendingTest || !testPhone || !testMessage}
                            className="w-full"
                        >
                            {isSendingTest ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Test SMS
                                </>
                            )}
                        </Button>

                        {testResult && (
                            <div className={`p-4 rounded-lg border-2 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <p className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                    {testResult.message}
                                </p>
                                {testResult.details && (
                                    <pre className="mt-2 text-xs overflow-auto">
                                        {JSON.stringify(testResult.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {diagnostics && (
                    <div className="space-y-4">
                        <div className="text-sm text-slate-500">
                            Last run: {new Date(diagnostics.timestamp).toLocaleString()}
                        </div>

                        {diagnostics.checks.map((check, index) => (
                            <Card key={index} className={`shadow-lg border-2 ${getStatusColor(check.status)}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        {getStatusIcon(check.status)}
                                        <span>{check.name}</span>
                                        <Badge variant="outline">{check.status}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm">{check.message}</p>
                                    
                                    {check.details && (
                                        <div className="bg-white p-4 rounded-lg border">
                                            <pre className="text-xs overflow-auto whitespace-pre-wrap">
                                                {JSON.stringify(check.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!diagnostics && (
                    <Card className="shadow-lg bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <p className="text-center text-slate-600">
                                Click "Run Full Diagnostics" to check your SMS system configuration
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}