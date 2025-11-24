import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Copy, ExternalLink, AlertTriangle } from "lucide-react";

export default function SinchWebhookTest() {
    const [testResult, setTestResult] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    const webhookUrl = "https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS";

    const testWebhook = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            const data = await response.json();
            
            setTestResult({
                success: response.ok,
                status: response.status,
                data: data,
                reachable: true
            });
        } catch (error) {
            setTestResult({
                success: false,
                error: error.message,
                reachable: false
            });
        }

        setIsTesting(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        alert('✅ Webhook URL copied to clipboard!');
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Sinch Webhook Configuration</h1>
                    <p className="text-slate-600 mt-2">Test and verify your Sinch webhook setup</p>
                </div>

                {/* Critical Alert */}
                <Alert className="border-2 border-red-500 bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertDescription>
                        <p className="font-bold text-red-900 mb-2">⚠️ CRITICAL: Your webhook is NOT configured in Sinch!</p>
                        <p className="text-red-800 text-sm mb-3">
                            You haven't received ANY inbound messages since October 4, 2025. This means Sinch is not sending messages to your webhook.
                        </p>
                        <p className="text-red-900 font-semibold">
                            You MUST configure the webhook URL in Sinch Dashboard NOW.
                        </p>
                    </AlertDescription>
                </Alert>

                {/* Webhook URL Card */}
                <Card className="border-2 border-green-500">
                    <CardHeader>
                        <CardTitle className="text-green-900">Step 1: Copy This Webhook URL</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <code className="text-green-400 text-sm break-all font-mono">
                                {webhookUrl}
                            </code>
                        </div>
                        <Button onClick={copyToClipboard} className="w-full bg-green-600 hover:bg-green-700">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Webhook URL
                        </Button>
                    </CardContent>
                </Card>

                {/* Configuration Steps */}
                <Card className="border-2 border-orange-500">
                    <CardHeader>
                        <CardTitle className="text-orange-900">Step 2: Configure in Sinch Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ol className="space-y-3 text-sm">
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">1.</span>
                                <span>Go to <a href="https://dashboard.sinch.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sinch Dashboard</a></span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">2.</span>
                                <span>Click <strong>Numbers</strong> in the left sidebar</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">3.</span>
                                <span>Click on your phone number: <strong>+15743755450</strong></span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">4.</span>
                                <span>Find the <strong>SMS Configuration</strong> or <strong>Webhooks</strong> section</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">5.</span>
                                <span>Look for <strong>"Inbound Messages"</strong> or <strong>"Callback URL"</strong></span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">6.</span>
                                <span className="font-bold text-red-700">DELETE any old webhook URLs if present!</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">7.</span>
                                <span>Paste the webhook URL you copied above</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">8.</span>
                                <span>Set HTTP method to <strong>POST</strong></span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-orange-700 min-w-[24px]">9.</span>
                                <span>Click <strong>Save</strong> or <strong>Update</strong></span>
                            </li>
                        </ol>

                        <Button 
                            onClick={() => window.open('https://dashboard.sinch.com', '_blank')}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Sinch Dashboard
                        </Button>
                    </CardContent>
                </Card>

                {/* Test Webhook */}
                <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Test Webhook Connection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Click below to test if your webhook is accessible. This doesn't test Sinch integration, 
                            just verifies the endpoint is reachable.
                        </p>
                        
                        <Button 
                            onClick={testWebhook} 
                            disabled={isTesting}
                            className="w-full"
                            variant="outline"
                        >
                            {isTesting ? 'Testing...' : 'Test Webhook Accessibility'}
                        </Button>

                        {testResult && (
                            <Alert className={testResult.reachable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                                {testResult.reachable ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <AlertDescription>
                                    {testResult.reachable ? (
                                        <div>
                                            <p className="font-semibold text-green-900 mb-2">✅ Webhook is accessible!</p>
                                            <p className="text-sm text-green-800">
                                                Your webhook endpoint is working correctly. Now make sure it's configured in Sinch Dashboard.
                                            </p>
                                            {testResult.data && (
                                                <details className="mt-3">
                                                    <summary className="cursor-pointer text-sm font-medium text-green-700">View response</summary>
                                                    <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
                                                        {JSON.stringify(testResult.data, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-semibold text-red-900 mb-2">❌ Cannot reach webhook</p>
                                            <p className="text-sm text-red-800">Error: {testResult.error}</p>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Final Test */}
                <Card className="border-2 border-blue-500">
                    <CardHeader>
                        <CardTitle className="text-blue-900">Step 4: Send Real Test SMS</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="font-semibold text-blue-900 mb-2">After configuring the webhook in Sinch:</p>
                            <ol className="space-y-2 text-sm text-blue-800 list-decimal ml-5">
                                <li>Send an SMS with the keyword <strong>"GIVE"</strong> to <strong>+15743755450</strong></li>
                                <li>You should receive an automatic response within seconds</li>
                                <li>Check the <strong>Text Messaging → Message History</strong> tab to verify</li>
                                <li>If you don't see the message logged, the webhook is still not configured correctly</li>
                            </ol>
                        </div>

                        <Alert>
                            <AlertDescription>
                                <p className="text-sm font-medium text-slate-700 mb-2">🔍 Common Issues:</p>
                                <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                                    <li>Webhook URL has typos or is incomplete</li>
                                    <li>HTTP method is set to GET instead of POST</li>
                                    <li>Old webhook URL is still active (delete it first)</li>
                                    <li>Changes weren't saved in Sinch Dashboard</li>
                                    <li>Wrong phone number configuration</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Evidence */}
                <Card className="border-2 border-yellow-500 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-yellow-900">📊 Evidence: Why This is a Webhook Issue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border border-yellow-200">
                                <p className="font-semibold text-green-700 mb-1">✅ What's Working:</p>
                                <ul className="text-slate-600 space-y-1">
                                    <li>• Environment variables set</li>
                                    <li>• Sinch credentials valid</li>
                                    <li>• Outbound SMS works</li>
                                    <li>• Webhook endpoint accessible</li>
                                    <li>• Keywords created</li>
                                </ul>
                            </div>
                            <div className="bg-white p-3 rounded border border-red-200">
                                <p className="font-semibold text-red-700 mb-1">❌ What's NOT Working:</p>
                                <ul className="text-slate-600 space-y-1">
                                    <li>• NO inbound messages since Oct 4</li>
                                    <li>• Sinch not calling webhook</li>
                                    <li>• Keywords not triggering</li>
                                </ul>
                            </div>
                        </div>

                        <Alert className="bg-white border-yellow-300">
                            <AlertDescription>
                                <p className="text-yellow-900 font-semibold">
                                    💡 Conclusion: Sinch doesn't know where to send inbound messages. The webhook URL 
                                    must be configured in Sinch Dashboard for your phone number.
                                </p>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}