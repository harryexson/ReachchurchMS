import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, ExternalLink, Printer } from "lucide-react";
import QRCode from "qrcode";

export default function MemberRegistrationQRPage() {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [registrationUrl, setRegistrationUrl] = useState("");

    useEffect(() => {
        generateQRCode();
    }, []);

    const generateQRCode = async () => {
        const url = `${window.location.origin}/publicmemberregistration`;
        setRegistrationUrl(url);

        try {
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 400,
                margin: 2,
                color: {
                    dark: "#1e293b",
                    light: "#ffffff"
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (error) {
            console.error("Failed to generate QR code:", error);
        }
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = qrCodeUrl;
        link.download = "member-registration-qr-code.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
                <head>
                    <title>Member Registration QR Code</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            font-family: Arial, sans-serif;
                        }
                        .container {
                            text-align: center;
                            padding: 40px;
                        }
                        h1 {
                            font-size: 32px;
                            color: #1e293b;
                            margin-bottom: 10px;
                        }
                        p {
                            font-size: 18px;
                            color: #64748b;
                            margin-bottom: 30px;
                        }
                        img {
                            max-width: 400px;
                            margin: 20px 0;
                        }
                        .url {
                            font-size: 14px;
                            color: #64748b;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Become a Member</h1>
                        <p>Scan to register as a new member</p>
                        <img src="${qrCodeUrl}" alt="Member Registration QR Code" />
                        <p class="url">${registrationUrl}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Member Registration QR Code</h1>
                    <p className="text-slate-600 mt-1">Generate QR codes for new member registration</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-blue-600" />
                                QR Code Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {qrCodeUrl && (
                                <div className="bg-white p-6 rounded-lg border-2 border-blue-200 flex justify-center">
                                    <img src={qrCodeUrl} alt="Member Registration QR Code" className="w-full max-w-sm" />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={handleDownload} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                                <Button onClick={handlePrint} variant="outline" className="flex-1">
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Registration URL</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg border">
                                <p className="text-xs text-slate-500 mb-2">Direct Link:</p>
                                <p className="text-sm font-mono text-slate-900 break-all">{registrationUrl}</p>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    navigator.clipboard.writeText(registrationUrl);
                                    alert("URL copied to clipboard!");
                                }}
                            >
                                Copy URL
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => window.open(registrationUrl, "_blank")}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Preview Form
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-slate-900 mb-3">💡 How to Use</h3>
                        <ul className="text-sm text-slate-700 space-y-2">
                            <li>• <strong>Print and Display:</strong> Print this QR code and place it in your church lobby, bulletin, or website</li>
                            <li>• <strong>New Members:</strong> People scan the code to fill out a member registration form</li>
                            <li>• <strong>Visitor Conversion:</strong> If they're already a visitor, they can upgrade to member status</li>
                            <li>• <strong>Instant Updates:</strong> All registrations appear immediately in your Members directory</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}