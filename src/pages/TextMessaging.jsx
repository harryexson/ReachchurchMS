import React, { useState, useEffect } from "react";
import { TextKeyword } from "@/entities/TextKeyword";
import { TextSubscriber } from "@/entities/TextSubscriber";
import { TextMessage } from "@/entities/TextMessage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, TrendingUp, Plus, Send, DollarSign, CheckCircle, TestTube, Loader2, AlertCircle, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import KeywordForm from "../components/texting/KeywordForm";
import BroadcastForm from "../components/texting/BroadcastForm";
import ComplianceHelper from "../components/texting/ComplianceHelper";
import FeatureGate from "../components/subscription/FeatureGate";
import { useSubscription } from "../components/subscription/useSubscription";

export default function TextMessagingPage() {
    const [keywords, setKeywords] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isKeywordFormOpen, setIsKeywordFormOpen] = useState(false);
    const [isBroadcastFormOpen, setIsBroadcastFormOpen] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState(null);
    const { canUseSMS, hasFeature, loading: subscriptionLoading } = useSubscription();
    
    // Test SMS State
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Hello from REACH Church Connect! This is a test message.');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [smsSetupStatus, setSmsSetupStatus] = useState(null);
    const [isCheckingSetup, setIsCheckingSetup] = useState(false);
    
    // Sinch Test State
    const [sinchTestPhone, setSinchTestPhone] = useState('');
    const [sinchTestMessage, setSinchTestMessage] = useState('Hello from REACH Church Connect! This is a Sinch test message.');
    const [isSendingSinchTest, setIsSendingSinchTest] = useState(false);
    const [sinchTestResult, setSinchTestResult] = useState(null);
    const [sinchSetupStatus, setSinchSetupStatus] = useState(null);
    const [isCheckingSinchSetup, setIsCheckingSinchSetup] = useState(false);

    useEffect(() => {
        loadData();
        checkSMSSetup();
        checkSinchSetup();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [keywordList, subscriberList, messageList] = await Promise.all([
            TextKeyword.list("-created_date"),
            TextSubscriber.filter({ status: "active" }),
            TextMessage.list("-created_date", 50)
        ]);
        setKeywords(keywordList);
        setSubscribers(subscriberList);
        setMessages(messageList);
        setIsLoading(false);
    };

    const handleKeywordSubmit = async (data) => {
        if (selectedKeyword) {
            await TextKeyword.update(selectedKeyword.id, data);
        } else {
            await TextKeyword.create(data);
        }
        await loadData();
        setIsKeywordFormOpen(false);
        setSelectedKeyword(null);
    };

    const totalMessages = messages.length;
    const deliveryRate = messages.length > 0
        ? Math.round((messages.filter(m => m.status === 'delivered' || m.status === 'sent').length / totalMessages) * 100)
        : 0;

    const checkSMSSetup = async () => {
        setIsCheckingSetup(true);
        try {
            const response = await base44.functions.invoke('testSignalhouseSetup');
            setSmsSetupStatus(response.data || response);
        } catch (error) {
            console.error('Error checking SignalHouse setup:', error);
            setSmsSetupStatus({ error: error.message });
        }
        setIsCheckingSetup(false);
    };

    const sendTestSMS = async () => {
        if (!testPhone) {
            setTestResult({ success: false, error: 'Please enter a phone number' });
            return;
        }
        
        setIsSendingTest(true);
        setTestResult(null);
        
        try {
            const response = await base44.functions.invoke('sendSignalhouseSMS', {
                to: testPhone,
                message: testMessage
            });
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            const data = response.data || response;
            setTestResult(data);
            
            if (data.success) {
                // Reload messages to show the test
                await loadData();
            }
        } catch (error) {
            console.error('Test SMS error:', error);
            setTestResult({ 
                success: false, 
                error: error.response?.data?.error || error.message || 'Failed to send test SMS'
            });
        }
        
        setIsSendingTest(false);
    };

    const checkSinchSetup = async () => {
        setIsCheckingSinchSetup(true);
        try {
            const response = await base44.functions.invoke('testSinchSetup');
            setSinchSetupStatus(response.data || response);
        } catch (error) {
            console.error('Error checking Sinch setup:', error);
            setSinchSetupStatus({ error: error.message });
        }
        setIsCheckingSinchSetup(false);
    };

    const sendSinchTestSMS = async () => {
        if (!sinchTestPhone) {
            setSinchTestResult({ success: false, error: 'Please enter a phone number' });
            return;
        }
        
        setIsSendingSinchTest(true);
        setSinchTestResult(null);
        
        try {
            const response = await base44.functions.invoke('sendSinchSMS', {
                to: sinchTestPhone,
                message: sinchTestMessage
            });
            
            const data = response.data || response;
            setSinchTestResult(data);
            
            if (data.success) {
                await loadData();
            }
        } catch (error) {
            console.error('Sinch test SMS error:', error);
            setSinchTestResult({ 
                success: false, 
                error: error.response?.data?.error || error.message || 'Failed to send Sinch test SMS'
            });
        }
        
        setIsSendingSinchTest(false);
    };

    return (
        <FeatureGate 
            feature="signalhouse_messaging_enabled"
            featureName="SignalHouse Messaging (SMS/MMS/RCS/Video)"
            requiredPlan="Growth"
        >
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">SignalHouse Messaging System</h1>
                            <p className="text-slate-600 mt-1">Engage your congregation through automated text, multimedia, and rich messages</p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => setIsBroadcastFormOpen(true)} variant="outline">
                                <Send className="w-5 h-5 mr-2" />
                                Send Broadcast (SMS/MMS/RCS)
                            </Button>
                            <Button onClick={() => { setSelectedKeyword(null); setIsKeywordFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Keyword
                            </Button>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-green-900 mb-3">💡 Instant Giving via SMS</h3>
                        <p className="text-green-800 mb-4">
                            Enable instant donations with SMS keywords! People can text "GIVE" and receive a secure donation link - no app sign-up required.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-white p-4 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-900">1. Create "GIVE" Keyword</span>
                                </div>
                                <p className="text-slate-600">Set up a keyword that sends your giving link</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-900">2. People Text "GIVE"</span>
                                </div>
                                <p className="text-slate-600">They instantly receive a secure donation link</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold text-green-900">3. Donate in Seconds</span>
                                </div>
                                <p className="text-slate-600">No sign-up needed - give and done!</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => { setSelectedKeyword(null); setIsKeywordFormOpen(true); }}
                            className="mt-4 bg-green-600 hover:bg-green-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create "GIVE" Keyword Now
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Active Keywords</p>
                                        <p className="text-2xl font-bold text-slate-900">{keywords.filter(k => k.is_active).length}</p>
                                    </div>
                                    <MessageSquare className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Total Subscribers</p>
                                        <p className="text-2xl font-bold text-slate-900">{subscribers.length}</p>
                                    </div>
                                    <Users className="w-8 h-8 text-green-500" />
                            </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Delivery Rate</p>
                                        <p className="text-2xl font-bold text-slate-900">{deliveryRate}%</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="compliance" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="compliance">Compliance</TabsTrigger>
                            <TabsTrigger value="test">Test SignalHouse</TabsTrigger>
                            <TabsTrigger value="sinchtest">Test Sinch</TabsTrigger>
                            <TabsTrigger value="keywords">Keywords</TabsTrigger>
                            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                            <TabsTrigger value="messages">Message History</TabsTrigger>
                            <TabsTrigger value="setup">SignalHouse Setup</TabsTrigger>
                        </TabsList>

                        <TabsContent value="compliance">
                            <ComplianceHelper />
                        </TabsContent>

                        {/* Test SignalHouse SMS Tab */}
                        <TabsContent value="test">
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* SMS Setup Status */}
                                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TestTube className="w-5 h-5 text-purple-600" />
                                            SignalHouse Configuration Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isCheckingSetup ? (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Checking configuration...
                                            </div>
                                        ) : smsSetupStatus ? (
                                            <div className="space-y-3">
                                                {smsSetupStatus.error ? (
                                                    <Alert className="border-red-200 bg-red-50">
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                        <AlertTitle className="text-red-900">Configuration Error</AlertTitle>
                                                        <AlertDescription className="text-red-700">{smsSetupStatus.error}</AlertDescription>
                                                    </Alert>
                                                ) : (
                                                    <>
                                                        <div className="p-3 bg-slate-50 rounded-lg">
                                                            <h4 className="font-semibold text-slate-900 mb-2">Environment Variables</h4>
                                                            <div className="space-y-1 text-sm">
                                                                {Object.entries(smsSetupStatus.environment_variables || {}).map(([key, value]) => (
                                                                    <div key={key} className="flex justify-between">
                                                                        <span className="text-slate-600">{key}:</span>
                                                                        <span className={value.includes('✅') ? 'text-green-600' : 'text-red-600'}>{value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        
                                                        {smsSetupStatus.all_configured ? (
                                                            <Alert className="border-green-200 bg-green-50">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                <AlertTitle className="text-green-900">SignalHouse Ready!</AlertTitle>
                                                                <AlertDescription className="text-green-700">
                                                                    All environment variables are configured. You can send test messages.
                                                                </AlertDescription>
                                                            </Alert>
                                                        ) : (
                                                            <Alert className="border-orange-200 bg-orange-50">
                                                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                                                <AlertTitle className="text-orange-900">Setup Incomplete</AlertTitle>
                                                                <AlertDescription className="text-orange-700">
                                                                    {smsSetupStatus.instructions?.map((inst, i) => (
                                                                        <div key={i}>{inst}</div>
                                                                    ))}
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}

                                                        <div className="p-3 bg-blue-50 rounded-lg">
                                                            <h4 className="font-semibold text-blue-900 mb-2">Keywords Status</h4>
                                                            <p className="text-sm text-blue-800">
                                                                {smsSetupStatus.keywords?.active || 0} active keywords configured
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : null}
                                        
                                        <Button 
                                            onClick={checkSMSSetup} 
                                            variant="outline" 
                                            disabled={isCheckingSetup}
                                            className="w-full"
                                        >
                                            {isCheckingSetup ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                                            Refresh Status
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Send Test Message */}
                                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Send className="w-5 h-5 text-green-600" />
                                            Send Test Message
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="testPhone">Phone Number</Label>
                                            <div className="relative mt-1">
                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <Input
                                                    id="testPhone"
                                                    value={testPhone}
                                                    onChange={(e) => setTestPhone(e.target.value)}
                                                    placeholder="+1 (555) 123-4567"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">Enter your phone number to receive a test message</p>
                                        </div>

                                        <div>
                                            <Label htmlFor="testMessage">Message</Label>
                                            <Input
                                                id="testMessage"
                                                value={testMessage}
                                                onChange={(e) => setTestMessage(e.target.value)}
                                                placeholder="Your test message..."
                                                className="mt-1"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">TCPA disclaimer will be auto-appended</p>
                                        </div>

                                        <Button 
                                            onClick={sendTestSMS}
                                            disabled={isSendingTest || !testPhone}
                                            className="w-full bg-green-600 hover:bg-green-700"
                                        >
                                            {isSendingTest ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Send Test Message
                                                </>
                                            )}
                                        </Button>

                                        {testResult && (
                                            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                                                {testResult.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                                )}
                                                <AlertTitle className={testResult.success ? "text-green-900" : "text-red-900"}>
                                                    {testResult.success ? "Message Sent Successfully!" : "Failed to Send Message"}
                                                </AlertTitle>
                                                <AlertDescription className={testResult.success ? "text-green-700" : "text-red-700"}>
                                                    {testResult.success ? (
                                                        <div className="space-y-1">
                                                            <div>Message ID: {testResult.message_id}</div>
                                                            <div>Sent to: {testResult.to}</div>
                                                            <div className="text-xs mt-2 text-yellow-700 bg-yellow-50 p-2 rounded">
                                                                ⚠️ <strong>Note:</strong> Ensure your number is active in your SignalHouse dashboard at <a href="https://signalhouse.io/dashboard" target="_blank" rel="noopener noreferrer" className="underline">signalhouse.io/dashboard</a>.
                                                            </div>
                                                            {testResult.data && (
                                                                <details className="mt-2">
                                                                    <summary className="text-xs cursor-pointer text-slate-600">View SignalHouse Response</summary>
                                                                    <pre className="text-xs mt-1 p-2 bg-slate-100 rounded overflow-x-auto">
                                                                        {JSON.stringify(testResult.data, null, 2)}
                                                                    </pre>
                                                                </details>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <div>{testResult.error}</div>
                                                            {testResult.details && (
                                                                <pre className="text-xs mt-2 p-2 bg-red-100 rounded overflow-x-auto">
                                                                    {JSON.stringify(testResult.details, null, 2)}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <h4 className="font-semibold text-yellow-900 text-sm mb-2">💡 Tips</h4>
                                            <ul className="text-xs text-yellow-800 space-y-1">
                                                <li>• Ensure SignalHouse is configured with API Key, Account ID, and Phone Number</li>
                                                <li>• Use your own phone number for testing</li>
                                                <li>• Check Message History tab after sending</li>
                                                <li>• Verify your phone number and account status in SignalHouse dashboard</li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Test Sinch SMS Tab */}
                        <TabsContent value="sinchtest">
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Sinch Setup Status */}
                                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TestTube className="w-5 h-5 text-blue-600" />
                                            Sinch Configuration Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isCheckingSinchSetup ? (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Checking Sinch configuration...
                                            </div>
                                        ) : sinchSetupStatus ? (
                                            <div className="space-y-3">
                                                {sinchSetupStatus.error ? (
                                                    <Alert className="border-red-200 bg-red-50">
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                        <AlertTitle className="text-red-900">Configuration Error</AlertTitle>
                                                        <AlertDescription className="text-red-700">{sinchSetupStatus.error}</AlertDescription>
                                                    </Alert>
                                                ) : (
                                                    <>
                                                        <div className="p-3 bg-slate-50 rounded-lg">
                                                            <h4 className="font-semibold text-slate-900 mb-2">Sinch Credentials</h4>
                                                            <div className="space-y-1 text-sm">
                                                                {Object.entries(sinchSetupStatus.environment_variables || {}).map(([key, value]) => (
                                                                    <div key={key} className="flex justify-between">
                                                                        <span className="text-slate-600">{key}:</span>
                                                                        <span className={value.includes('✅') ? 'text-green-600' : 'text-red-600'}>{value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        
                                                        {sinchSetupStatus.all_configured ? (
                                                            <Alert className="border-green-200 bg-green-50">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                <AlertTitle className="text-green-900">Sinch Ready!</AlertTitle>
                                                                <AlertDescription className="text-green-700">
                                                                    All Sinch credentials are configured. You can send test messages.
                                                                </AlertDescription>
                                                            </Alert>
                                                        ) : (
                                                            <Alert className="border-orange-200 bg-orange-50">
                                                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                                                <AlertTitle className="text-orange-900">Sinch Setup Incomplete</AlertTitle>
                                                                <AlertDescription className="text-orange-700">
                                                                    Please set SINCH_SERVICE_PLAN_ID, SINCH_API_TOKEN, and SINCH_PHONE_NUMBER environment variables.
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : null}
                                        
                                        <Button 
                                            onClick={checkSinchSetup} 
                                            variant="outline" 
                                            disabled={isCheckingSinchSetup}
                                            className="w-full"
                                        >
                                            {isCheckingSinchSetup ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                                            Refresh Sinch Status
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Send Sinch Test Message */}
                                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Send className="w-5 h-5 text-blue-600" />
                                            Send Sinch Test Message
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="sinchTestPhone">Phone Number</Label>
                                            <div className="relative mt-1">
                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <Input
                                                    id="sinchTestPhone"
                                                    value={sinchTestPhone}
                                                    onChange={(e) => setSinchTestPhone(e.target.value)}
                                                    placeholder="+1 (555) 123-4567"
                                                    className="pl-10"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">Enter your phone number to receive a Sinch test message</p>
                                        </div>

                                        <div>
                                            <Label htmlFor="sinchTestMessage">Message</Label>
                                            <Input
                                                id="sinchTestMessage"
                                                value={sinchTestMessage}
                                                onChange={(e) => setSinchTestMessage(e.target.value)}
                                                placeholder="Your test message..."
                                                className="mt-1"
                                            />
                                        </div>

                                        <Button 
                                            onClick={sendSinchTestSMS}
                                            disabled={isSendingSinchTest || !sinchTestPhone}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isSendingSinchTest ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Sending via Sinch...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Send Sinch Test
                                                </>
                                            )}
                                        </Button>

                                        {sinchTestResult && (
                                            <Alert className={sinchTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                                                {sinchTestResult.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                                )}
                                                <AlertTitle className={sinchTestResult.success ? "text-green-900" : "text-red-900"}>
                                                    {sinchTestResult.success ? "Sinch Message Sent!" : "Failed to Send via Sinch"}
                                                </AlertTitle>
                                                <AlertDescription className={sinchTestResult.success ? "text-green-700" : "text-red-700"}>
                                                    {sinchTestResult.success ? (
                                                        <div className="space-y-1">
                                                            <div>Message sent to: {sinchTestResult.to}</div>
                                                            {sinchTestResult.message_id && <div>Message ID: {sinchTestResult.message_id}</div>}
                                                            {sinchTestResult.data && (
                                                                <details className="mt-2">
                                                                    <summary className="text-xs cursor-pointer text-slate-600">View Sinch Response</summary>
                                                                    <pre className="text-xs mt-1 p-2 bg-slate-100 rounded overflow-x-auto">
                                                                        {JSON.stringify(sinchTestResult.data, null, 2)}
                                                                    </pre>
                                                                </details>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <div>{sinchTestResult.error}</div>
                                                            {sinchTestResult.details && (
                                                                <pre className="text-xs mt-2 p-2 bg-red-100 rounded overflow-x-auto">
                                                                    {JSON.stringify(sinchTestResult.details, null, 2)}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Sinch Setup Tips</h4>
                                            <ul className="text-xs text-blue-800 space-y-1">
                                                <li>• Configure SINCH_SERVICE_PLAN_ID, SINCH_API_TOKEN, and SINCH_PHONE_NUMBER in environment variables</li>
                                                <li>• Use your own phone number for testing</li>
                                                <li>• Check Message History tab after sending</li>
                                                <li>• Verify credentials at <a href="https://www.sinch.com/" target="_blank" rel="noopener noreferrer" className="underline">sinch.com</a></li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="keywords">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Your Keywords</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {keywords.map(keyword => (
                                            <div key={keyword.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-lg font-bold text-blue-600">{keyword.keyword}</h3>
                                                            <Badge className={keyword.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                                                {keyword.is_active ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-600 mt-1">{keyword.description}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-500">Used {keyword.usage_count || 0} times</p>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded mt-3">
                                                    <p className="text-sm text-slate-700">{keyword.auto_response}</p>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <Button size="sm" variant="outline" onClick={() => { setSelectedKeyword(keyword); setIsKeywordFormOpen(true); }}>
                                                        Edit
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {keywords.length === 0 && (
                                            <div className="text-center py-12 text-slate-500">
                                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                                <p className="text-lg mb-2">No keywords created yet</p>
                                                <p className="text-sm">Create your first keyword to start engaging via messaging</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="subscribers">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Message Subscribers ({subscribers.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {subscribers.map(subscriber => (
                                            <div key={subscriber.id} className="p-4 border rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">{subscriber.name || 'Anonymous'}</p>
                                                        <p className="text-sm text-slate-600">{subscriber.phone_number}</p>
                                                        {subscriber.email && <p className="text-sm text-slate-500">{subscriber.email}</p>}
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <p className="text-slate-500">Opted in: {new Date(subscriber.opt_in_date).toLocaleDateString()}</p>
                                                        <p className="text-slate-500">via {subscriber.opt_in_keyword}</p>
                                                    </div>
                                                </div>
                                                {subscriber.groups && subscriber.groups.length > 0 && (
                                                    <div className="flex gap-2 mt-2">
                                                        {subscriber.groups.map((group, idx) => (
                                                            <Badge key={idx} variant="outline">{group}</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {subscribers.length === 0 && (
                                            <div className="text-center py-12 text-slate-500">
                                                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                                <p>No subscribers yet</p>
                                                <p className="text-sm">Once people text your keywords, they'll appear here</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="messages">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Recent Messages</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {messages.map(message => (
                                            <div key={message.id} className="p-3 border rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={message.direction === 'inbound' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                                                            {message.direction === 'inbound' ? '← Received' : '→ Sent'}
                                                        </Badge>
                                                        <span className="text-sm font-medium">{message.phone_number}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(message.created_date).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-700">{message.message_body}</p>
                                                {message.keyword_triggered && (
                                                    <Badge variant="outline" className="mt-2">Keyword: {message.keyword_triggered}</Badge>
                                                )}
                                            </div>
                                        ))}
                                        {messages.length === 0 && (
                                            <div className="text-center py-12 text-slate-500">
                                                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                                <p>No messages yet</p>
                                                <p className="text-sm">Wait for incoming messages or send a broadcast to see them here</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="setup">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>SignalHouse Setup Guide</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-500">
                                        <h4 className="font-semibold text-red-900 mb-2 text-lg">🚨 CRITICAL: Correct Webhook URL</h4>
                                        <p className="text-sm text-red-800 mb-3 font-semibold">
                                            Make sure you're using the CORRECT webhook URL in SignalHouse Dashboard:
                                        </p>
                                        <div className="bg-white p-4 rounded border-2 border-red-400 mb-3">
                                            <p className="text-xs font-semibold text-red-900 mb-2">✅ CORRECT URL (must end with "handleSignalhouseWebhook"):</p>
                                            <code className="text-xs break-all block text-green-900 font-mono bg-green-50 p-2 rounded">
                                                https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleSignalhouseWebhook
                                            </code>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="mt-2 text-xs bg-green-600 hover:bg-green-700"
                                                onClick={() => {
                                                    navigator.clipboard.writeText('https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleSignalhouseWebhook');
                                                    alert('✅ Correct webhook URL copied to clipboard!');
                                                }}
                                            >
                                                📋 Copy Correct URL
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <h4 className="font-semibold text-yellow-900 mb-2">📌 Quick Start Checklist</h4>
                                        <ol className="text-sm text-yellow-800 space-y-2 list-decimal ml-4">
                                            <li>Get your SignalHouse API Key, Account ID, and Phone Number from <a href="https://signalhouse.io/dashboard" target="_blank" rel="noopener noreferrer" className="underline">signalhouse.io/dashboard</a></li>
                                            <li><strong className="text-red-700">CRITICAL:</strong> Go to Dashboard → Code → Environment Variables and add:
                                                <ul className="list-disc ml-5 mt-1">
                                                    <li><code className="bg-yellow-100 px-1">SIGNALHOUSE_API_KEY</code></li>
                                                    <li><code className="bg-yellow-100 px-1">SIGNALHOUSE_ACCOUNT_ID</code></li>
                                                    <li><code className="bg-yellow-100 px-1">SIGNALHOUSE_PHONE_NUMBER</code></li>
                                                </ul>
                                            </li>
                                            <li><strong className="text-red-700">Update webhook URL</strong> in SignalHouse dashboard to the CORRECT URL above</li>
                                            <li>Create your first keyword on this page</li>
                                            <li>Text the keyword to your number to test!</li>
                                        </ol>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 1: Get SignalHouse Account</h3>
                                        <p className="text-sm text-slate-600 mb-2">Sign up for a SignalHouse account at <a href="https://signalhouse.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">signalhouse.io</a></p>
                                        <p className="text-sm text-slate-600">SignalHouse offers powerful messaging capabilities including SMS, MMS, RCS, and Video messaging.</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 2: Get Credentials</h3>
                                        <ul className="text-sm text-slate-600 list-disc ml-6 space-y-1">
                                            <li>Go to your SignalHouse dashboard → API Keys → Generate an API Key</li>
                                            <li>Go to your SignalHouse dashboard → Settings → Copy your Account ID</li>
                                            <li>Go to your SignalHouse dashboard → Numbers → Configure a phone number (e.g., +15551234567)</li>
                                        </ul>
                                    </div>

                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <h3 className="font-semibold text-red-900 mb-2">Step 3: Set Environment Variables (REQUIRED!)</h3>
                                        <p className="text-sm text-red-800 mb-2">This is THE MOST IMPORTANT STEP:</p>
                                        <ol className="text-sm text-red-800 list-decimal ml-6 space-y-1 mb-3">
                                            <li>Go to <strong>Dashboard → Code → Environment Variables</strong></li>
                                            <li>Click "Add Variable"</li>
                                            <li>Add <code className="bg-red-100 px-2 py-1">SIGNALHOUSE_API_KEY</code> with your API Key</li>
                                            <li>Add <code className="bg-red-100 px-2 py-1">SIGNALHOUSE_ACCOUNT_ID</code> with your Account ID</li>
                                            <li>Add <code className="bg-red-100 px-2 py-1">SIGNALHOUSE_PHONE_NUMBER</code> with your phone (e.g., +15551234567)</li>
                                            <li>Click <strong>"Save & Deploy"</strong></li>
                                        </ol>
                                        <p className="text-xs text-red-700 font-semibold">
                                            ⚠️ Keywords and messaging will NOT work without this step! SignalHouse webhooks come from external servers and need environment variables.
                                        </p>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-500">
                                        <h3 className="font-semibold text-purple-900 mb-2 text-lg">Step 4: Update Webhook in SignalHouse Dashboard</h3>
                                        <p className="text-sm text-purple-800 mb-2">In SignalHouse Dashboard:</p>
                                        <ol className="text-sm text-purple-800 list-decimal ml-6 space-y-1 mb-3">
                                            <li>Go to <strong>Numbers</strong> → Click your phone number</li>
                                            <li>Go to <strong>Webhooks</strong> or <strong>Messaging Configuration</strong></li>
                                            <li><strong className="text-red-700">Delete any old webhook URLs if present</strong></li>
                                            <li>Set <strong>Inbound Messaging Webhook URL</strong> to the CORRECT URL below:</li>
                                        </ol>
                                        <div className="bg-white p-3 rounded border-2 border-purple-400">
                                            <p className="text-xs font-semibold text-purple-900 mb-1">✅ Use this webhook URL:</p>
                                            <code className="text-xs font-mono break-all block text-purple-900 bg-purple-50 p-2 rounded">
                                                https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleSignalhouseWebhook
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 text-xs border-purple-400 text-purple-900 hover:bg-purple-100"
                                                onClick={() => {
                                                    navigator.clipboard.writeText('https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleSignalhouseWebhook');
                                                    alert('✅ Webhook URL copied! Now paste it in SignalHouse Dashboard.');
                                                }}
                                            >
                                                📋 Copy Webhook URL
                                            </Button>
                                        </div>
                                        <p className="text-xs text-purple-700 mt-2 font-semibold">
                                        ⚠️ URL MUST end with <code className="bg-purple-100 px-1">handleSignalhouseWebhook</code>
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 5: Create Your First Keyword</h3>
                                        <p className="text-sm text-slate-600">Click "Create Keyword" button above and set up your first keyword (e.g., TEST, CONNECT, INFO)</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 6: Test It!</h3>
                                        <ol className="text-sm text-slate-600 list-decimal ml-6 space-y-1">
                                            <li>Text your keyword to your SignalHouse phone number</li>
                                            <li>You should receive an automatic response</li>
                                            <li>Check the "Message History" tab to see logs</li>
                                            <li>If no response, check Dashboard → Code → Functions → handleSignalhouseWebhook for error logs</li>
                                        </ol>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-blue-900 mb-2">🐛 Troubleshooting</h4>
                                        <ul className="text-sm text-blue-800 space-y-2">
                                            <li><strong>Not receiving responses?</strong>
                                                <ol className="list-decimal ml-6 mt-1 space-y-1">
                                                    <li>Double-check environment variables are set (Dashboard → Code → Environment Variables)</li>
                                                    <li>Verify webhook URL is the CORRECT one with "handleSignalhouseWebhook" at the end</li>
                                                    <li>Check Dashboard → Code → Functions → handleSignalhouseWebhook for logs</li>
                                                    <li>Make sure keyword is marked as "Active"</li>
                                                </ol>
                                            </li>
                                            <li><strong>Keyword not working?</strong>
                                                <ol className="list-decimal ml-6 mt-1 space-y-1">
                                                    <li>Ensure keyword is marked as "Active"</li>
                                                    <li>Keywords must be ALL CAPS when created</li>
                                                    <li>Check Message History tab for any error logs</li>
                                                    <li>Verify your SignalHouse account and phone number status</li>
                                                </ol>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                                        <strong>💰 SignalHouse Pricing:</strong>
                                        <div className="mt-2 space-y-1">
                                            <p>• Competitive pricing for SMS, MMS, RCS, and Video messaging</p>
                                            <p>• Pay-as-you-go, scalable to your needs</p>
                                            <p>• Visit <a href="https://signalhouse.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">signalhouse.io</a> for pricing details</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {isKeywordFormOpen && (
                        <KeywordForm
                            isOpen={isKeywordFormOpen}
                            setIsOpen={setIsKeywordFormOpen}
                            onSubmit={handleKeywordSubmit}
                            keyword={selectedKeyword}
                        />
                    )}

                    {isBroadcastFormOpen && (
                        <BroadcastForm
                            isOpen={isBroadcastFormOpen}
                            setIsOpen={setIsBroadcastFormOpen}
                            onComplete={loadData}
                        />
                    )}
                </div>
            </div>
        </FeatureGate>
    );
}