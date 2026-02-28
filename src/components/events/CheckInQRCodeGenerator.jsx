import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Monitor, Download, User, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2canvas from 'html2canvas';

export default function CheckInQRCodeGenerator({ event }) {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showFullscreen, setShowFullscreen] = useState(false);

    useEffect(() => {
        generateCheckInUrl();
    }, [event]);

    const generateCheckInUrl = async () => {
        try {
            // Create a unique check-in URL for this event
            const checkInUrl = `${window.location.origin}/event-checkin?eventId=${event.id}&mode=walk-in`;
            
            // Generate QR code using free API
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkInUrl)}`;
            setQrCodeUrl(qrApiUrl);
        } catch (error) {
            console.error("Error generating check-in URL:", error);
        }
    };

    const downloadQRCode = async () => {
        const qrElement = document.getElementById('checkin-qr-code-image');
        if (qrElement) {
            const canvas = await html2canvas(qrElement);
            const link = document.createElement('a');
            link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '-')}-check-in-qr-code.png`;
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
                        <User className="w-5 h-5" />
                        Walk-In Check-In QR Code
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-2">
                        For attendees who didn't pre-register. Host scans this QR to quickly check them in.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900">
                            Use this QR code at the event entrance. Guests can scan it to register on-site, or you can use a camera to scan and create instant registrations for walk-in attendees.
                        </p>
                    </div>

                    {/* QR Code Display */}
                    <div className="flex justify-center">
                        <div id="checkin-qr-code-image" className="bg-white p-4 rounded-lg border-2 border-slate-200">
                            <img 
                                src={qrCodeUrl} 
                                alt="Check-In QR Code" 
                                className="w-64 h-64"
                            />
                            <p className="text-center text-sm text-slate-600 mt-2">
                                Check-In for {event.title}
                            </p>
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

                    <div className="mt-6 pt-6 border-t space-y-4 bg-orange-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900">How Walk-In Check-In Works</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-white font-bold text-sm">1</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-900">Display QR</p>
                                <p className="text-xs text-slate-600">At event entrance</p>
                            </div>

                            <div className="text-center p-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-white font-bold text-sm">2</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-900">Scan & Register</p>
                                <p className="text-xs text-slate-600">Quick registration</p>
                            </div>

                            <div className="text-center p-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-white font-bold text-sm">3</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-900">Checked In</p>
                                <p className="text-xs text-slate-600">Instant attendance</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fullscreen QR Code Dialog */}
            <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            Check-In for {event.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center flex-1 bg-white">
                        <div className="text-center space-y-4">
                            <img 
                                src={qrCodeUrl} 
                                alt="Check-In QR Code" 
                                className="w-96 h-96 mx-auto"
                            />
                            <p className="text-2xl font-bold text-slate-900">
                                {event.title}
                            </p>
                            <p className="text-lg text-slate-600">
                                Scan to check in - No pre-registration needed
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}