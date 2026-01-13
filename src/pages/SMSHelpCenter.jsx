import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, MessageSquare, ShieldCheck, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function SMSHelpCenterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Text Messaging Help Center
          </h1>
          <p className="text-slate-600">Get Answers to Common Questions</p>
        </div>

        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg text-slate-800 font-semibold mb-4">
                Need immediate assistance?
              </p>
              <p className="text-slate-700 mb-4">
                Reply <strong>HELP</strong> to any message from us, or contact the church office directly.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Welcome Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                "Welcome to our ministry! You are now subscribed to receive church messages. 
                Reply EVENTS for programs, INFO for service details, or GIVE to support our ministry. 
                Msg & data rates may apply. Reply STOP to opt out."
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Opt-Out Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                "You have been unsubscribed from our ministry messages. You will no longer 
                receive SMS or MMS messages. Reply HELP for support."
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                How do I sign up for text messages?
              </h3>
              <p className="text-slate-700 text-sm">
                Text a keyword like <strong>JOIN</strong>, <strong>EVENTS</strong>, or <strong>INFO</strong> to 
                the church's number, or sign up through our website or in-person at church events.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                How do I stop receiving messages?
              </h3>
              <p className="text-slate-700 text-sm">
                Reply <strong>STOP</strong>, <strong>UNSUBSCRIBE</strong>, or <strong>CANCEL</strong> to 
                any message. You'll receive a confirmation and won't get further messages.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                How many messages will I receive?
              </h3>
              <p className="text-slate-700 text-sm">
                Typically 1–4 messages per month. Additional messages are sent only when you initiate 
                them (like event registrations or text-to-give donations).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Will I be charged for messages?
              </h3>
              <p className="text-slate-700 text-sm">
                Message and data rates may apply based on your mobile carrier's plan. Check with 
                your carrier for details about your text messaging costs.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Is my information private?
              </h3>
              <p className="text-slate-700 text-sm">
                Yes! We respect your privacy. Your phone number and information are used only for 
                church communications and are never shared with third parties.{" "}
                <Link to={createPageUrl("SMSPrivacyPolicy")} className="text-blue-600 hover:underline">
                  Read our Privacy Policy
                </Link>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                What if I accidentally opted out?
              </h3>
              <p className="text-slate-700 text-sm">
                Simply text the keyword again (like <strong>JOIN</strong>) to re-subscribe, or contact 
                the church office for assistance.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                What types of messages will I receive?
              </h3>
              <p className="text-slate-700 text-sm">
                Event confirmations, service reminders, text-to-give receipts, important announcements, 
                and ministry updates. All messages are faith-based and informational.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Available Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900 text-sm">EVENTS</p>
                <p className="text-xs text-slate-600">Get information about upcoming church programs</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900 text-sm">INFO</p>
                <p className="text-xs text-slate-600">Receive service times and church details</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900 text-sm">GIVE</p>
                <p className="text-xs text-slate-600">Support the ministry with text-to-give</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900 text-sm">HELP</p>
                <p className="text-xs text-slate-600">Get assistance or contact information</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="font-semibold text-red-900 text-sm">STOP</p>
                <p className="text-xs text-slate-600">Unsubscribe from all messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-slate-800">Call the Church Office</p>
                  <p className="text-sm text-slate-600">
                    Contact your church directly for immediate assistance
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-semibold text-slate-800">Email Support</p>
                  <p className="text-sm text-slate-600">
                    Reply HELP to any message for contact information
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={createPageUrl("SMSTermsAndConditions")}>
                  <Button variant="outline">View Terms & Conditions</Button>
                </Link>
                <Link to={createPageUrl("SMSPrivacyPolicy")}>
                  <Button variant="outline">View Privacy Policy</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Last Updated: January 2026</p>
        </div>
      </div>
    </div>
  );
}