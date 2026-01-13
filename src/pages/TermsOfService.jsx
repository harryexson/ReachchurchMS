import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { MessageSquare, Shield, AlertCircle } from "lucide-react";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                    <p className="text-blue-100">Last updated: January 13, 2026</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 prose prose-slate max-w-none">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using REACH Church Connect ("Service"), you agree to be bound by these 
                            Terms of Service ("Terms"). If you disagree with any part of these terms, you may not 
                            access the Service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            REACH Church Connect is a cloud-based church management platform that provides tools for 
                            member management, online giving, event coordination, communications, and other 
                            church administration functions.
                        </p>

                        <h2>3. Account Registration</h2>
                        <p>To use our Service, you must:</p>
                        <ul>
                            <li>Be at least 18 years old or have parental consent</li>
                            <li>Provide accurate and complete registration information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Notify us immediately of any unauthorized access</li>
                            <li>Accept responsibility for all activities under your account</li>
                        </ul>

                        <h2>4. Subscription and Payment</h2>
                        <h3>4.1 Subscription Plans</h3>
                        <p>
                            We offer various subscription tiers (Starter, Growth, Premium) with different features 
                            and pricing. Details are available on our Pricing page.
                        </p>

                        <h3>4.2 Billing</h3>
                        <ul>
                            <li>Subscriptions are billed monthly or annually in advance</li>
                            <li>Payment is processed through Stripe</li>
                            <li>Prices may change with 30 days notice</li>
                            <li>Failed payments may result in service suspension</li>
                        </ul>

                        <h3>4.3 Refunds</h3>
                        <p>
                            We offer a 14-day free trial. After the trial, subscriptions are non-refundable. 
                            You may cancel at any time, and service will continue until the end of your billing period.
                        </p>

                        <h2>5. Acceptable Use</h2>
                        <p>You agree NOT to:</p>
                        <ul>
                            <li>Use the Service for any illegal purpose</li>
                            <li>Send spam or unsolicited communications</li>
                            <li>Impersonate others or provide false information</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with the Service's operation</li>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Upload malicious code or harmful content</li>
                            <li>Resell or redistribute the Service without permission</li>
                        </ul>

                        <h2>6. Data Ownership and Responsibility</h2>
                        <h3>6.1 Your Data</h3>
                        <p>
                            You retain ownership of all data you input into the Service ("Your Data"). 
                            You grant us a license to use Your Data solely to provide the Service.
                        </p>

                        <h3>6.2 Data Responsibility</h3>
                        <p>
                            You are responsible for ensuring you have appropriate consent to store and process 
                            member information, and for complying with applicable data protection laws.
                        </p>

                        <h3>6.3 Data Export</h3>
                        <p>
                            You may export Your Data at any time through our export features. Upon account 
                            termination, you will have 30 days to export Your Data before it is deleted.
                        </p>

                        <h2>7. Third-Party Services</h2>
                        <p>
                            The Service integrates with third-party services (Stripe, Sinch, YouTube, etc.). 
                            Your use of these services is subject to their respective terms and policies. 
                            We are not responsible for third-party service availability or performance.
                        </p>

                        <h2>8. SMS/Text Messaging Services</h2>
                        <div className="bg-amber-50 border-l-4 border-amber-600 p-4 my-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-1" />
                                <div>
                                    <p className="font-semibold text-amber-900 mb-2">Important Compliance Requirements</p>
                                    <p className="text-slate-700 text-sm">
                                        By using our SMS/MMS messaging features, you agree to comply with all applicable laws 
                                        and regulations, including TCPA (Telephone Consumer Protection Act), CTIA guidelines, 
                                        and A2P 10DLC requirements.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h3>8.1 Opt-In Requirements</h3>
                        <p>When using our SMS and communication features, you must:</p>
                        <ul>
                            <li>Obtain <strong>explicit written or digital consent</strong> before sending any messages</li>
                            <li>Clearly disclose the purpose of messages (informational, faith-based, church operations)</li>
                            <li>Provide opt-in disclosures stating message frequency, data rates, and opt-out instructions</li>
                            <li>Support text-to-join keywords (e.g., JOIN, EVENTS, INFO, GIVE)</li>
                            <li>Maintain records of all opt-in consents</li>
                        </ul>

                        <h3>8.2 Message Content Requirements</h3>
                        <ul>
                            <li>Messages must be informational and faith-based, NOT promotional or mass marketing</li>
                            <li>Approved message types: event registrations, service information, confirmations, reminders, 
                                donor-initiated text-to-give confirmations, church announcements</li>
                            <li>Prohibited content: SHAFT (Sex, Hate, Alcohol, Firearms, Tobacco), political campaigns, 
                                third-party marketing</li>
                            <li>All messages must include clear opt-out instructions</li>
                        </ul>

                        <h3>8.3 Opt-Out Compliance</h3>
                        <ul>
                            <li>Honor opt-out requests (STOP, UNSUBSCRIBE, CANCEL) <strong>immediately</strong></li>
                            <li>Send confirmation message when user opts out</li>
                            <li>Maintain an opt-out list and never re-subscribe without new consent</li>
                            <li>Provide HELP keyword support for assistance</li>
                        </ul>

                        <h3>8.4 Message Costs & Frequency</h3>
                        <ul>
                            <li>Message and data rates may apply for recipients based on their carrier plan</li>
                            <li>You must disclose typical message frequency (1-4 messages per month for most campaigns)</li>
                            <li>SMS service costs are included in your subscription tier</li>
                            <li>Additional charges may apply for usage exceeding plan limits</li>
                        </ul>

                        <h3>8.5 Detailed SMS Terms</h3>
                        <div className="flex flex-wrap gap-3 my-4">
                            <Link to={createPageUrl("SMSTermsAndConditions")}>
                                <Button variant="outline" size="sm">
                                    <Shield className="w-4 h-4 mr-2" />
                                    View Full SMS Terms & Conditions
                                </Button>
                            </Link>
                            <Link to={createPageUrl("SMSPrivacyPolicy")}>
                                <Button variant="outline" size="sm">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    View SMS Privacy Policy
                                </Button>
                            </Link>
                        </div>

                        <h2>9. Donation Processing</h2>
                        <p>
                            Donations processed through the Service are handled by Stripe. You are responsible 
                            for providing accurate tax receipts and complying with nonprofit regulations. 
                            We are not responsible for disputes between you and your donors.
                        </p>

                        <h2>10. Intellectual Property</h2>
                        <p>
                            The Service, including its design, features, and content (excluding Your Data), 
                            is owned by Bold Intelligent Solutions and protected by intellectual property laws. 
                            You may not copy, modify, or reverse engineer any part of the Service.
                        </p>

                        <h2>11. Disclaimer of Warranties</h2>
                        <p>
                            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE 
                            THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. TO THE MAXIMUM EXTENT 
                            PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED.
                        </p>

                        <h2>12. Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR 
                            REVENUES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 
                            PRECEDING 12 MONTHS.
                        </p>

                        <h2>13. Indemnification</h2>
                        <p>
                            You agree to indemnify and hold harmless REACH Church Connect and its affiliates 
                            from any claims, damages, or expenses arising from your use of the Service or 
                            violation of these Terms.
                        </p>

                        <h2>14. Termination</h2>
                        <p>
                            We may terminate or suspend your account for violation of these Terms or for any 
                            other reason with 30 days notice. You may terminate your account at any time through 
                            your account settings or by contacting support.
                        </p>

                        <h2>15. Changes to Terms</h2>
                        <p>
                            We may modify these Terms at any time. We will notify you of material changes via 
                            email or through the Service. Continued use after changes constitutes acceptance.
                        </p>

                        <h2>16. Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of the State of Delaware, without regard to 
                            conflict of law principles. Any disputes shall be resolved in the courts of Delaware.
                        </p>

                        <h2>17. Additional Resources</h2>
                        <div className="flex flex-wrap gap-3 my-6">
                            <Link to={createPageUrl("SMSTermsAndConditions")}>
                                <Button variant="outline">SMS Terms & Conditions</Button>
                            </Link>
                            <Link to={createPageUrl("SMSPrivacyPolicy")}>
                                <Button variant="outline">SMS Privacy Policy</Button>
                            </Link>
                            <Link to={createPageUrl("SMSHelpCenter")}>
                                <Button variant="outline">SMS Help Center</Button>
                            </Link>
                            <Link to={createPageUrl("PrivacyPolicy")}>
                                <Button variant="outline">Full Privacy Policy</Button>
                            </Link>
                        </div>

                        <h2>18. Contact Information</h2>
                        <p>For questions about these Terms, contact us at:</p>
                        <ul>
                            <li>Email: support@reachchurchMS.com</li>
                            <li>Company: Bold Intelligent Solutions, LLC</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}