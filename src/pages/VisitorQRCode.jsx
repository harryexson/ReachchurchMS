import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Monitor, Download, ExternalLink, Copy, CheckCircle } from "lucide-react";
import QRCodeGenerator from "../components/links/QRCodeGenerator";

export default function VisitorQRCodePage() {
    const [qrUrl, setQrUrl] = useState('');
    const [displayUrl, setDisplayUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [churchSettings, setChurchSettings] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await base44.entities.ChurchSettings.list();
            let name = "Church";
            if (settings.length > 0) {
                setChurchSettings(settings[0]);
                name = settings[0].church_name || "Church";
            }
            
            // Use actual app URLs
            const visitorFormUrl = `${window.location.origin}${createPageUrl('PublicVisitorRegistration')}`;
            const displayScreenUrl = `${window.location.origin}${createPageUrl('VisitorQRDisplay')}`;
            
            setQrUrl(visitorFormUrl);
            setDisplayUrl(displayScreenUrl);
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(qrUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenDisplay = () => {
        window.open(displayUrl, '_blank', 'fullscreen=yes');
    };

    const handleDownloadQR = () => {
        const canvas = document.querySelector('#visitor-qr-code canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = 'visitor-qr-code.png';
            a.click();
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-purple-50/30 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <QrCode className="w-8 h-8 text-purple-600" />
                        Visitor Connect QR Code
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Generate QR codes for first-time visitor registration
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                            <CardTitle>QR Code</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div id="visitor-qr-code" className="flex justify-center mb-6">
                                <QRCodeGenerator 
                                    url={qrUrl}
                                    size={300}
                                />
                            </div>
                            <div className="space-y-3">
                                <Button onClick={handleDownloadQR} className="w-full" variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download QR Code
                                </Button>
                                <Button onClick={handleCopyUrl} className="w-full" variant="outline">
                                    {copied ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy Registration URL
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                            <CardTitle>Display Options</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h3 className="font-semibold text-blue-900 mb-2">📺 Project to Display</h3>
                                <p className="text-sm text-blue-800 mb-3">
                                    Open fullscreen QR code on any connected monitor or projector for visitors to scan
                                </p>
                                <Button onClick={handleOpenDisplay} className="w-full bg-blue-600 hover:bg-blue-700">
                                    <Monitor className="w-4 h-4 mr-2" />
                                    Open Display View
                                </Button>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h3 className="font-semibold text-green-900 mb-2">📱 Direct Link</h3>
                                <p className="text-sm text-green-800 mb-3">
                                    Share the direct registration link via text, email, or social media
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={qrUrl}
                                        readOnly
                                        className="flex-1 px-3 py-2 text-sm border rounded-md bg-white"
                                    />
                                    <Button onClick={handleCopyUrl} size="sm" variant="outline">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <h3 className="font-semibold text-purple-900 mb-2">🖨️ Print Materials</h3>
                                <p className="text-sm text-purple-800 mb-3">
                                    Download and print QR code for bulletins, signs, or handouts
                                </p>
                                <Button onClick={handleDownloadQR} className="w-full" variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download for Print
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-lg border-2 border-purple-200">
                    <CardHeader>
                        <CardTitle>How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-white font-bold text-xl">1</span>
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2">Visitor Scans</h3>
                                <p className="text-sm text-slate-600">
                                    First-time visitors scan the QR code with their smartphone
                                </p>
                            </div>

                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-white font-bold text-xl">2</span>
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2">Complete Form</h3>
                                <p className="text-sm text-slate-600">
                                    They fill out a simple connect card with their information
                                </p>
                            </div>

                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-white font-bold text-xl">3</span>
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2">Auto Follow-Up</h3>
                                <p className="text-sm text-slate-600">
                                    Visitor enters your system for automated follow-up
                                </p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-900">
                                <strong>💡 Pro Tip:</strong> Display the QR code on screens near entrances, in the lobby, 
                                or during announcements to make it easy for visitors to connect with your church.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}