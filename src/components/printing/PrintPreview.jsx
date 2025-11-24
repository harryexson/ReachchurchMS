import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, Download, X, AlertTriangle, CheckCircle } from "lucide-react";

export default function PrintPreview({ isOpen, onClose, onPrint, content, title, paperSize = '4x6', selectedPrinter }) {
    const iframeRef = useRef(null);
    const [printReady, setPrintReady] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // Paper size configurations for thermal printers
    const paperSizes = {
        '2.25x4': { width: '2.25in', height: '4in', margin: '0.1in' },
        '3x8': { width: '3in', height: '8in', margin: '0.15in' },
        '4x6': { width: '4in', height: '6in', margin: '0.2in' },
        '8.5x11': { width: '8.5in', height: '11in', margin: '0.5in' }
    };

    const currentSize = paperSizes[paperSize] || paperSizes['4x6'];

    useEffect(() => {
        if (isOpen && content && iframeRef.current) {
            const iframe = iframeRef.current;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            const fullHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title || 'Print'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }

        /* Page setup for thermal printer */
        @page {
            size: ${currentSize.width} ${currentSize.height};
            margin: ${currentSize.margin};
        }

        /* For RONGTA and other thermal printers - use exact dimensions */
        @media print {
            html, body {
                width: ${currentSize.width};
                height: ${currentSize.height};
                margin: 0 !important;
                padding: 0 !important;
            }
            
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            /* Hide everything except print content */
            body > *:not(.print-content) {
                display: none !important;
            }

            .print-content {
                width: 100% !important;
                height: auto !important;
                page-break-inside: avoid !important;
                page-break-after: auto !important;
            }

            /* Ensure images print correctly */
            img {
                max-width: 100% !important;
                height: auto !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* Ensure QR codes and barcodes print clearly */
            .qr-code, .barcode {
                image-rendering: pixelated !important;
                image-rendering: crisp-edges !important;
            }

            /* Remove any transforms or filters */
            * {
                transform: none !important;
                filter: none !important;
            }
        }

        /* Screen preview styles */
        @media screen {
            body {
                background: #f0f0f0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: flex-start;
            }

            .print-content {
                background: white;
                width: ${currentSize.width};
                min-height: ${currentSize.height};
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                padding: ${currentSize.margin};
            }
        }
    </style>
</head>
<body>
    <div class="print-content">
        ${content}
    </div>
</body>
</html>`;

            iframeDoc.open();
            iframeDoc.write(fullHTML);
            iframeDoc.close();

            // Wait for content to load
            setTimeout(() => {
                setPrintReady(true);
            }, 500);
        }
    }, [isOpen, content, title, currentSize, paperSize]);

    const handlePrint = () => {
        if (!iframeRef.current || !printReady) {
            alert('Print preview is still loading. Please wait a moment.');
            return;
        }

        try {
            const iframe = iframeRef.current;
            const iframeWindow = iframe.contentWindow || iframe;

            // Focus the iframe before printing
            iframeWindow.focus();

            // Trigger print
            iframeWindow.print();

            // Call the onPrint callback after a delay
            setTimeout(() => {
                if (onPrint) onPrint();
            }, 500);
        } catch (error) {
            console.error('Print error:', error);
            alert('Failed to print. Please try downloading as HTML and printing manually.');
            setShowInstructions(true);
        }
    };

    const handleDownload = () => {
        if (!iframeRef.current) return;

        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const htmlContent = iframeDoc.documentElement.outerHTML;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title?.replace(/\s+/g, '_') || 'print'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{title || 'Print Preview'}</span>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {/* RONGTA Printer Setup Alert */}
                    {selectedPrinter?.name?.toLowerCase().includes('rongta') && (
                        <Alert className="mb-4 bg-blue-50 border-blue-200">
                            <Printer className="w-5 h-5 text-blue-600" />
                            <AlertDescription>
                                <p className="font-semibold text-blue-900 mb-2">🖨️ RONGTA Printer Detected</p>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p><strong>Important Setup Steps:</strong></p>
                                    <ol className="list-decimal ml-5 mt-2 space-y-1">
                                        <li>Make sure your RONGTA printer is turned ON and connected</li>
                                        <li>In Chrome, click Print → More settings</li>
                                        <li>Set "Paper size" to match your label size ({paperSize})</li>
                                        <li>Set "Margins" to "None" or "Minimum"</li>
                                        <li>Enable "Background graphics" option</li>
                                        <li>Disable "Headers and footers"</li>
                                        <li>Set "Scale" to 100%</li>
                                    </ol>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowInstructions(!showInstructions)}
                                        className="mt-3"
                                    >
                                        {showInstructions ? 'Hide' : 'Show'} Detailed Instructions
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Detailed Instructions */}
                    {showInstructions && (
                        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <AlertDescription>
                                <p className="font-semibold text-yellow-900 mb-2">📋 Troubleshooting RONGTA Thermal Printer</p>
                                <div className="text-sm text-yellow-800 space-y-3">
                                    <div>
                                        <p className="font-semibold">1. Check Printer Connection:</p>
                                        <ul className="list-disc ml-5 mt-1">
                                            <li>USB: Make sure cable is plugged in securely</li>
                                            <li>Bluetooth: Verify printer is paired in Windows/Mac settings</li>
                                            <li>WiFi: Confirm printer and computer are on same network</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="font-semibold">2. Configure Chrome Print Settings:</p>
                                        <ul className="list-disc ml-5 mt-1">
                                            <li>Click "Print" button below</li>
                                            <li>In Chrome print dialog, click "More settings"</li>
                                            <li>Select your RONGTA printer from "Destination"</li>
                                            <li>Set Paper size to "{paperSize}" or closest match</li>
                                            <li>Set Margins to "None"</li>
                                            <li>Turn ON "Background graphics"</li>
                                            <li>Turn OFF "Headers and footers"</li>
                                            <li>Set Scale to "Default" or "100"</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="font-semibold">3. Common Issues:</p>
                                        <ul className="list-disc ml-5 mt-1">
                                            <li><strong>Blank prints:</strong> Enable "Background graphics" in Chrome print settings</li>
                                            <li><strong>Cut off text:</strong> Set margins to "None" and check paper size</li>
                                            <li><strong>Wrong size:</strong> Make sure label size in printer settings matches {paperSize}</li>
                                            <li><strong>Printer not found:</strong> Check USB cable or Bluetooth pairing</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="font-semibold">4. Alternative: Download & Print</p>
                                        <p className="mt-1">If printing directly doesn't work:</p>
                                        <ul className="list-disc ml-5 mt-1">
                                            <li>Click "Download HTML" button below</li>
                                            <li>Open the downloaded file in Chrome</li>
                                            <li>Press Ctrl+P (Windows) or Cmd+P (Mac)</li>
                                            <li>Configure settings as above and print</li>
                                        </ul>
                                    </div>

                                    <div className="bg-white p-3 rounded border border-yellow-300 mt-3">
                                        <p className="font-semibold text-yellow-900">💡 Pro Tip for RONGTA Users:</p>
                                        <p className="mt-1">Save these Chrome print settings as default by clicking "Save" in the print dialog after configuring. This way you won't have to adjust them every time!</p>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Print Ready Status */}
                    {printReady ? (
                        <Alert className="mb-4 bg-green-50 border-green-200">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <AlertDescription>
                                <p className="font-semibold text-green-900">✅ Print preview loaded successfully</p>
                                <p className="text-sm text-green-700 mt-1">
                                    Paper size: {paperSize} | Ready to print to {selectedPrinter?.name || 'default printer'}
                                </p>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="mb-4">
                            <AlertDescription>
                                <p className="text-sm">Loading print preview...</p>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Preview Frame */}
                    <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
                        <iframe
                            ref={iframeRef}
                            title="Print Preview"
                            className="w-full h-[500px] bg-white rounded shadow"
                            style={{ border: 'none' }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        onClick={handlePrint}
                        disabled={!printReady}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                        <Printer className="w-5 h-5 mr-2" />
                        Print Now
                    </Button>
                    <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex-1"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Download HTML
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                    >
                        Close
                    </Button>
                </div>

                {/* Additional Help Link */}
                <div className="text-center pt-2">
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        {showInstructions ? 'Hide' : 'Need help with printing?'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}