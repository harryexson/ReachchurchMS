import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, ExternalLink, Printer } from "lucide-react";
import QRCode from "qrcode";

export default function MemberRegistrationQRPage() {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [registrationUrl, setRegistrationUrl] = useState("");
    const [churchName, setChurchName] = useState("");

    useEffect(() => {
        loadChurchSettings();
    }, []);

    const loadChurchSettings = async () => {
        try {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                const name = settings[0].church_name || "Church";
                setChurchName(name);
                generateQRCode(name);
            } else {
                generateQRCode("Church");
            }
        } catch (error) {
            console.error("Error loading church settings:", error);
            generateQRCode("Church");
        }
    };

    const generateQRCode = async (name) => {
        const churchSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const url = `https://reachchurchconnect.com/${churchSlug}/member-registration`;
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

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white font-bold text-2xl">1</span>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">New Members Scan</h3>
                                <p className="text-sm text-slate-600">
                                    New Church Members can scan the QR code with their smartphone
                                </p>
                            </div>

                            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white font-bold text-2xl">2</span>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">Complete Form</h3>
                                <p className="text-sm text-slate-600">
                                    They fill out a simple membership connect card with their information
                                </p>
                            </div>

                            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white font-bold text-2xl">3</span>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">Auto Follow-Up</h3>
                                <p className="text-sm text-slate-600">
                                    Visitor enters your system for automated follow-up
                                </p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-900">
                                <strong>💡 Pro Tip:</strong> Display the QR code on screens near entrances, in the lobby, 
                                or during announcements to make it easy for visitors to connect with your church.
                            </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                            <h4 className="font-semibold text-slate-900">How to Use</h4>
                            <ul className="space-y-2 text-sm text-slate-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span>
                                    <span><strong>Print and Display:</strong> Print this QR code and place it in your church lobby, bulletin, or website</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span>
                                    <span><strong>New Members:</strong> People scan the code to fill out a member registration form</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span>
                                    <span><strong>Visitor Conversion:</strong> If they're already a visitor, they can upgrade to member status</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">•</span>
                                    <span><strong>Instant Updates:</strong> All registrations appear immediately in your Members directory</span>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}