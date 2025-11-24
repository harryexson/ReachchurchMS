import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";

export default function QRCodeGenerator({ url, label, filename }) {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const generateQRCode = async () => {
            setIsGenerating(true);
            try {
                // Using QR Server API (free, no API key needed)
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
                setQrCodeUrl(qrUrl);
            } catch (error) {
                console.error("Failed to generate QR code:", error);
            }
            setIsGenerating(false);
        };

        generateQRCode();
    }, [url]);

    const downloadQRCode = async () => {
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${filename || 'qrcode'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Failed to download QR code:", error);
            alert("Failed to download QR code. Please try again.");
        }
    };

    if (isGenerating) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <Card className="border-2 border-slate-200">
            <CardContent className="p-4 text-center space-y-3">
                <p className="font-semibold text-slate-900">{label}</p>
                {qrCodeUrl && (
                    <img 
                        src={qrCodeUrl} 
                        alt={`QR Code for ${label}`}
                        className="mx-auto border-4 border-slate-100 rounded-lg"
                        style={{ width: '200px', height: '200px' }}
                    />
                )}
                <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    size="sm"
                    className="w-full"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                </Button>
            </CardContent>
        </Card>
    );
}