import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Eye, Settings } from 'lucide-react';
import PrinterSetup from "../printing/PrinterSetup";
import PrintPreview from "../printing/PrintPreview";
import { LabelTemplates } from "../printing/LabelTemplates";

export default function NameTagPrinter({ event }) {
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPrinterSetup, setShowPrinterSetup] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [printPreview, setPrintPreview] = useState(null);

    const loadRegistrations = async () => {
        setIsLoading(true);
        const regList = await base44.entities.EventRegistration.filter({ event_id: event.id });
        setRegistrations(regList);
        setIsLoading(false);
    };

    useEffect(() => {
        loadRegistrations();
        
        // Load saved printer
        const savedPrinterId = localStorage.getItem('eventBadgePrinter');
        if (savedPrinterId) {
            const printers = JSON.parse(localStorage.getItem('churchConnectPrinters') || '[]');
            const printer = printers.find(p => p.id === savedPrinterId);
            if (printer) setSelectedPrinter(printer);
        }
    }, [event.id]);

    const generateAllBadgesHTML = () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Name Tags - ${event.title}</title>
    <style>
        @media print {
            body { margin: 0; }
            .name-tag { page-break-inside: avoid; }
        }
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        .name-tags-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            max-width: 8.5in;
        }
        .name-tag {
            width: 4in;
            height: 3in;
            border: 2px solid #1e40af;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .church-name {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .attendee-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
            line-height: 1.2;
        }
        .event-title {
            font-size: 14px;
            color: #475569;
            margin-bottom: 12px;
            font-weight: 500;
        }
        .reg-code {
            font-size: 10px;
            color: #64748b;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <h1 style="text-align: center; margin-bottom: 30px;">Name Tags - ${event.title}</h1>
    <div class="name-tags-container">
        ${registrations.map(reg => `
            <div class="name-tag">
                <div class="church-name">REACH CHURCH</div>
                <div class="attendee-name">${reg.registrant_name}</div>
                <div class="event-title">${event.title}</div>
                <div class="reg-code">${reg.registration_code}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>
        `;
    };

    const handlePrintAllTags = () => {
        if (!selectedPrinter) {
            alert('Please select a printer first');
            setShowPrinterSetup(true);
            return;
        }

        setPrintPreview({
            content: generateAllBadgesHTML(),
            title: `Name Tags - ${event.title}`,
            paperSize: '8.5x11'
        });
    };

    const handleDownloadTags = () => {
        const html = generateAllBadgesHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `name-tags-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (showPrinterSetup) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Printer Setup</CardTitle>
                        <Button onClick={() => setShowPrinterSetup(false)} variant="outline" size="sm">
                            Back
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <PrinterSetup 
                        onPrinterSelected={(printer) => {
                            setSelectedPrinter(printer);
                            localStorage.setItem('eventBadgePrinter', printer.id);
                        }}
                        selectedPrinterId={selectedPrinter?.id}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <Printer className="w-5 h-5" />
                            Name Tag Printer
                        </CardTitle>
                        {selectedPrinter && (
                            <Badge className="bg-green-100 text-green-800">
                                {selectedPrinter.name}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                            <p className="font-semibold text-blue-900">Ready to Print</p>
                            <p className="text-blue-700">{registrations.length} name tags for {event.title}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                            {registrations.length} attendees
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {selectedPrinter ? (
                            <>
                                <Button onClick={handlePrintAllTags} className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Preview & Print
                                </Button>
                                <Button variant="outline" onClick={handleDownloadTags} className="flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Download HTML
                                </Button>
                                <Button variant="outline" onClick={() => setShowPrinterSetup(true)} className="flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    Printer Setup
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setShowPrinterSetup(true)} className="col-span-3 gap-2">
                                <Settings className="w-4 h-4" />
                                Setup Printer First
                            </Button>
                        )}
                    </div>

                    <div className="text-sm text-slate-600">
                        <p className="font-medium mb-2">Print Instructions:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Use standard 8.5" × 11" paper</li>
                            <li>Set margins to minimum (0.25" recommended)</li>
                            <li>Print in landscape orientation for best results</li>
                            <li>Consider using cardstock for durability</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Print Preview Modal */}
            {printPreview && (
                <PrintPreview
                    isOpen={true}
                    onClose={() => setPrintPreview(null)}
                    onPrint={() => setPrintPreview(null)}
                    content={printPreview.content}
                    title={printPreview.title}
                    paperSize={printPreview.paperSize}
                />
            )}
        </>
    );
}