import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, AlertCircle } from "lucide-react";

export default function SMSTermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            SMS/MMS Terms and Conditions
          </h1>
          <p className="text-slate-600">REACH Church Connect Text Messaging Service</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Service Purpose
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              Our text messaging service is designed for member engagement and church operations. 
              Messages are informational and faith-based, not promotional or mass marketing.
            </p>
            <p className="text-slate-700">
              Messaging includes event registrations, service information, confirmations, reminders, 
              donor-initiated text-to-give confirmations, and important church announcements. 
              All messages are sent only to users who have explicitly opted in.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Opt-In Methods (Your Consent)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700 font-semibold">
              You may opt in to receive messages through one or more of the following methods:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>
                <strong>Text-to-Join:</strong> Text keywords such as JOIN, EVENTS, INFO, or GIVE 
                to the church's number to subscribe.
              </li>
              <li>
                <strong>Website Registration:</strong> Complete online church registration or event 
                forms with explicit SMS consent.
              </li>
              <li>
                <strong>Paper/In-Person Forms:</strong> Sign up during church services or events, 
                acknowledging SMS consent.
              </li>
            </ul>
            <p className="text-slate-700">
              All opt-in methods clearly state the message purpose, expected frequency, that message 
              and data rates may apply, and how to opt out at any time.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sample Message Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">Event Confirmation:</p>
              <p className="text-sm text-slate-700">
                "You're registered for the church event this Saturday at 10 AM. Reply STOP to opt out."
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">Service Reminder:</p>
              <p className="text-sm text-slate-700">
                "Join us this Sunday at 9 AM or 11 AM. We look forward to worshiping with you."
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">Text-to-Give Confirmation:</p>
              <p className="text-sm text-slate-700">
                "Thank you for your generosity! Your donation has been received."
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>MMS (Multimedia Messages)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              MMS messages may include images such as church event flyers, service announcements, 
              or ministry updates. MMS content is informational only and sent only to opted-in users.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Message Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              Message frequency varies based on your interaction and subscriptions. Typically 1–4 messages 
              per month. Additional messages are sent only when initiated by you (such as text-to-give or 
              event registration).
            </p>
            <p className="text-slate-700 mt-2 font-semibold">
              Message and data rates may apply based on your mobile carrier's plan.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How to Opt Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">
              You can opt out of messages at any time by replying:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700">
              <li><strong>STOP</strong> - Unsubscribe from all messages</li>
              <li><strong>UNSUBSCRIBE</strong> - Cancel your subscription</li>
              <li><strong>CANCEL</strong> - Stop receiving messages</li>
            </ul>
            <p className="text-slate-700 mt-3">
              After opting out, you will receive a confirmation message and will no longer receive 
              SMS or MMS messages from us.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              This messaging service complies with A2P 10DLC and CTIA guidelines. Messages are sent 
              only to opted-in users and include clear opt-out instructions. We do not send SHAFT 
              (Sex, Hate, Alcohol, Firearms, Tobacco), political, or third-party marketing content.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Last Updated: January 2026</p>
          <p className="mt-2">
            For questions or support, reply HELP to any message or contact your church office.
          </p>
        </div>
      </div>
    </div>
  );
}