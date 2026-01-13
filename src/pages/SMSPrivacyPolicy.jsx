import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, AlertCircle } from "lucide-react";

export default function SMSPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            SMS/MMS Privacy Policy
          </h1>
          <p className="text-slate-600">How We Protect Your Information</p>
        </div>

        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <p className="text-lg text-slate-800 font-semibold text-center">
              Our church respects your privacy. Your information is used only for church 
              communications and is never shared with third parties.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700">
              When you opt in to receive text messages from our church, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>Your mobile phone number</li>
              <li>The keyword you used to opt in (e.g., JOIN, EVENTS, INFO, GIVE)</li>
              <li>Date and time of your opt-in</li>
              <li>Your message preferences and subscriptions</li>
              <li>Name (if you provide it through registration forms)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700">
              We use your information solely for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>Send you church event information, service reminders, and announcements</li>
              <li>Process your text-to-give donations and send confirmations</li>
              <li>Confirm your event registrations</li>
              <li>Provide ministry updates and faith-based content</li>
              <li>Respond to your inquiries (HELP requests)</li>
              <li>Honor your opt-out requests (STOP messages)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Information Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-900 font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                We DO NOT sell, rent, or share your information with third parties.
              </p>
            </div>
            <p className="text-slate-700">
              Your phone number and personal information remain confidential and are used 
              exclusively for church communications. We do not:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
              <li>Sell your information to marketers</li>
              <li>Share your data with other organizations</li>
              <li>Use your information for commercial purposes</li>
              <li>Send third-party promotional content</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 mt-3">
              <li>Encrypted data transmission</li>
              <li>Secure database storage</li>
              <li>Access limited to authorized church staff only</li>
              <li>Regular security audits and updates</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Rights and Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700">You have complete control over your information:</p>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-slate-800">Opt Out Anytime</p>
                <p className="text-sm text-slate-600">
                  Reply STOP to any message to immediately unsubscribe
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-slate-800">Request Data Deletion</p>
                <p className="text-sm text-slate-600">
                  Contact the church office to request deletion of your data
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-slate-800">Update Your Information</p>
                <p className="text-sm text-slate-600">
                  Contact us to update your phone number or preferences
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Message Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              Message and data rates may apply based on your mobile carrier's plan. We recommend 
              checking with your carrier if you have questions about potential charges for receiving 
              text messages.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              We may update this privacy policy from time to time. Any changes will be communicated 
              through our text messaging service or church website. Your continued use of the service 
              after changes indicates acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Last Updated: January 2026</p>
          <p className="mt-4 text-slate-700 font-semibold">
            Questions about your privacy?
          </p>
          <p className="text-slate-600">
            Reply HELP to any message or contact your church office directly.
          </p>
        </div>
      </div>
    </div>
  );
}