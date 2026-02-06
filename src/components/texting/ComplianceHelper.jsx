import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";

export default function ComplianceHelper() {
    const [churchSettings, setChurchSettings] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [churchName, setChurchName] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                setChurchSettings(settings[0]);
                setChurchName(settings[0].church_name);
                setPhoneNumber(settings[0].sinch_phone_number);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        setIsLoading(false);
    };

    const defaultPrivacyUrl = churchSettings?.website_url 
        ? `${churchSettings.website_url}/sms-privacy` 
        : "https://www.yourchurch.org/sms-privacy";

    const defaultTermsUrl = churchSettings?.website_url 
        ? `${churchSettings.website_url}/sms-terms` 
        : "https://www.yourchurch.org/sms-terms";

    const privacyUrl = churchSettings?.sms_privacy_policy_url || defaultPrivacyUrl;
    const termsUrl = churchSettings?.sms_terms_url || defaultTermsUrl;

    const generateCompliantMessage = () => {
        const name = churchName || "[Your Church Name]";
        const phone = phoneNumber || "[Your SMS Number]";
        
        return `Text JOIN to ${phone} to receive church updates from ${name}. Message frequency varies (1-4 msgs/month). Msg & data rates may apply. Reply STOP to opt out, HELP for help.
Privacy: ${privacyUrl}
Terms: ${termsUrl}`;
    };

    const copyMessage = () => {
        navigator.clipboard.writeText(generateCompliantMessage());
        toast.success("Compliance text copied to clipboard!");
    };

    const hasPrivacyUrl = !!churchSettings?.sms_privacy_policy_url;
    const hasTermsUrl = !!churchSettings?.sms_terms_url;
    const hasPhoneNumber = !!phoneNumber;
    const hasChurchName = !!churchName;

    const isFullyCompliant = hasPrivacyUrl && hasTermsUrl && hasPhoneNumber && hasChurchName;

    if (isLoading) {
        return null;
    }

    return (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isFullyCompliant ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    TCPA Compliance Assistant
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                        Required Elements Status:
                    </p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            {hasChurchName ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span>Church Name: {hasChurchName ? churchName : "Not set"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            {hasPhoneNumber ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span>SMS Number: {hasPhoneNumber ? phoneNumber : "Not configured"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            {hasPrivacyUrl ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span>Privacy Policy URL: {hasPrivacyUrl ? "Set" : "Using default"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            {hasTermsUrl ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span>Terms URL: {hasTermsUrl ? "Set" : "Using default"}</span>
                        </div>
                    </div>
                </div>

                {!isFullyCompliant && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <AlertDescription className="text-sm text-yellow-800">
                            Go to Church Settings to add your SMS Privacy Policy and Terms URLs for full compliance.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                        TCPA-Compliant Opt-in Text:
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-blue-200 text-sm font-mono whitespace-pre-wrap">
                        {generateCompliantMessage()}
                    </div>
                    <Button 
                        onClick={copyMessage}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Compliance Text
                    </Button>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                    <p className="font-semibold">What this includes:</p>
                    <ul className="list-disc ml-4 space-y-1">
                        <li>Clear call-to-action (Text JOIN to [number])</li>
                        <li>Your church/organization name</li>
                        <li>Message frequency disclosure (1-4 msgs/month)</li>
                        <li>Standard rates disclaimer</li>
                        <li>STOP opt-out instructions</li>
                        <li>HELP keyword for support</li>
                        <li>Privacy policy link</li>
                        <li>Terms of service link</li>
                    </ul>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-xs text-blue-800">
                        <strong>Best Practice:</strong> Use this exact text on your website, 
                        printed materials, and anywhere you promote SMS opt-ins. This ensures 
                        TCPA compliance and protects your organization from legal liability.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}