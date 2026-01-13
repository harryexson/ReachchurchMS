import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    MessageSquare,
    ExternalLink,
    Copy,
    Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SMSHealthCheck() {
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [healthStatus, setHealthStatus] = useState(null);
    const [testPhone, setTestPhone] = useState("");
    const [testResult, setTestResult] = useState(null);
    const [recentMessages, setRecentMessages] = useState([]);

    useEffect(() => {
        runHealthCheck();
        loadRecentMessages();
    }, []);

    const loadRecentMessages = async () => {
        try {
            const messages = await base44.entities.TextMessage.list('-created_date', 10);
            setRecentMessages(messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const runHealthCheck = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('testSinchSetup');
            setHealthStatus(result.data || result);
        } catch (error) {
            console.error('Health check failed:', error);
            setHealthStatus({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const sendTestSMS = async () => {
        if (!testPhone) {
            alert('Please enter a phone number');
            return;
        }

        setTesting(true);
        setTestResult(null);
        
        try {
            const { data } = await base44.functions.invoke('sendSinchSMS', {
                to: testPhone,
                message: 'Test message from REACH Church Connect. If you received this, SMS is working! 🎉'
            });
            
            setTestResult({
                success: true,
                message: 'Test SMS sent successfully!',
                details: data
            });
            
            // Reload messages
            setTimeout(() => loadRecentMessages(), 2000);
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Failed to send test SMS',
                error: error.message
            });
        } finally {
            setTesting(false);
        }
    };

    const copyWebhookURL = () => {
        navigator.clipboard.writeText(healthStatus.webhook_url);
        alert('Webhook URL copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-3 text-slate-600">Running diagnostics...</span>
                    </div>
                </div>
            </div>
        );
    }

    const allConfigured = healthStatus?.all_configured;
    const envVars = healthStatus?.environment_variables || {};

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">SMS Health Check</h1>
                        <p className="text-slate-600 mt-1">Comprehensive SMS system diagnostics</p>
                    </div>
                    <Button onClick={runHealthCheck} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Overall Status */}
                <Card className={`border-2 ${allConfigured ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            {allConfigured ? (
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            ) : (
                                <XCircle className="w-8 h-8 text-red-600" />
                            )}
                            <div>
                                <h2 className="text-xl font-bold">
                                    {allConfigured ? 'SMS System is Configured ✅' : 'SMS System Needs Configuration ❌'}
                                </h2>
                                <p className="text-sm text-slate-600">
                                    {allConfigured ? 'All environment variables are set' : 'Missing required environment variables'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Environment Variables */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Environment Variables</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.entries(envVars).map(([key, value]) => {
                            const isSet = value.includes('✅');
                            return (
                                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <code className="text-sm font-mono">{key}</code>
                                    <Badge variant={isSet ? 'default' : 'destructive'}>
                                        {value}
                                    </Badge>
                                </div>
                            );
                        })}
                        {!allConfigured && (
                            <Alert className="border-yellow-300 bg-yellow-50">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-900">
                                    <strong>Action Required:</strong> Go to Dashboard → Code → Environment Variables and add the missing variables. Then click "Save & Deploy".
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Webhook Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>2. Webhook URL Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-slate-700">
                            This URL must be configured in your Sinch Dashboard under your phone number's webhook settings.
                        </p>
                        <div className="p-3 bg-slate-900 rounded-lg">
                            <code className="text-xs text-green-400 break-all block">
                                {healthStatus?.webhook_url}
                            </code>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={copyWebhookURL} variant="outline" size="sm">
                                <Copy className="w-4 h-4 mr-2" />
                                Copy URL
                            </Button>
                            <Button
                                onClick={() => window.open('https://dashboard.sinch.com', '_blank')}
                                variant="outline"
                                size="sm"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Sinch Dashboard
                            </Button>
                        </div>
                        <Alert className="border-blue-300 bg-blue-50">
                            <AlertDescription className="text-blue-900 text-sm">
                                <strong>How to configure:</strong> In Sinch Dashboard → Numbers → Click your number → Webhooks → Set "Inbound SMS URL" to the URL above
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Keywords */}
                <Card>
                    <CardHeader>
                        <CardTitle>3. SMS Keywords</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {healthStatus?.keywords?.active > 0 ? (
                            <>
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                    <span className="font-semibold text-green-900">Active Keywords</span>
                                    <Badge className="bg-green-600">{healthStatus.keywords.active}</Badge>
                                </div>
                                <div className="space-y-2">
                                    {healthStatus.keywords.list.map((keyword, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                            <div className="flex items-center gap-3">
                                                <code className="font-mono font-bold text-blue-600">{keyword.keyword}</code>
                                                <span className="text-xs text-slate-500">{keyword.response_type}</span>
                                            </div>
                                            {keyword.has_link && (
                                                <Badge variant="outline" className="text-xs">Has Link</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <Alert className="border-yellow-300 bg-yellow-50">
                                <AlertDescription className="text-yellow-900">
                                    No active keywords found. <Link to={createPageUrl('TextMessaging')} className="underline font-semibold">Create keywords</Link> to enable SMS responses.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Test SMS Sending */}
                <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50">
                        <CardTitle>4. Send Test SMS</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex gap-3">
                            <Input
                                placeholder="+1234567890"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={sendTestSMS}
                                disabled={testing || !testPhone}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {testing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Send Test
                                    </>
                                )}
                            </Button>
                        </div>
                        
                        {testResult && (
                            <Alert className={testResult.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
                                <AlertDescription className={testResult.success ? 'text-green-900' : 'text-red-900'}>
                                    <strong>{testResult.message}</strong>
                                    {testResult.error && <p className="text-sm mt-1">{testResult.error}</p>}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Messages */}
                <Card>
                    <CardHeader>
                        <CardTitle>5. Recent Message Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentMessages.length > 0 ? (
                            <div className="space-y-2">
                                {recentMessages.map((msg, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={msg.direction === 'inbound' ? 'default' : 'secondary'}>
                                                    {msg.direction}
                                                </Badge>
                                                <span className="text-xs text-slate-500">{msg.phone_number}</span>
                                            </div>
                                            <Badge
                                                variant={msg.status === 'sent' ? 'default' : msg.status === 'failed' ? 'destructive' : 'outline'}
                                            >
                                                {msg.status}
                                            </Badge>
                                        </div>
                                        {msg.keyword_triggered && (
                                            <div className="text-xs text-blue-600 font-mono mb-1">
                                                Keyword: {msg.keyword_triggered}
                                            </div>
                                        )}
                                        <p className="text-sm text-slate-700 truncate">{msg.message_body}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(msg.created_date).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-8">No messages yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Instructions */}
                {healthStatus?.instructions && (
                    <Card className="border-purple-200">
                        <CardHeader className="bg-purple-50">
                            <CardTitle>Next Steps</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ol className="space-y-2">
                                {healthStatus.instructions.map((instruction, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm text-slate-700 pt-0.5">{instruction}</span>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Links */}
                <div className="flex gap-3 justify-center pt-4">
                    <Link to={createPageUrl('TextMessaging')}>
                        <Button variant="outline">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Text Messaging
                        </Button>
                    </Link>
                    <Link to={createPageUrl('Settings')}>
                        <Button variant="outline">
                            Settings
                        </Button>
                    </Link>
                    <Link to={createPageUrl('SinchSetupGuide')}>
                        <Button variant="outline">
                            Setup Guide
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}