import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Shield, MessageSquare, Mail, Bell, CheckCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PrivacyConsentPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [preferences, setPreferences] = useState({
        sms_consent: false,
        email_consent: true,
        marketing_consent: false,
        phone_number: ""
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUserPreferences();
    }, []);

    const loadUserPreferences = async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);
            setPreferences({
                sms_consent: user.sms_consent || false,
                email_consent: user.email_consent !== false,
                marketing_consent: user.marketing_consent || false,
                phone_number: user.phone_number || ""
            });
        } catch (error) {
            console.error("Failed to load user preferences:", error);
        }
        setIsLoading(false);
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const updateData = {
                ...preferences,
                sms_consent_date: preferences.sms_consent ? new Date().toISOString() : currentUser.sms_consent_date,
                email_consent_date: preferences.email_consent ? new Date().toISOString() : currentUser.email_consent_date,
                consent_ip_address: "user-updated"
            };

            await User.updateMyUserData(updateData);
            setSaveSuccess(true);
            
            await loadUserPreferences();

            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to save preferences:", error);
            alert("Failed to save preferences. Please try again.");
        }
        
        setIsSaving(false);
    };

    const handleToggle = (field, value) => {
        setPreferences(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Shield className="w-10 h-10 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Privacy & Communications</h1>
                        <p className="text-slate-600 mt-1">Manage your communication preferences and privacy settings</p>
                    </div>
                </div>

                <Tabs defaultValue="preferences" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preferences">Communication Preferences</TabsTrigger>
                        <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preferences">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Your Communication Preferences</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-4 p-6 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-start gap-4">
                                        <MessageSquare className="w-6 h-6 text-green-600 mt-1" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-green-900">SMS Text Messages</h3>
                                                    <p className="text-sm text-green-800 mt-1">
                                                        Receive important updates, prayer requests, and event reminders via text message.
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={preferences.sms_consent}
                                                    onCheckedChange={(value) => handleToggle('sms_consent', value)}
                                                />
                                            </div>

                                            {preferences.sms_consent && (
                                                <div className="space-y-3 mt-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="phone_number">Your Phone Number *</Label>
                                                        <Input
                                                            id="phone_number"
                                                            type="tel"
                                                            placeholder="+1 (555) 123-4567"
                                                            value={preferences.phone_number}
                                                            onChange={(e) => handleToggle('phone_number', e.target.value)}
                                                        />
                                                    </div>
                                                    
                                                    <div className="bg-white p-4 rounded border border-green-300">
                                                        <h4 className="font-semibold text-sm text-green-900 mb-2">📱 SMS Consent Agreement</h4>
                                                        <p className="text-xs text-green-800 leading-relaxed">
                                                            By opting in, you consent to receive automated text messages from REACH ChurchConnect to the phone number provided. 
                                                            Message frequency varies. Message and data rates may apply. Reply HELP for help, STOP to cancel. 
                                                            You can opt out at any time by texting STOP or updating your preferences here.
                                                        </p>
                                                        {currentUser?.sms_consent_date && (
                                                            <p className="text-xs text-green-600 mt-2">
                                                                ✓ Consent given: {new Date(currentUser.sms_consent_date).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-4">
                                        <Mail className="w-6 h-6 text-blue-600 mt-1" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-blue-900">Email Communications</h3>
                                                    <p className="text-sm text-blue-800 mt-1">
                                                        Receive newsletters, announcements, and important church updates via email.
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={preferences.email_consent}
                                                    onCheckedChange={(value) => handleToggle('email_consent', value)}
                                                />
                                            </div>

                                            <div className="bg-white p-4 rounded border border-blue-300">
                                                <p className="text-xs text-blue-800 leading-relaxed">
                                                    We'll send you important church communications, event invitations, and updates to: <strong>{currentUser?.email}</strong>
                                                </p>
                                                {currentUser?.email_consent_date && (
                                                    <p className="text-xs text-blue-600 mt-2">
                                                        ✓ Consent given: {new Date(currentUser.email_consent_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-6 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="flex items-start gap-4">
                                        <Bell className="w-6 h-6 text-purple-600 mt-1" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-purple-900">Marketing & Special Offers</h3>
                                                    <p className="text-sm text-purple-800 mt-1">
                                                        Receive information about special events, conferences, and optional programs.
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={preferences.marketing_consent}
                                                    onCheckedChange={(value) => handleToggle('marketing_consent', value)}
                                                />
                                            </div>

                                            <div className="bg-white p-4 rounded border border-purple-300">
                                                <p className="text-xs text-purple-800 leading-relaxed">
                                                    This includes non-essential communications such as special event promotions, ministry highlights, and community updates. 
                                                    You can opt out anytime without affecting essential church communications.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-6 border-t">
                                    <div>
                                        {saveSuccess && (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-sm font-medium">Preferences saved successfully!</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button 
                                        onClick={handleSavePreferences}
                                        disabled={isSaving || (preferences.sms_consent && !preferences.phone_number)}
                                        size="lg"
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSaving ? "Saving..." : "Save Preferences"}
                                    </Button>
                                </div>

                                {preferences.sms_consent && !preferences.phone_number && (
                                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Please enter your phone number to enable SMS notifications</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Privacy Policy & Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-lg font-semibold text-slate-900">Data Collection & Usage</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        REACH ChurchConnect collects and processes your personal information to provide church management services. 
                                        We collect your name, email address, phone number (if you opt in to SMS), and church membership information.
                                    </p>

                                    <h3 className="text-lg font-semibold text-slate-900 mt-6">How We Use Your Information</h3>
                                    <ul className="text-sm text-slate-700 space-y-2 list-disc ml-5">
                                        <li>To provide essential church management services</li>
                                        <li>To send you important church communications and updates</li>
                                        <li>To process your donations and maintain giving records</li>
                                        <li>To manage event registrations and volunteer sign-ups</li>
                                        <li>To send SMS messages (only if you opt in)</li>
                                        <li>To improve our services and user experience</li>
                                    </ul>

                                    <h3 className="text-lg font-semibold text-slate-900 mt-6">SMS/Text Messaging Terms (TCPA Compliance)</h3>
                                    <div className="bg-green-50 p-4 rounded border border-green-200">
                                        <p className="text-sm text-green-900 leading-relaxed mb-3">
                                            By providing your phone number and opting in to SMS communications, you expressly consent to receive 
                                            automated text messages from REACH ChurchConnect to the mobile number provided.
                                        </p>
                                        <ul className="text-sm text-green-900 space-y-1 list-disc ml-5">
                                            <li>Consent is not a condition of purchase or service</li>
                                            <li>Message frequency varies by church activity</li>
                                            <li>Message and data rates may apply</li>
                                            <li>You can opt out at any time by texting STOP</li>
                                            <li>Text HELP for assistance</li>
                                            <li>Carriers are not liable for delayed or undelivered messages</li>
                                        </ul>
                                    </div>

                                    <h3 className="text-lg font-semibold text-slate-900 mt-6">Data Sharing & Security</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        We do not sell your personal information to third parties. Your data is shared only with:
                                    </p>
                                    <ul className="text-sm text-slate-700 space-y-1 list-disc ml-5">
                                        <li>Your church administrators (for church management purposes)</li>
                                        <li>Service providers necessary for platform operations (Stripe, Twilio)</li>
                                        <li>As required by law or legal process</li>
                                    </ul>

                                    <h3 className="text-lg font-semibold text-slate-900 mt-6">Your Rights</h3>
                                    <ul className="text-sm text-slate-700 space-y-1 list-disc ml-5">
                                        <li>Access your personal data</li>
                                        <li>Correct inaccurate information</li>
                                        <li>Request deletion of your data</li>
                                        <li>Opt out of communications at any time</li>
                                        <li>Withdraw consent for data processing</li>
                                        <li>Export your data in a portable format</li>
                                    </ul>

                                    <h3 className="text-lg font-semibold text-slate-900 mt-6">Contact Us</h3>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        For questions about privacy or to exercise your rights:
                                    </p>
                                    <div className="bg-slate-100 p-4 rounded mt-2">
                                        <p className="text-sm font-medium">REACH ChurchConnect Support</p>
                                        <p className="text-sm">Email: privacy@churchconnect.com</p>
                                        <p className="text-sm">Phone: 1-800-CHURCH-1</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}