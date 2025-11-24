import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Printer, CheckCircle, XCircle, Bluetooth, Usb, 
    Wifi, Settings, Play, Trash2, Plus, AlertTriangle,
    RefreshCw, Monitor, Info, Zap
} from "lucide-react";
import BluetoothPrinterManager from "./BluetoothPrinterManager";
import AutomatedPrinterWizard from "./AutomatedPrinterWizard";

export default function PrinterSetup({ onPrinterSelected, selectedPrinterId }) {
    const [printers, setPrinters] = useState([]);
    const [testingPrinter, setTestingPrinter] = useState(null);
    const [addingPrinter, setAddingPrinter] = useState(false);
    const [bluetoothPrinter, setBluetoothPrinter] = useState(null);
    const [showWizard, setShowWizard] = useState(false);
    const [newPrinter, setNewPrinter] = useState({
        name: '',
        type: 'thermal',
        connectionType: 'bluetooth',
        width: '4',
        height: '6'
    });

    useEffect(() => {
        loadPrinters();
    }, []);

    const loadPrinters = () => {
        // Load from localStorage
        const saved = localStorage.getItem('churchConnectPrinters');
        if (saved) {
            setPrinters(JSON.parse(saved));
        }

        // Check for saved Bluetooth printer
        const savedBtPrinter = localStorage.getItem('bluetooth_printer_name');
        if (savedBtPrinter) {
            setBluetoothPrinter(savedBtPrinter);
        }
    };

    const savePrinters = (updatedPrinters) => {
        localStorage.setItem('churchConnectPrinters', JSON.stringify(updatedPrinters));
        setPrinters(updatedPrinters);
    };

    const handleAddPrinter = () => {
        if (!newPrinter.name) {
            alert('Please enter a printer name');
            return;
        }

        const printer = {
            id: Date.now().toString(),
            ...newPrinter,
            status: 'ready',
            addedDate: new Date().toISOString()
        };

        const updated = [...printers, printer];
        savePrinters(updated);
        setAddingPrinter(false);
        setNewPrinter({
            name: '',
            type: 'thermal',
            connectionType: 'bluetooth',
            width: '4',
            height: '6'
        });
    };

    const handleRemovePrinter = (id) => {
        if (!confirm('Remove this printer?')) return;
        const updated = printers.filter(p => p.id !== id);
        savePrinters(updated);
    };

    const handleTestPrint = async (printer) => {
        setTestingPrinter(printer.id);
        
        try {
            // Generate test print
            const printWindow = window.open('', '', 'width=600,height=800');
            printWindow.document.write(generateTestPrint(printer));
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                setTestingPrinter(null);
            }, 500);
        } catch (error) {
            console.error('Test print error:', error);
            alert('Test print failed: ' + error.message);
            setTestingPrinter(null);
        }
    };

    const generateTestPrint = (printer) => {
        const width = printer.type === 'thermal' ? printer.width + 'in' : '8.5in';
        const height = printer.type === 'thermal' ? printer.height + 'in' : '11in';

        return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Print - ${printer.name}</title>
    <style>
        @page {
            size: ${width} ${height};
            margin: 0.25in;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .content {
            margin: 20px 0;
        }
        .qr-placeholder {
            width: 150px;
            height: 150px;
            border: 2px solid #000;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Print</h1>
        <p>${printer.name}</p>
    </div>
    <div class="content">
        <p><strong>Printer Type:</strong> ${printer.type}</p>
        <p><strong>Connection:</strong> ${printer.connectionType}</p>
        <p><strong>Paper Size:</strong> ${printer.width}" x ${printer.height}"</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <div class="qr-placeholder">
            [QR CODE]
        </div>
        <p style="text-align: center;">If you can read this, your printer is working correctly!</p>
    </div>
</body>
</html>
        `;
    };

    const getConnectionIcon = (type) => {
        switch (type) {
            case 'bluetooth': return <Bluetooth className="w-4 h-4" />;
            case 'usb': return <Usb className="w-4 h-4" />;
            case 'wifi': return <Wifi className="w-4 h-4" />;
            default: return <Printer className="w-4 h-4" />;
        }
    };

    const handleBluetoothConnected = (printerInfo) => {
        console.log('Bluetooth printer connected:', printerInfo);
        setBluetoothPrinter(printerInfo.device.name);
        
        // Save to printers list
        const btPrinter = {
            id: 'bluetooth_' + Date.now(),
            name: printerInfo.device.name,
            type: 'thermal',
            connectionType: 'bluetooth',
            width: '2.25',
            height: '4',
            status: 'ready',
            bluetoothDevice: printerInfo.device.id,
            addedDate: new Date().toISOString()
        };
        
        const updated = [...printers, btPrinter];
        savePrinters(updated);
    };

    return (
        <>
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 mb-6">
                <Zap className="w-5 h-5 text-blue-600" />
                <AlertDescription>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-blue-900">🚀 Quick Start</p>
                            <p className="text-sm text-blue-800 mt-1">
                                Let our automated wizard detect your device and guide you through the best setup method
                            </p>
                        </div>
                        <Button onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700">
                            Launch Wizard
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>

            <Tabs defaultValue="bluetooth" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="bluetooth">
                        <Bluetooth className="w-4 h-4 mr-2" />
                        Bluetooth (Recommended)
                    </TabsTrigger>
                    <TabsTrigger value="traditional">
                        <Printer className="w-4 h-4 mr-2" />
                        Traditional
                    </TabsTrigger>
                </TabsList>

            {/* Bluetooth Tab - Direct Web Bluetooth Connection */}
            <TabsContent value="bluetooth" className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="w-5 h-5 text-blue-600" />
                    <AlertDescription>
                        <p className="font-bold text-blue-900 mb-2">✨ Direct Bluetooth Connection</p>
                        <p className="text-sm text-blue-800">
                            Connect your RONGTA R22 directly through your browser - no system pairing needed!
                            This method works best for thermal printers and provides instant, reliable printing.
                        </p>
                    </AlertDescription>
                </Alert>

                <BluetoothPrinterManager onPrinterConnected={handleBluetoothConnected} />
            </TabsContent>

            {/* Traditional Tab - System Printer Method */}
            <TabsContent value="traditional" className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">Traditional Printer Setup</h3>
                        <p className="text-sm text-slate-600">For system-paired printers</p>
                    </div>
                    <Button onClick={() => setAddingPrinter(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Printer
                    </Button>
                </div>

                {/* System Bluetooth Pairing Instructions */}
                <Alert className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <AlertDescription>
                        <p className="font-bold text-orange-900 text-lg mb-3">📱 System Bluetooth Pairing Method</p>
                        <p className="text-sm text-orange-800 mb-3">
                            This method requires pairing your RONGTA R22 with your operating system first.
                        </p>
                        
                        <div className="space-y-4 text-sm text-orange-800">
                            <div>
                                <p className="font-semibold mb-1">Windows 10/11:</p>
                                <ol className="list-decimal ml-5 space-y-1">
                                    <li>Turn ON RONGTA R22 printer</li>
                                    <li>Go to Settings → Bluetooth & devices</li>
                                    <li>Click "Add device" → Bluetooth</li>
                                    <li>Select "RONGTA R22" when it appears</li>
                                    <li>Wait for pairing (may ask for PIN: try 0000 or 1234)</li>
                                    <li>Once paired, go to Settings → Printers & scanners</li>
                                    <li>Click "Add a printer or scanner"</li>
                                    <li>Select your RONGTA R22</li>
                                    <li>Install drivers when prompted</li>
                                </ol>
                            </div>

                            <div>
                                <p className="font-semibold mb-1">macOS:</p>
                                <ol className="list-decimal ml-5 space-y-1">
                                    <li>Turn ON RONGTA R22</li>
                                    <li>System Preferences → Bluetooth</li>
                                    <li>Click "Connect" next to RONGTA R22</li>
                                    <li>System Preferences → Printers & Scanners</li>
                                    <li>Click the "+" button</li>
                                    <li>Select your RONGTA R22 from the list</li>
                                    <li>macOS will automatically find the right driver</li>
                                </ol>
                            </div>

                            <div>
                                <p className="font-semibold mb-1">Android Tablet:</p>
                                <ol className="list-decimal ml-5 space-y-1">
                                    <li>Settings → Connections → Bluetooth</li>
                                    <li>Scan and pair with RONGTA R22</li>
                                    <li>Use the "Direct Bluetooth" tab instead (recommended)</li>
                                </ol>
                            </div>
                        </div>

                        <div className="mt-4 bg-white p-3 rounded border border-orange-300">
                            <p className="font-semibold text-orange-900 mb-1">💡 Pro Tip:</p>
                            <p className="text-orange-800">
                                For RONGTA R22, we recommend using the <strong>"Bluetooth (Recommended)"</strong> tab instead.
                                It's faster, easier, and doesn't require system pairing!
                            </p>
                        </div>
                    </AlertDescription>
                </Alert>

                {/* Add Printer Form */}
                {addingPrinter && (
                    <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle>Add New Printer</CardTitle>
                            <CardDescription>Configure a new printer for your church</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Printer Name *</Label>
                                <Input
                                    placeholder="e.g., Front Desk Printer"
                                    value={newPrinter.name}
                                    onChange={(e) => setNewPrinter({...newPrinter, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Printer Type</Label>
                                    <Select
                                        value={newPrinter.type}
                                        onValueChange={(value) => setNewPrinter({...newPrinter, type: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="thermal">Thermal (Label/Receipt)</SelectItem>
                                            <SelectItem value="standard">Standard (Letter Size)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Connection Type</Label>
                                    <Select
                                        value={newPrinter.connectionType}
                                        onValueChange={(value) => setNewPrinter({...newPrinter, connectionType: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bluetooth">Bluetooth</SelectItem>
                                            <SelectItem value="usb">USB</SelectItem>
                                            <SelectItem value="wifi">WiFi/Network</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {newPrinter.type === 'thermal' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Width (inches)</Label>
                                        <Select
                                            value={newPrinter.width}
                                            onValueChange={(value) => setNewPrinter({...newPrinter, width: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2.25">2.25" (Small Labels)</SelectItem>
                                                <SelectItem value="4">4" (Standard)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Height (inches)</Label>
                                        <Select
                                            value={newPrinter.height}
                                            onValueChange={(value) => setNewPrinter({...newPrinter, height: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1.25">1.25"</SelectItem>
                                                <SelectItem value="4">4"</SelectItem>
                                                <SelectItem value="6">6"</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={handleAddPrinter} className="flex-1">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Printer
                                </Button>
                                <Button variant="outline" onClick={() => setAddingPrinter(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Printers List */}
                {printers.length === 0 ? (
                    <Alert>
                        <AlertTriangle className="w-5 h-5" />
                        <AlertDescription>
                            <p className="font-semibold">No printers configured</p>
                            <p className="text-sm mt-1">Add a printer to start printing labels and receipts</p>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="grid gap-4">
                        {printers.map(printer => (
                            <Card 
                                key={printer.id}
                                className={`cursor-pointer transition-all ${
                                    selectedPrinterId === printer.id 
                                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                                        : 'hover:shadow-lg'
                                }`}
                                onClick={() => onPrinterSelected?.(printer)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Printer className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-lg">{printer.name}</h4>
                                                    {selectedPrinterId === printer.id && (
                                                        <Badge className="bg-blue-600">Selected</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                                    <div className="flex items-center gap-1">
                                                        {getConnectionIcon(printer.connectionType)}
                                                        <span className="capitalize">{printer.connectionType}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Monitor className="w-4 h-4" />
                                                        <span>{printer.width}" × {printer.height}"</span>
                                                    </div>
                                                    <Badge variant="outline" className="capitalize">
                                                        {printer.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTestPrint(printer);
                                                }}
                                                disabled={testingPrinter === printer.id}
                                            >
                                                {testingPrinter === printer.id ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                                        Testing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-4 h-4 mr-1" />
                                                        Test Print
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemovePrinter(printer.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>

        <AutomatedPrinterWizard
            isOpen={showWizard}
            onClose={() => setShowWizard(false)}
            onComplete={(config) => {
                loadPrinters();
                if (config.connectionType === 'bluetooth') {
                    setBluetoothPrinter(config.name);
                }
            }}
        />
        </>
    );
}