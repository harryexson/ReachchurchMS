import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                    <p className="text-blue-100">Last updated: November 26, 2024</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 prose prose-slate max-w-none">
                        <h2>Introduction</h2>
                        <p>
                            REACH Church Connect ("we," "our," or "us") is committed to protecting your privacy. 
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                            when you use our church management platform and related services.
                        </p>

                        <h2>Information We Collect</h2>
                        
                        <h3>Information You Provide</h3>
                        <ul>
                            <li><strong>Account Information:</strong> Name, email address, phone number, church name, and role when you create an account.</li>
                            <li><strong>Member Data:</strong> Information about church members that you input into the system, including names, contact details, family relationships, and attendance records.</li>
                            <li><strong>Financial Information:</strong> Donation records, payment information processed through Stripe, and giving preferences.</li>
                            <li><strong>Communications:</strong> Messages sent through our SMS and email features, including content and recipient information.</li>
                        </ul>

                        <h3>Information Collected Automatically</h3>
                        <ul>
                            <li><strong>Usage Data:</strong> How you interact with our platform, including pages visited, features used, and time spent.</li>
                            <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers.</li>
                            <li><strong>Cookies:</strong> We use cookies and similar technologies to enhance your experience and analyze usage patterns.</li>
                        </ul>

                        <h2>How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process donations and financial transactions</li>
                            <li>Send communications on behalf of your church</li>
                            <li>Provide customer support</li>
                            <li>Analyze usage patterns to improve our platform</li>
                            <li>Comply with legal obligations</li>
                            <li>Prevent fraud and ensure security</li>
                        </ul>

                        <h2>Information Sharing</h2>
                        <p>We do not sell your personal information. We may share information with:</p>
                        <ul>
                            <li><strong>Service Providers:</strong> Third parties that help us operate our platform (e.g., Stripe for payments, Sinch for SMS).</li>
                            <li><strong>Church Administrators:</strong> Authorized users within your church organization can access member and giving data.</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
                        </ul>

                        <h2>Data Security</h2>
                        <p>
                            We implement industry-standard security measures to protect your data, including:
                        </p>
                        <ul>
                            <li>SSL/TLS encryption for data in transit</li>
                            <li>Encrypted storage for sensitive data</li>
                            <li>Regular security audits and monitoring</li>
                            <li>Access controls and authentication</li>
                            <li>PCI-DSS compliant payment processing through Stripe</li>
                        </ul>

                        <h2>Data Retention</h2>
                        <p>
                            We retain your data for as long as your account is active or as needed to provide services. 
                            Donation records are retained for 7 years for tax compliance purposes. 
                            You may request deletion of your data at any time, subject to legal retention requirements.
                        </p>

                        <h2>Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Export your data in a portable format</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Withdraw consent where applicable</li>
                        </ul>

                        <h2>Children's Privacy</h2>
                        <p>
                            Our service is not directed to children under 13. We do not knowingly collect personal 
                            information from children under 13. If you believe we have collected such information, 
                            please contact us immediately.
                        </p>

                        <h2>Third-Party Services</h2>
                        <p>
                            Our platform integrates with third-party services including:
                        </p>
                        <ul>
                            <li><strong>Stripe:</strong> Payment processing</li>
                            <li><strong>Sinch:</strong> SMS messaging</li>
                            <li><strong>YouTube/Facebook:</strong> Live streaming</li>
                        </ul>
                        <p>These services have their own privacy policies that govern their use of your data.</p>

                        <h2>Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any material 
                            changes by posting the new policy on this page and updating the "Last updated" date.
                        </p>

                        <h2>Contact Us</h2>
                        <p>
                            If you have questions about this Privacy Policy or our data practices, please contact us at:
                        </p>
                        <ul>
                            <li>Email: support@reachchurchMS.com</li>
                            <li>Address: Bold Intelligent Solutions, LLC</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}