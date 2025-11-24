import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function DisplayScreen() {
    const [churchName, setChurchName] = useState("Our Church");
    const [donationUrl, setDonationUrl] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [branding, setBranding] = useState({
        logo_url: "",
        primary_color: "#3b82f6"
    });

    useEffect(() => {
        loadSettings();
        
        // Auto-refresh every 30 seconds to keep display fresh
        const interval = setInterval(loadSettings, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                const churchSettings = settings[0];
                setChurchName(churchSettings.church_name || "Our Church");
                setBranding({
                    logo_url: churchSettings.logo_url || "",
                    primary_color: churchSettings.primary_color || "#3b82f6"
                });
            }

            // Generate public donation URL
            const baseUrl = window.location.origin;
            const givingUrl = `${baseUrl}/PublicGiving`;
            setDonationUrl(givingUrl);

            // Generate QR code
            const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(givingUrl)}&size=800&margin=2`;
            setQrCodeUrl(qrUrl);
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    };

    // Get content type from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const contentType = urlParams.get('content');

    if (contentType === 'qr_donation') {
        return (
            <div 
                className="min-h-screen flex flex-col items-center justify-center p-12"
                style={{
                    background: `linear-gradient(135deg, ${branding.primary_color}15 0%, ${branding.primary_color}25 100%)`
                }}
            >
                <div className="text-center space-y-8 max-w-4xl">
                    {branding.logo_url && (
                        <img 
                            src={branding.logo_url} 
                            alt={`${churchName} Logo`}
                            className="h-32 w-auto max-w-2xl mx-auto object-contain"
                        />
                    )}
                    
                    <h1 className="text-7xl font-bold text-slate-900 mb-4">
                        Give to {churchName}
                    </h1>
                    
                    <p className="text-3xl text-slate-700 mb-8">
                        Scan with your phone camera to donate
                    </p>
                    
                    <div 
                        className="inline-block p-12 rounded-3xl border-8 bg-white shadow-2xl"
                        style={{ borderColor: branding.primary_color }}
                    >
                        {qrCodeUrl && (
                            <img 
                                src={qrCodeUrl} 
                                alt="Donation QR Code"
                                className="w-[600px] h-[600px]"
                            />
                        )}
                    </div>
                    
                    <div className="mt-12 space-y-4">
                        <p className="text-2xl font-semibold text-slate-800">How to Donate:</p>
                        <div className="grid grid-cols-2 gap-8 text-left max-w-3xl mx-auto">
                            <div className="flex items-start gap-4 bg-white/70 p-6 rounded-xl">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                                    style={{ backgroundColor: branding.primary_color }}
                                >
                                    1
                                </div>
                                <p className="text-xl text-slate-800">Open your phone camera</p>
                            </div>
                            <div className="flex items-start gap-4 bg-white/70 p-6 rounded-xl">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                                    style={{ backgroundColor: branding.primary_color }}
                                >
                                    2
                                </div>
                                <p className="text-xl text-slate-800">Point at the QR code</p>
                            </div>
                            <div className="flex items-start gap-4 bg-white/70 p-6 rounded-xl">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                                    style={{ backgroundColor: branding.primary_color }}
                                >
                                    3
                                </div>
                                <p className="text-xl text-slate-800">Tap the notification</p>
                            </div>
                            <div className="flex items-start gap-4 bg-white/70 p-6 rounded-xl">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                                    style={{ backgroundColor: branding.primary_color }}
                                >
                                    4
                                </div>
                                <p className="text-xl text-slate-800">Complete your gift</p>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-xl text-slate-600 mt-8">
                        Your donation is secure and tax-deductible
                    </p>
                </div>
            </div>
        );
    }

    // Default display view
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-900">Display Screen</h1>
                <p className="text-slate-600 mt-4">Waiting for content...</p>
            </div>
        </div>
    );
}