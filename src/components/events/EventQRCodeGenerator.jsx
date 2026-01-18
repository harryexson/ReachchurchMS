import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Copy, Share2, Monitor, Download, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import html2canvas from 'html2canvas';

export default function EventQRCodeGenerator({ event, registrationUrl }) {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [churchSpecificUrl, setChurchSpecificUrl] = useState('');

    useEffect(() => {
        loadChurchAndGenerateUrl();
    }, [event]);

    const loadChurchAndGenerateUrl = async () => {
        try {
            const settings = await base44.entities.ChurchSettings.list();
            let name = "Church";
            if (settings.length > 0) {
                name = settings[0].church_name || "Church";
            }
            
            // Generate church-specific event registration URL
            const churchSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const eventSlug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const url = `https://reachchurchMS.com/${churchSlug}/event/${eventSlug}/register`;
            setChurchSpecificUrl(url);
            
            // Generate QR code using free API
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
            setQrCodeUrl(qrApiUrl);
        } catch (error) {
            console.error("Error generating church-specific URL:", error);
            // Fallback to original registrationUrl if provided
            if (registrationUrl) {
                setChurchSpecificUrl(registrationUrl);
                const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(registrationUrl)}`;
                setQrCodeUrl(qrApiUrl);
            }
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(churchSpecificUrl || registrationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToSocial = (platform) => {
        const text = `Register for ${event.title}`;
        const url = churchSpecificUrl || registrationUrl;
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
        };
        
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    };

    const downloadQRCode = async () => {
        const qrElement = document.getElementById('qr-code-image');
        if (qrElement) {
            const canvas = await html2canvas(qrElement);
            const link = document.createElement('a');
            link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-qr-code.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const projectToDisplay = () => {
        setShowFullscreen(true);
    };

    return (
        <>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        Registration QR Code & Links
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* QR Code Display */}
                    <div className="flex justify-center">
                        <div id="qr-code-image" className="bg-white p-4 rounded-lg border-2 border-slate-200">
                            <img 
                                src={qrCodeUrl} 
                                alt="Registration QR Code" 
                                className="w-64 h-64"
                            />
                            <p className="text-center text-sm text-slate-600 mt-2">
                                Scan to Register for {event.title}
                            </p>
                        </div>
                    </div>

                    {/* Registration Link */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Direct Registration Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={churchSpecificUrl || registrationUrl}
                                readOnly
                                className="flex-1 px-3 py-2 border rounded-md bg-slate-50 text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyLink}
                            >
                                <Copy className="w-4 h-4 mr-1" />
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={projectToDisplay}
                            className="text-blue-700 border-blue-300 hover:bg-blue-50"
                        >
                            <Monitor className="w-4 h-4 mr-2" />
                            Project QR
                        </Button>
                        <Button
                            variant="outline"
                            onClick={downloadQRCode}
                            className="text-green-700 border-green-300 hover:bg-green-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </div>

                    {/* Social Sharing */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Share Registration Link</label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('whatsapp')}
                                className="text-green-700 hover:bg-green-50"
                            >
                                WhatsApp
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('email')}
                                className="text-blue-700 hover:bg-blue-50"
                            >
                                Email
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('facebook')}
                                className="text-blue-800 hover:bg-blue-50"
                            >
                                Facebook
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial('twitter')}
                                className="text-sky-700 hover:bg-sky-50"
                            >
                                Twitter
                            </Button>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(churchSpecificUrl || registrationUrl, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Registration Page
                    </Button>

                    <div className="mt-6 pt-6 border-t space-y-4">
                        <h4 className="font-semibold text-slate-900">How It Works</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-white font-bold text-lg">1</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-900 mb-1">Guest Scans</p>
                                <p className="text-xs text-slate-600">Scan QR code to register</p>
                            </div>

                            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-white font-bold text-lg">2</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-900 mb-1">Fill Form</p>
                                <p className="text-xs text-slate-600">Enter details quickly</p>
                            </div>

                            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-white font-bold text-lg">3</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-900 mb-1">Confirmed</p>
                                <p className="text-xs text-slate-600">Instant confirmation</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-900">
                                <strong>💡 Pro Tip:</strong> Project this QR code during announcements or display at entrances for easy event registration.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fullscreen QR Code Dialog */}
            <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            Scan to Register for {event.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center flex-1 bg-white">
                        <div className="text-center space-y-4">
                            <img 
                                src={qrCodeUrl} 
                                alt="Registration QR Code" 
                                className="w-96 h-96 mx-auto"
                            />
                            <p className="text-2xl font-bold text-slate-900">
                                {event.title}
                            </p>
                            <p className="text-lg text-slate-600">
                                Scan with your phone camera to register
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}