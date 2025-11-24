import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, Settings, Info, ExternalLink } from "lucide-react";
import PrinterSetup from "../components/printing/PrinterSetup";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function PrinterSetupPage() {
    const [selectedPrinter, setSelectedPrinter] = useState(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                            <Printer className="w-10 h-10 text-blue-600" />
                            Printer Setup
                        </h1>
                        <p className="text-lg text-slate-600 mt-2">
                            Configure printers for labels, receipts, and tickets
                        </p>
                    </div>
                    <Link to={createPageUrl("HardwareSetupWizard")}>
                        <Button variant="outline" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Setup Wizard
                        </Button>
                    </Link>
                </div>

                {/* Info Card */}
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="w-5 h-5 text-blue-600" />
                    <AlertDescription>
                        <p className="font-semibold text-blue-900 mb-2">📝 Printer Configuration</p>
                        <p className="text-sm text-blue-800">
                            Add and manage your thermal printers, receipt printers, and label printers here. 
                            Once configured, they'll be available for:
                        </p>
                        <ul className="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
                            <li>Kids Check-In labels (child & parent copies)</li>
                            <li>Kitchen order tickets (coffee shop)</li>
                            <li>Customer receipts (coffee shop & bookstore)</li>
                            <li>Event registration badges</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                {/* Printer Setup Component */}
                <Card className="shadow-xl">
                    <CardContent className="p-6">
                        <PrinterSetup 
                            onPrinterSelected={setSelectedPrinter}
                            selectedPrinterId={selectedPrinter?.id}
                        />
                    </CardContent>
                </Card>

                {/* Quick Links */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Where to Use Your Printers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Link to={createPageUrl("KidsCheckIn")}>
                                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-400">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-purple-900 mb-1">👶 Kids Check-In</h3>
                                        <p className="text-sm text-purple-700">
                                            Print check-in labels with QR codes for secure child pick-up
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link to={createPageUrl("KitchenDisplay")}>
                                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-amber-400">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-amber-900 mb-1">☕ Kitchen Display</h3>
                                        <p className="text-sm text-amber-700">
                                            Print kitchen tickets for coffee shop orders
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link to={createPageUrl("CoffeeShopKiosk")}>
                                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-400">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-blue-900 mb-1">🛒 Coffee Shop Kiosk</h3>
                                        <p className="text-sm text-blue-700">
                                            Print customer receipts for orders
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link to={createPageUrl("Events")}>
                                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-400">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-green-900 mb-1">🎟️ Event Registration</h3>
                                        <p className="text-sm text-green-700">
                                            Print name badges for event attendees
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}