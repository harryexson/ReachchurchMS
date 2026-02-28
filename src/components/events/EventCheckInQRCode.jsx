import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy } from 'lucide-react';
import { createPageUrl } from "@/utils";

export default function EventCheckInQRCode({ event, isOpen, onClose }) {
     const [qrCode, setQrCode] = useState(null);
     const [checkInUrl, setCheckInUrl] = useState('');
     const [copied, setCopied] = useState(false);

     if (!event) return null;

     useEffect(() => {
         if (isOpen && event) {
             generateQRCode();
         }
     }, [isOpen, event]);

    const generateQRCode = async () => {
        try {
            // Create check-in URL with walk-in mode
            const url = `${window.location.origin}${createPageUrl('EventCheckIn')}?eventId=${event.id}&mode=walk-in`;
            setCheckInUrl(url);

            // Generate QR code
            const qrDataUrl = await QRCode.toDataURL(url, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                quality: 0.95,
                margin: 2,
                width: 300,
            });
            setQrCode(qrDataUrl);
        } catch (error) {
            console.error('Failed to generate QR code:', error);
        }
    };

    const downloadQRCode = () => {
        if (!qrCode) return;
        
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `${event.title}-check-in-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyCheckInLink = () => {
        navigator.clipboard.writeText(checkInUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Check-In QR Code</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-slate-600 mb-4">
                            Display this QR code at your event. Attendees can scan to check in instantly.
                        </p>
                        <p className="text-sm font-medium text-slate-900 mb-2">{event.title}</p>
                    </div>

                    {qrCode && (
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <img src={qrCode} alt="Check-in QR Code" className="w-64 h-64" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-xs text-slate-500">Check-In Link:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={checkInUrl}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50"
                            />
                            <Button
                                onClick={copyCheckInLink}
                                variant="outline"
                                size="sm"
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        {copied && <p className="text-xs text-green-600">Copied!</p>}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={downloadQRCode}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download QR Code
                        </Button>
                        <Button onClick={onClose} variant="outline" className="flex-1">
                            Close
                        </Button>
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                        Print this QR code and display it at the event entrance for walk-in check-ins.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}