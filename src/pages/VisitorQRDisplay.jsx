import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import QRCodeGenerator from "../components/links/QRCodeGenerator";

export default function VisitorQRDisplay() {
    const [qrUrl, setQrUrl] = useState('');
    const [churchSettings, setChurchSettings] = useState(null);

    // CRITICAL: Get organization ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orgId = urlParams.get('org');

    useEffect(() => {
        loadSettings();
        const baseUrl = window.location.origin;
        // Include org parameter in visitor form URL
        const visitorFormUrl = `${baseUrl}${createPageUrl('PublicVisitorRegistration')}?org=${orgId}`;
        setQrUrl(visitorFormUrl);

        // Request fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => console.log(err));
        }
    }, [orgId]);

    const loadSettings = async () => {
        try {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                setChurchSettings(settings[0]);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    const churchName = churchSettings?.church_name || 'Our Church';
    const primaryColor = churchSettings?.primary_color || '#3b82f6';
    const logoUrl = churchSettings?.logo_url;

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center p-8"
            style={{
                background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`
            }}
        >
            <div className="text-center max-w-4xl mx-auto space-y-8">
                {logoUrl && (
                    <img 
                        src={logoUrl} 
                        alt={churchName}
                        className="h-24 w-auto max-w-md mx-auto mb-8"
                    />
                )}

                <div>
                    <h1 className="text-6xl font-bold text-slate-900 mb-4">
                        Welcome to {churchName}!
                    </h1>
                    <p className="text-3xl text-slate-700 mb-2">
                        We're glad you're here
                    </p>
                    <p className="text-2xl text-slate-600">
                        Scan the QR code to connect with us
                    </p>
                </div>

                <div 
                    className="bg-white p-12 rounded-3xl shadow-2xl inline-block"
                    style={{ borderColor: primaryColor, borderWidth: '4px' }}
                >
                    <QRCodeGenerator 
                        url={qrUrl}
                        size={400}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4 text-xl text-slate-700">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            <span>Open your camera</span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                            <span>Point at QR code</span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                            <span>Fill out form</span>
                        </div>
                    </div>

                    <p className="text-lg text-slate-500">
                        No app download required • Quick & easy • Secure
                    </p>
                </div>
            </div>

            <div className="fixed bottom-8 right-8 text-sm text-slate-400">
                Press ESC to exit fullscreen
            </div>
        </div>
    );
}