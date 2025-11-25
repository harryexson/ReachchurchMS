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
    const { canUseSMS, getSMSRemaining, hasFeature, loading: subscriptionLoading } = useSubscription();
    
    // Test SMS State
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Hello from REACH Church Connect! This is a test message.');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [smsSetupStatus, setSmsSetupStatus] = useState(null);
    const [isCheckingSetup, setIsCheckingSetup] = useState(false);

    useEffect(() => {
        loadData();
        checkSMSSetup();
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
            const response = await base44.functions.invoke('testSinchSetup');
            setSmsSetupStatus(response.data || response);
        } catch (error) {
            console.error('Error checking SMS setup:', error);
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
            const response = await base44.functions.invoke('sendSinchSMS', {
                to: testPhone,
                message: testMessage
            });
            
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

    return (
        <FeatureGate 
            feature="sms_enabled"
            featureName="SMS Text Messaging"
            requiredPlan="Growth"
        >
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">SMS Keyword System</h1>
                            <p className="text-slate-600 mt-1">Engage your congregation through automated text messaging</p>
                            {!subscriptionLoading && (
                                <div className="mt-2">
                                    <Badge className="bg-green-100 text-green-800">
                                        {getSMSRemaining() === 999999 ? '∞ Unlimited' : `${getSMSRemaining()} SMS remaining this month`}
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => setIsBroadcastFormOpen(true)} variant="outline">
                                <Send className="w-5 h-5 mr-2" />
                                Send Broadcast
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

                    <Tabs defaultValue="keywords" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="keywords">Keywords</TabsTrigger>
                            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                            <TabsTrigger value="messages">Message History</TabsTrigger>
                            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
                        </TabsList>

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
                                                <p className="text-sm">Create your first keyword to start engaging via SMS</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="subscribers">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>SMS Subscribers ({subscribers.length})</CardTitle>
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
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="setup">
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>SMS Setup Guide - Sinch</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-500">
                                        <h4 className="font-semibold text-red-900 mb-2 text-lg">🚨 CRITICAL: Correct Webhook URL</h4>
                                        <p className="text-sm text-red-800 mb-3 font-semibold">
                                            Make sure you're using the CORRECT webhook URL in Sinch Dashboard:
                                        </p>
                                        <div className="bg-white p-4 rounded border-2 border-red-400 mb-3">
                                            <p className="text-xs font-semibold text-red-900 mb-2">✅ CORRECT URL (must end with "Sinch"):</p>
                                            <code className="text-xs break-all block text-green-900 font-mono bg-green-50 p-2 rounded">
                                                https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS
                                            </code>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="mt-2 text-xs bg-green-600 hover:bg-green-700"
                                                onClick={() => {
                                                    navigator.clipboard.writeText('https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS');
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
                                            <li>Go to Settings → SMS/Sinch tab</li>
                                            <li>Enter your Sinch credentials and click "Save & Test"</li>
                                            <li><strong className="text-red-700">CRITICAL:</strong> Go to Dashboard → Code → Environment Variables and add:
                                                <ul className="list-disc ml-5 mt-1">
                                                    <li><code className="bg-yellow-100 px-1">SINCH_SERVICE_PLAN_ID</code></li>
                                                    <li><code className="bg-yellow-100 px-1">SINCH_API_TOKEN</code></li>
                                                    <li><code className="bg-yellow-100 px-1">SINCH_PHONE_NUMBER</code></li>
                                                </ul>
                                            </li>
                                            <li><strong className="text-red-700">Update webhook URL</strong> in Sinch dashboard to the CORRECT URL above</li>
                                            <li>Create your first keyword on this page</li>
                                            <li>Text the keyword to your number to test!</li>
                                        </ol>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 1: Get Sinch Account</h3>
                                        <p className="text-sm text-slate-600 mb-2">Sign up for a free Sinch account at <a href="https://www.sinch.com/sign-up/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">sinch.com/sign-up</a></p>
                                        <p className="text-sm text-slate-600">Sinch offers $2 free credit (~500 test messages)</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 2: Get Credentials</h3>
                                        <ul className="text-sm text-slate-600 list-disc ml-6 space-y-1">
                                            <li>Go to SMS → Service Plans → Copy your Service Plan ID</li>
                                            <li>Go to SMS → API Tokens → Create token → Copy it</li>
                                            <li>Go to Numbers → Buy a number (or use existing)</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 3: Configure in Settings</h3>
                                        <p className="text-sm text-slate-600 mb-2">Go to Settings → SMS/Sinch tab and enter your credentials, then click "Save & Test Connection"</p>
                                    </div>

                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <h3 className="font-semibold text-red-900 mb-2">Step 4: Set Environment Variables (REQUIRED!)</h3>
                                        <p className="text-sm text-red-800 mb-2">This is THE MOST IMPORTANT STEP:</p>
                                        <ol className="text-sm text-red-800 list-decimal ml-6 space-y-1 mb-3">
                                            <li>Go to <strong>Dashboard → Code → Environment Variables</strong></li>
                                            <li>Click "Add Variable"</li>
                                            <li>Add <code className="bg-red-100 px-2 py-1">SINCH_SERVICE_PLAN_ID</code> with your Service Plan ID</li>
                                            <li>Add <code className="bg-red-100 px-2 py-1">SINCH_API_TOKEN</code> with your API Token</li>
                                            <li>Add <code className="bg-red-100 px-2 py-1">SINCH_PHONE_NUMBER</code> with your phone (e.g., +15551234567)</li>
                                            <li>Click <strong>"Save & Deploy"</strong></li>
                                        </ol>
                                        <p className="text-xs text-red-700 font-semibold">
                                            ⚠️ Keywords will NOT work without this step! Sinch webhooks come from external servers and need environment variables.
                                        </p>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-500">
                                        <h3 className="font-semibold text-purple-900 mb-2 text-lg">Step 5: Update Webhook in Sinch (FIX YOUR ERROR!)</h3>
                                        <p className="text-sm text-purple-800 mb-2">In Sinch Dashboard:</p>
                                        <ol className="text-sm text-purple-800 list-decimal ml-6 space-y-1 mb-3">
                                            <li>Go to <strong>Numbers</strong> → Click your phone number</li>
                                            <li>Click <strong>Webhooks</strong> or <strong>SMS Configuration</strong></li>
                                            <li><strong className="text-red-700">Delete the old webhook URL if present</strong></li>
                                            <li>Set <strong>Inbound SMS Webhook URL</strong> to the CORRECT URL below:</li>
                                        </ol>
                                        <div className="bg-white p-3 rounded border-2 border-purple-400">
                                            <p className="text-xs font-semibold text-purple-900 mb-1">✅ Use this webhook URL:</p>
                                            <code className="text-xs font-mono break-all block text-purple-900 bg-purple-50 p-2 rounded">
                                                https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 text-xs border-purple-400 text-purple-900 hover:bg-purple-100"
                                                onClick={() => {
                                                    navigator.clipboard.writeText('https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS');
                                                    alert('✅ Webhook URL copied! Now paste it in Sinch Dashboard.');
                                                }}
                                            >
                                                📋 Copy Webhook URL
                                            </Button>
                                        </div>
                                        <p className="text-xs text-purple-700 mt-2 font-semibold">
                                        ⚠️ URL MUST end with <code className="bg-purple-100 px-1">handleIncomingSinchSMS</code>
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 6: Create Your First Keyword</h3>
                                        <p className="text-sm text-slate-600">Click "Create Keyword" button above and set up your first keyword (e.g., TEST, CONNECT, INFO)</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Step 7: Test It!</h3>
                                        <ol className="text-sm text-slate-600 list-decimal ml-6 space-y-1">
                                            <li>Text your keyword to your Sinch phone number</li>
                                            <li>You should receive an automatic response</li>
                                            <li>Check the "Message History" tab to see logs</li>
                                            <li>If no response, check Dashboard → Code → Functions → handleIncomingSinchSMS for error logs</li>
                                        </ol>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-blue-900 mb-2">🐛 Troubleshooting</h4>
                                        <ul className="text-sm text-blue-800 space-y-2">
                                            <li><strong>Not receiving responses?</strong>
                                                <ol className="list-decimal ml-6 mt-1 space-y-1">
                                                    <li>Double-check environment variables are set (Dashboard → Code → Environment Variables)</li>
                                                    <li>Verify webhook URL is the CORRECT one with "Sinch" at the end</li>
                                                    <li>Check Dashboard → Code → Functions → handleIncomingSinchSMS for logs</li>
                                                    <li>Make sure keyword is marked as "Active"</li>
                                                </ol>
                                            </li>
                                            <li><strong>Keyword not working?</strong>
                                                <ol className="list-decimal ml-6 mt-1 space-y-1">
                                                    <li>Ensure keyword is marked as "Active"</li>
                                                    <li>Keywords must be ALL CAPS when created</li>
                                                    <li>Check Message History tab for any error logs</li>
                                                </ol>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                                        <strong>💰 Sinch Pricing:</strong>
                                        <div className="mt-2 space-y-1">
                                            <p>• US SMS: $0.0075 per message</p>
                                            <p>• Free $2 credit = ~266 test messages</p>
                                            <p>• No monthly fees, pay as you go</p>
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