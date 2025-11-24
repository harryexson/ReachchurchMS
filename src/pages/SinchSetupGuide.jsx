
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
    MessageSquare, 
    CheckCircle, 
    AlertCircle, 
    ExternalLink,
    Copy,
    Image as ImageIcon,
    Video,
    FileText,
    Smartphone,
    DollarSign // Added DollarSign import
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SinchSetupGuide() {
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900">Sinch SMS/MMS Setup Guide</h1>
                            <p className="text-slate-600 mt-1">Complete setup instructions for text messaging</p>
                        </div>
                    </div>
                </div>

                {/* What is Sinch */}
                <Card className="mb-6 shadow-lg">
                    <CardHeader>
                        <CardTitle>What is Sinch?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-700">
                            Sinch is a cloud communications platform that enables SMS and MMS messaging for your church. 
                            With Sinch, you can:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-blue-900">Send SMS Messages</h3>
                                    <p className="text-sm text-blue-800">Text announcements, reminders, and updates to your congregation</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                                <ImageIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-purple-900">Send MMS Campaigns</h3>
                                    <p className="text-sm text-purple-800">Rich media messages with images, videos, and interactive slides</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                                <Smartphone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-green-900">SMS Keywords</h3>
                                    <p className="text-sm text-green-800">Let people text keywords (like CONNECT) to engage with your church</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                                <FileText className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-orange-900">Two-Way Messaging</h3>
                                    <p className="text-sm text-orange-800">Receive and respond to text messages from your members</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step-by-Step Setup */}
                <Card className="mb-6 shadow-lg">
                    <CardHeader>
                        <CardTitle>Step-by-Step Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                1
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Create a Sinch Account</h3>
                                <p className="text-slate-700 mb-3">
                                    Go to Sinch and sign up for a free account. You'll get free credits to test with!
                                </p>
                                <Button
                                    onClick={() => window.open('https://www.sinch.com/sign-up/', '_blank')}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Sign Up for Sinch
                                </Button>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                2
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Purchase a Phone Number</h3>
                                <p className="text-slate-700 mb-3">
                                    In the Sinch Dashboard, go to <strong>Numbers</strong> → <strong>Buy Number</strong>
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 mb-3">
                                    <li>Choose your country (USA recommended)</li>
                                    <li>Select "SMS" and "MMS" capabilities</li>
                                    <li>Pick a number (cost: ~$1-2/month)</li>
                                    <li>Complete the purchase</li>
                                </ul>
                                <Alert>
                                    <AlertDescription>
                                        <strong>Tip:</strong> Choose a local area code to increase trust and engagement!
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                3
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Get Your API Credentials</h3>
                                <p className="text-slate-700 mb-3">
                                    In Sinch Dashboard, navigate to:
                                </p>
                                <div className="space-y-3">
                                    <div className="p-3 bg-slate-50 rounded-lg border">
                                        <p className="text-sm font-semibold text-slate-900 mb-1">Service Plan ID:</p>
                                        <p className="text-xs text-slate-600 mb-2">
                                            Go to <strong>SMS</strong> → <strong>Service Plans</strong> → Copy the Service Plan ID
                                        </p>
                                        <code className="text-xs bg-slate-200 px-2 py-1 rounded">
                                            Example: abc123def456ghi789
                                        </code>
                                    </div>
                                    
                                    <div className="p-3 bg-slate-50 rounded-lg border">
                                        <p className="text-sm font-semibold text-slate-900 mb-1">API Token:</p>
                                        <p className="text-xs text-slate-600 mb-2">
                                            Go to <strong>SMS</strong> → <strong>API Tokens</strong> → <strong>Create New Token</strong>
                                        </p>
                                        <code className="text-xs bg-slate-200 px-2 py-1 rounded">
                                            Save this token securely - you won't see it again!
                                        </code>
                                    </div>
                                    
                                    <div className="p-3 bg-slate-50 rounded-lg border">
                                        <p className="text-sm font-semibold text-slate-900 mb-1">Phone Number:</p>
                                        <p className="text-xs text-slate-600 mb-2">
                                            Go to <strong>Numbers</strong> → <strong>Active Numbers</strong> → Copy your number
                                        </p>
                                        <code className="text-xs bg-slate-200 px-2 py-1 rounded">
                                            Format: +15551234567 (include the +)
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                4
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Add Credentials to ChurchConnect</h3>
                                <p className="text-slate-700 mb-3">
                                    Go to <Link to={createPageUrl('Settings')} className="text-blue-600 hover:underline font-semibold">Settings → SMS/Sinch Tab</Link> and enter:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 mb-3">
                                    <li>Service Plan ID</li>
                                    <li>API Token</li>
                                    <li>Phone Number</li>
                                </ul>
                                <p className="text-sm text-slate-600 mb-3">
                                    Then click <strong>"Save & Test Connection"</strong>
                                </p>
                                <Link to={createPageUrl('Settings')}>
                                    <Button className="bg-green-600 hover:bg-green-700">
                                        Go to Settings
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                5
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">🚨 CRITICAL: Set Environment Variables</h3>
                                <Alert className="mb-3 border-red-300 bg-red-50">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <AlertDescription className="text-red-900">
                                        <strong>This step is REQUIRED for SMS keywords to work!</strong>
                                    </AlertDescription>
                                </Alert>
                                <p className="text-slate-700 mb-3">
                                    Go to <strong>Dashboard → Code → Environment Variables</strong> and add these three variables:
                                </p>
                                <div className="space-y-2 mb-3">
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                                        <code className="flex-1 text-sm">SINCH_SERVICE_PLAN_ID</code>
                                        <code className="text-xs text-slate-500">= your service plan ID</code>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                                        <code className="flex-1 text-sm">SINCH_API_TOKEN</code>
                                        <code className="text-xs text-slate-500">= your API token</code>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                                        <code className="flex-1 text-sm">SINCH_PHONE_NUMBER</code>
                                        <code className="text-xs text-slate-500">= your phone number</code>
                                    </div>
                                </div>
                                <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded border border-amber-200 mb-3">
                                    <strong>Why?</strong> Webhooks come from external servers and can't access your database. 
                                    Environment variables make credentials available to webhook handlers.
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                    After adding these, click <strong>"Save & Deploy"</strong> to restart your app.
                                </p>
                            </div>
                        </div>

                        {/* Step 6 */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                6
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Configure Webhook URL</h3>
                                <p className="text-slate-700 mb-3">
                                    In Sinch Dashboard, go to your <strong>Phone Number</strong> → <strong>Webhooks</strong>
                                </p>
                                <p className="text-sm text-slate-700 mb-2">Set the <strong>Inbound SMS URL</strong> to:</p>
                                <div className="p-3 bg-slate-900 rounded-lg mb-3">
                                    <code className="text-xs text-green-400 break-all block">
                                        https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS
                                    </code>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard('https://base44.app/api/apps/68d38ad0f4d6d5d05900d129/functions/handleIncomingSinchSMS')}
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Webhook URL
                                </Button>
                                <Alert className="mt-3 border-red-300 bg-red-50">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <AlertDescription className="text-red-900">
                                        <strong>IMPORTANT:</strong> The URL must end with <code>handleIncomingSinchSMS</code> (with "Sinch")
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>

                        {/* Step 7 */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                                7
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Test Your Setup!</h3>
                                <p className="text-slate-700 mb-3">
                                    Now you're ready to test:
                                </p>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 mb-4">
                                    <li>Go to <Link to={createPageUrl('TextMessaging')} className="text-blue-600 hover:underline">Text Messaging</Link> page</li>
                                    <li>Create an SMS keyword (e.g., "HELLO")</li>
                                    <li>Text that keyword to your Sinch phone number</li>
                                    <li>You should receive an auto-response!</li>
                                    <li>Check the "Message History" tab to see logs</li>
                                </ol>
                                <div className="flex gap-3">
                                    <Link to={createPageUrl('TextMessaging')}>
                                        <Button className="bg-purple-600 hover:bg-purple-700">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Go to Text Messaging
                                        </Button>
                                    </Link>
                                    <Link to={createPageUrl('MultimediaMessaging')}>
                                        <Button variant="outline">
                                            <ImageIcon className="w-4 h-4 mr-2" />
                                            Create MMS Campaign
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing Info */}
                <Card className="mb-6 shadow-lg border-blue-200">
                    <CardHeader className="bg-blue-50">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            Sinch Pricing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-lg border">
                                <h3 className="font-semibold text-slate-900 mb-2">Phone Number</h3>
                                <p className="text-2xl font-bold text-blue-600 mb-1">$1-2/month</p>
                                <p className="text-xs text-slate-600">One-time setup, monthly rental</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border">
                                <h3 className="font-semibold text-slate-900 mb-2">SMS Messages</h3>
                                <p className="text-2xl font-bold text-blue-600 mb-1">$0.0075</p>
                                <p className="text-xs text-slate-600">Per outbound message (US)</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border">
                                <h3 className="font-semibold text-slate-900 mb-2">MMS Messages</h3>
                                <p className="text-2xl font-bold text-blue-600 mb-1">$0.02</p>
                                <p className="text-xs text-slate-600">Per MMS with media (US)</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-4">
                            💡 <strong>Example:</strong> Sending 100 SMS messages costs about $0.75. 
                            Most churches spend $10-30/month for their entire congregation.
                        </p>
                    </CardContent>
                </Card>

                {/* Troubleshooting */}
                <Card className="shadow-lg border-yellow-200">
                    <CardHeader className="bg-yellow-50">
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            Troubleshooting
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">❌ Keywords not working?</h3>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                    <li>Check that webhook URL is correctly configured in Sinch</li>
                                    <li>Verify environment variables are set in Dashboard → Code → Environment Variables</li>
                                    <li>Make sure you clicked "Save & Deploy" after adding env variables</li>
                                    <li>Check Dashboard → Code → Functions → handleIncomingSinchSMS for error logs</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">❌ Getting TwiML/XML errors?</h3>
                                <p className="text-sm text-slate-700 mb-2">
                                    You have the wrong webhook URL! Make sure it ends with <code className="bg-red-100 px-1 rounded">handleIncomingSinchSMS</code>
                                </p>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-2">❌ Messages not sending?</h3>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                    <li>Check Sinch account has sufficient credits</li>
                                    <li>Verify phone numbers are in E.164 format (+15551234567)</li>
                                    <li>Check Message History tab for error details</li>
                                </ul>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="font-semibold text-blue-900 mb-2">🆘 Need Help?</h3>
                                <p className="text-sm text-blue-800 mb-3">
                                    If you're still having issues, check the System Diagnostics page for detailed logs.
                                </p>
                                <Link to={createPageUrl('SystemDiagnostics')}>
                                    <Button variant="outline" size="sm">
                                        View System Diagnostics
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
