import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, MessageSquare, Webhook, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';

export default function SignalhouseSetup() {
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Hello! This is a test message from REACH Church Connect.');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('sms');

    const webhookUrl = `https://reachchurchms.com/api/functions/handleSignalhouseWebhook`;

    const handleTestSMS = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await base44.functions.invoke('sendSignalhouseSMS', {
                to: testPhone,
                message: testMessage
            });

            if (response.data?.success) {
                setResult({
                    type: 'success',
                    message: 'SMS sent successfully!',
                    data: response.data
                });
            } else {
                throw new Error(response.data?.error || 'Failed to send SMS');
            }
        } catch (err) {
            setError(err.message || 'Failed to send SMS');
        } finally {
            setLoading(false);
        }
    };

    const handleTestCall = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await base44.functions.invoke('makeSignalhouseCall', {
                to: testPhone,
                message: testMessage
            });

            if (response.data?.success) {
                setResult({
                    type: 'success',
                    message: 'Call initiated successfully!',
                    data: response.data
                });
            } else {
                throw new Error(response.data?.error || 'Failed to make call');
            }
        } catch (err) {
            setError(err.message || 'Failed to make call');
        } finally {
            setLoading(false);
        }
    };

    const copyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        alert('Webhook URL copied to clipboard!');
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Signalhouse Integration</h1>
                <p className="text-slate-600 mt-2">Test and configure Signalhouse SMS and voice capabilities</p>
            </div>

            {/* Setup Instructions */}
            <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-slate-900">
                    <strong>Setup Required:</strong> To use Signalhouse, you need to set these environment variables in Settings:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li><code className="bg-slate-200 px-2 py-1 rounded">SIGNALHOUSE_API_KEY</code> - Your Signalhouse API key</li>
                        <li><code className="bg-slate-200 px-2 py-1 rounded">SIGNALHOUSE_SERVICE_ID</code> - Your service ID (optional)</li>
                        <li><code className="bg-slate-200 px-2 py-1 rounded">SIGNALHOUSE_PHONE_NUMBER</code> - Your Signalhouse phone number</li>
                    </ul>
                </AlertDescription>
            </Alert>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('sms')}
                    className={`px-6 py-3 font-semibold transition-colors ${
                        activeTab === 'sms'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <MessageSquare className="w-5 h-5 inline mr-2" />
                    SMS Testing
                </button>
                <button
                    onClick={() => setActiveTab('voice')}
                    className={`px-6 py-3 font-semibold transition-colors ${
                        activeTab === 'voice'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Phone className="w-5 h-5 inline mr-2" />
                    Voice Testing
                </button>
                <button
                    onClick={() => setActiveTab('webhooks')}
                    className={`px-6 py-3 font-semibold transition-colors ${
                        activeTab === 'webhooks'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Webhook className="w-5 h-5 inline mr-2" />
                    Webhooks
                </button>
            </div>

            {/* SMS Testing Tab */}
            {activeTab === 'sms' && (
                <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6" />
                            Test SMS Sending
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <Label>Recipient Phone Number</Label>
                            <Input
                                type="tel"
                                placeholder="+15551234567"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                className="mt-2"
                            />
                            <p className="text-xs text-slate-500 mt-1">Use E.164 format: +1 for US, +44 for UK, etc.</p>
                        </div>

                        <div>
                            <Label>Message</Label>
                            <Textarea
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                className="mt-2"
                                rows={4}
                                placeholder="Your test message..."
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                {testMessage.length} characters
                            </p>
                        </div>

                        <Button
                            onClick={handleTestSMS}
                            disabled={loading || !testPhone || !testMessage}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Send Test SMS
                                </>
                            )}
                        </Button>

                        {result && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <AlertDescription className="text-green-900">
                                    <strong>{result.message}</strong>
                                    {result.data?.messageId && (
                                        <p className="text-sm mt-1">Message ID: {result.data.messageId}</p>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {error && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <AlertDescription className="text-red-900">
                                    <strong>Error:</strong> {error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Voice Testing Tab */}
            {activeTab === 'voice' && (
                <Card>
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-6 h-6" />
                            Test Voice Call
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <Label>Recipient Phone Number</Label>
                            <Input
                                type="tel"
                                placeholder="+15551234567"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label>Voice Message</Label>
                            <Textarea
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                className="mt-2"
                                rows={4}
                                placeholder="This will be read aloud..."
                            />
                        </div>

                        <Button
                            onClick={handleTestCall}
                            disabled={loading || !testPhone || !testMessage}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Calling...
                                </>
                            ) : (
                                <>
                                    <Phone className="w-4 h-4 mr-2" />
                                    Make Test Call
                                </>
                            )}
                        </Button>

                        {result && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <AlertDescription className="text-green-900">
                                    <strong>{result.message}</strong>
                                    {result.data?.callId && (
                                        <p className="text-sm mt-1">Call ID: {result.data.callId}</p>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {error && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <AlertDescription className="text-red-900">
                                    <strong>Error:</strong> {error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
                <Card>
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardTitle className="flex items-center gap-2">
                            <Webhook className="w-6 h-6" />
                            Webhook Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div>
                            <Label>Webhook URL</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={webhookUrl}
                                    readOnly
                                    className="flex-1 font-mono text-sm"
                                />
                                <Button onClick={copyWebhookUrl} variant="outline">
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Add this URL to your Signalhouse dashboard to receive webhook events
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-900 mb-3">Supported Events</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">sms.received</Badge>
                                    <span className="text-slate-600">Incoming SMS messages</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">sms.delivered</Badge>
                                    <span className="text-slate-600">SMS delivery confirmation</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">call.initiated</Badge>
                                    <span className="text-slate-600">Call started</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">call.completed</Badge>
                                    <span className="text-slate-600">Call finished</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">voice.received</Badge>
                                    <span className="text-slate-600">Incoming voice call</span>
                                </div>
                            </div>
                        </div>

                        <Alert className="border-blue-200 bg-blue-50">
                            <AlertDescription>
                                <strong>Setup Instructions:</strong>
                                <ol className="list-decimal ml-6 mt-2 space-y-1 text-sm">
                                    <li>Copy the webhook URL above</li>
                                    <li>Go to your Signalhouse dashboard</li>
                                    <li>Navigate to Webhooks settings</li>
                                    <li>Add the webhook URL and select events to monitor</li>
                                    <li>Save and test the webhook connection</li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* API Documentation Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Integration Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Send SMS from code:</h3>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`const response = await base44.functions.invoke('sendSignalhouseSMS', {
  to: '+15551234567',
  message: 'Your message here'
});`}
                        </pre>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Make voice call from code:</h3>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`const response = await base44.functions.invoke('makeSignalhouseCall', {
  to: '+15551234567',
  message: 'This will be read aloud'
});`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}