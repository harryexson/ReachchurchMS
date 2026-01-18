import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Download, Printer, Share2, Copy, CheckCircle, Monitor, Maximize } from "lucide-react";

export default function QRCodeDonation() {
    const [churchName, setChurchName] = useState("Our Church");
    const [donationUrl, setDonationUrl] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const [displays, setDisplays] = useState([]);
    const [selectedDisplay, setSelectedDisplay] = useState("");
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [isCasting, setIsCasting] = useState(false);
    const [branding, setBranding] = useState({
        logo_url: "",
        primary_color: "#3b82f6"
    });

    useEffect(() => {
        loadSettings();
        loadDisplays();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await base44.entities.ChurchSettings.list();
            let name = "Our Church";
            if (settings.length > 0) {
                const churchSettings = settings[0];
                name = churchSettings.church_name || "Our Church";
                setChurchName(name);
                setBranding({
                    logo_url: churchSettings.logo_url || "",
                    primary_color: churchSettings.primary_color || "#3b82f6"
                });
            }

            // Generate church-specific donation URL
            const churchSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const givingUrl = `https://reachchurchconnect.com/${churchSlug}/give`;
            setDonationUrl(givingUrl);

            // Generate QR code using QuickChart API
            const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(givingUrl)}&size=500&margin=2`;
            setQrCodeUrl(qrUrl);
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    };

    const loadDisplays = async () => {
        try {
            const activeDisplays = await base44.entities.Display.filter({ is_active: true });
            setDisplays(activeDisplays);
        } catch (error) {
            console.error("Error loading displays:", error);
        }
    };

    const handleProjectToDisplay = async () => {
        if (!selectedDisplay) {
            alert("Please select a display");
            return;
        }

        setIsCasting(true);
        try {
            // Create casting session
            const displayUrl = `https://reachchurchms.com/DisplayScreen?content=qr_donation`;
            
            await base44.entities.CastingSession.create({
                session_name: "QR Code Donation Display",
                content_type: "website",
                content_url: displayUrl,
                target_displays: [selectedDisplay],
                status: "active",
                loop_content: true
            });

            alert("QR Code is now displaying on the selected screen!");
            setShowProjectModal(false);
        } catch (error) {
            console.error("Error projecting to display:", error);
            alert("Failed to project to display. Please try again.");
        }
        setIsCasting(false);
    };

    const handleFullscreen = () => {
        const url = `https://reachchurchms.com/DisplayScreen?content=qr_donation`;
        window.open(url, '_blank', 'width=1920,height=1080');
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `${churchName.replace(/\s+/g, '-')}-Donation-QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=800,height=1000');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Donation QR Code - ${churchName}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 40px;
                    }
                    .logo {
                        max-width: 300px;
                        max-height: 100px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #333;
                        margin-bottom: 10px;
                    }
                    h2 {
                        color: ${branding.primary_color};
                        margin-bottom: 30px;
                    }
                    .qr-container {
                        margin: 40px auto;
                        padding: 20px;
                        border: 3px solid ${branding.primary_color};
                        border-radius: 20px;
                        display: inline-block;
                    }
                    .qr-code {
                        width: 400px;
                        height: 400px;
                    }
                    .instructions {
                        margin-top: 30px;
                        font-size: 18px;
                        color: #666;
                    }
                    @media print {
                        @page {
                            margin: 0.5in;
                        }
                    }
                </style>
            </head>
            <body>
                ${branding.logo_url ? `<img src="${branding.logo_url}" class="logo" alt="${churchName} Logo">` : ''}
                <h1>${churchName}</h1>
                <h2>📱 Scan to Give</h2>
                <div class="qr-container">
                    <img src="${qrCodeUrl}" class="qr-code" alt="Donation QR Code">
                </div>
                <div class="instructions">
                    <p><strong>How to Donate:</strong></p>
                    <ol style="text-align: left; max-width: 500px; margin: 20px auto; font-size: 16px;">
                        <li>Open your phone's camera</li>
                        <li>Point it at the QR code</li>
                        <li>Tap the notification to open the link</li>
                        <li>Complete your secure donation</li>
                    </ol>
                </div>
                <p style="margin-top: 40px; color: #999; font-size: 14px;">
                    Your donation is secure and tax-deductible. Thank you for your generosity!
                </p>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(donationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <QrCode className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-slate-900">QR Code Donations</h1>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription>
                        <p className="font-semibold text-blue-900 mb-2">💡 How it works:</p>
                        <p className="text-sm text-blue-800">
                            Display this QR code at your church, on bulletins, or share it digitally. 
                            Members can scan it with their phone camera to instantly access your donation page.
                        </p>
                    </AlertDescription>
                </Alert>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* QR Code Display */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Donation QR Code</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div 
                                className="p-6 rounded-xl border-4 bg-white flex items-center justify-center"
                                style={{ borderColor: branding.primary_color }}
                            >
                                {qrCodeUrl ? (
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="Donation QR Code"
                                        className="w-full max-w-sm"
                                    />
                                ) : (
                                    <div className="w-64 h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                                        <p className="text-slate-500">Loading QR Code...</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-slate-600">Scan with phone camera to donate</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions & Info */}
                    <div className="space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button 
                                    onClick={handleDownload}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download QR Code
                                </Button>

                                <Button 
                                    onClick={handlePrint}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print Display Page
                                </Button>

                                <Button 
                                    onClick={handleCopyUrl}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy Donation URL
                                        </>
                                    )}
                                </Button>

                                <Button 
                                    onClick={() => window.open(donationUrl, '_blank')}
                                    className="w-full justify-start"
                                    style={{ backgroundColor: branding.primary_color }}
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Test Donation Page
                                </Button>

                                <Button 
                                    onClick={handleFullscreen}
                                    className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                                >
                                    <Maximize className="w-4 h-4 mr-2" />
                                    Open Fullscreen View
                                </Button>

                                {displays.length > 0 && (
                                    <Button 
                                        onClick={() => setShowProjectModal(true)}
                                        className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Monitor className="w-4 h-4 mr-2" />
                                        Project to Display
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Donation URL</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 break-all text-sm font-mono">
                                    {donationUrl}
                                </div>
                            </CardContent>
                        </Card>

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
                                        <h3 className="font-bold text-slate-900 mb-2">Member Scans</h3>
                                        <p className="text-sm text-slate-600">
                                            Members scan the QR code with their smartphone camera
                                        </p>
                                    </div>

                                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-white font-bold text-2xl">2</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-2">Enter Amount</h3>
                                        <p className="text-sm text-slate-600">
                                            Choose donation amount and payment method
                                        </p>
                                    </div>

                                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-white font-bold text-2xl">3</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-2">Instant Receipt</h3>
                                        <p className="text-sm text-slate-600">
                                            Receive tax-deductible receipt via email immediately
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-900">
                                        <strong>💡 Pro Tip:</strong> Display the QR code on screens near entrances, in the lobby, 
                                        or during announcements to make it easy for members to give.
                                    </p>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <h4 className="font-semibold text-slate-900">How to Use</h4>
                                    <ul className="space-y-2 text-sm text-slate-700">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span><strong>Print and Display:</strong> Print this QR code and place it in your church lobby, bulletin, or website</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span><strong>Easy Giving:</strong> Members can instantly access your secure giving page</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span><strong>Multiple Options:</strong> Supports one-time and recurring donations</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span><strong>Instant Tracking:</strong> All donations appear immediately in your giving dashboard</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Project to Display Modal */}
                <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
                    <DialogContent>
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Project to Display</h2>
                            <p className="text-sm text-slate-600">
                                Select a connected display to show the donation QR code
                            </p>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Display:</label>
                                <Select value={selectedDisplay} onValueChange={setSelectedDisplay}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a display..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {displays.map(display => (
                                            <SelectItem key={display.id} value={display.id}>
                                                {display.display_name} - {display.location}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setShowProjectModal(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleProjectToDisplay}
                                    disabled={!selectedDisplay || isCasting}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isCasting ? "Projecting..." : "Project QR Code"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}