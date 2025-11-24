import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Wifi, Search, CheckCircle, XCircle, Loader2, 
    Printer, Settings, Save, TestTube, RefreshCw,
    Network, Info, AlertTriangle, Zap
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function NetworkPrinterSetup() {
    const [currentUser, setCurrentUser] = useState(null);
    const [printers, setPrinters] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [manualConfig, setManualConfig] = useState({
        name: '',
        ipAddress: '',
        port: '80',
        type: 'star_webprnt',
        model: ''
    });
    const [savedPrinters, setSavedPrinters] = useState([]);
    const [testingPrinter, setTestingPrinter] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);

    useEffect(() => {
        checkAccess();
    }, []);

    const checkAccess = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            if (user.role !== 'admin') {
                alert('Access denied. This feature is only available to administrators.');
                window.location.href = '/';
            } else {
                loadSavedPrinters();
            }
        } catch (error) {
            console.error('Access check failed:', error);
            window.location.href = '/';
        }
    };

    const loadSavedPrinters = () => {
        const saved = localStorage.getItem('networkPrinters');
        if (saved) {
            setSavedPrinters(JSON.parse(saved));
        }
    };

    const savePrinter = (printer) => {
        const updated = [...savedPrinters, { ...printer, id: Date.now(), addedDate: new Date().toISOString() }];
        localStorage.setItem('networkPrinters', JSON.stringify(updated));
        setSavedPrinters(updated);
    };

    const removePrinter = (id) => {
        const updated = savedPrinters.filter(p => p.id !== id);
        localStorage.setItem('networkPrinters', JSON.stringify(updated));
        setSavedPrinters(updated);
    };

    const scanNetwork = async () => {
        setIsScanning(true);
        setScanProgress(0);
        const discovered = [];

        try {
            // Get local network IP range
            const localIP = await getLocalIP();
            if (!localIP) {
                alert('Could not detect local IP address. Please enter printer IP manually.');
                setIsScanning(false);
                return;
            }

            const ipParts = localIP.split('.');
            const baseIP = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;

            // Common printer ports
            const ports = [80, 8080, 9100, 631];
            
            // Scan common IP range (1-254)
            const promises = [];
            for (let i = 1; i <= 254; i++) {
                const ip = `${baseIP}.${i}`;
                promises.push(checkPrinterAtIP(ip, ports));
                
                if (i % 10 === 0) {
                    setScanProgress(Math.round((i / 254) * 100));
                }
            }

            const results = await Promise.all(promises);
            const foundPrinters = results.filter(r => r !== null);
            
            setPrinters(foundPrinters);
            setScanProgress(100);
        } catch (error) {
            console.error('Network scan error:', error);
            alert('Network scan failed. Please enter printer details manually.');
        } finally {
            setIsScanning(false);
        }
    };

    const getLocalIP = async () => {
        try {
            // Try to get local IP using WebRTC
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel('');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            return new Promise((resolve) => {
                pc.onicecandidate = (ice) => {
                    if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                    const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                    const match = ipRegex.exec(ice.candidate.candidate);
                    if (match) {
                        pc.close();
                        resolve(match[1]);
                    }
                };
                setTimeout(() => resolve(null), 3000);
            });
        } catch (error) {
            console.error('Error getting local IP:', error);
            return null;
        }
    };

    const checkPrinterAtIP = async (ip, ports) => {
        // Try to detect printer at IP
        for (const port of ports) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const response = await fetch(`http://${ip}:${port}/`, {
                    method: 'GET',
                    signal: controller.signal,
                    mode: 'no-cors'
                });

                clearTimeout(timeoutId);

                // If we get here, something responded
                return {
                    ipAddress: ip,
                    port: port,
                    type: detectPrinterType(port),
                    detected: true
                };
            } catch (error) {
                // Connection failed, continue
                continue;
            }
        }
        return null;
    };

    const detectPrinterType = (port) => {
        if (port === 80 || port === 8080) return 'star_webprnt';
        if (port === 9100) return 'raw_tcp';
        if (port === 631) return 'ipp';
        return 'unknown';
    };

    const testPrinter = async (printer) => {
        setTestingPrinter(printer.id || 'manual');

        try {
            const url = `http://${printer.ipAddress}:${printer.port}`;
            
            if (printer.type === 'star_webprnt') {
                // Star WebPRNT test
                await testStarPrinter(url);
            } else if (printer.type === 'epson_epos') {
                // Epson ePOS test
                await testEpsonPrinter(url);
            } else if (printer.type === 'zebra_linkos') {
                // Zebra Link-OS test
                await testZebraPrinter(url);
            } else {
                // Raw TCP test
                await testRawTCP(url);
            }

            alert('Test print sent successfully! Check your printer.');
        } catch (error) {
            console.error('Test print error:', error);
            alert(`Test print failed: ${error.message}`);
        } finally {
            setTestingPrinter(null);
        }
    };

    const testStarPrinter = async (url) => {
        const testReceipt = `
[align: center]
✓ NETWORK PRINTER TEST
Star WebPRNT

Connection: Success
${new Date().toLocaleString()}

[cut]
`;

        const response = await fetch(`${url}/StarWebPRNT/SendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ request: testReceipt })
        });

        if (!response.ok) throw new Error('Star printer communication failed');
    };

    const testEpsonPrinter = async (url) => {
        // Epson ePOS XML format
        const eposXML = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
            <text align="center" smooth="true">✓ NETWORK PRINTER TEST&#10;</text>
            <text align="center">Epson ePOS&#10;&#10;</text>
            <text>Connection: Success&#10;</text>
            <text>${new Date().toLocaleString()}&#10;&#10;</text>
            <feed line="3"/>
            <cut type="feed"/>
        </epos-print>
    </s:Body>
</s:Envelope>`;

        const response = await fetch(`${url}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml; charset=utf-8' },
            body: eposXML
        });

        if (!response.ok) throw new Error('Epson printer communication failed');
    };

    const testZebraPrinter = async (url) => {
        // Zebra ZPL test label
        const zpl = `^XA
^FO50,50^A0N,50,50^FD✓ NETWORK TEST^FS
^FO50,120^A0N,30,30^FDZebra Link-OS^FS
^FO50,170^A0N,25,25^FDConnection: Success^FS
^FO50,210^A0N,20,20^FD${new Date().toLocaleString()}^FS
^XZ`;

        const response = await fetch(`${url}/pstprnt`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: zpl
        });

        if (!response.ok) throw new Error('Zebra printer communication failed');
    };

    const testRawTCP = async (url) => {
        // Basic ESC/POS commands via HTTP
        const escPos = '\x1B\x40' + // Initialize
                       '\x1B\x61\x01' + // Center align
                       '✓ NETWORK TEST\n\n' +
                       'Raw TCP Printing\n\n' +
                       'Connection: Success\n' +
                       new Date().toLocaleString() + '\n\n' +
                       '\x1B\x64\x03' + // Feed 3 lines
                       '\x1D\x56\x00'; // Cut

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: escPos
        });

        if (!response.ok) throw new Error('Raw TCP communication failed');
    };

    const handleManualAdd = () => {
        if (!manualConfig.name || !manualConfig.ipAddress) {
            alert('Please enter printer name and IP address');
            return;
        }

        savePrinter(manualConfig);
        setManualConfig({ name: '', ipAddress: '', port: '80', type: 'star_webprnt', model: '' });
        alert('Printer added successfully!');
    };

    const getPrinterTypeIcon = (type) => {
        return <Printer className="w-5 h-5" />;
    };

    const getPrinterTypeName = (type) => {
        const types = {
            'star_webprnt': 'Star WebPRNT',
            'epson_epos': 'Epson ePOS',
            'zebra_linkos': 'Zebra Link-OS',
            'raw_tcp': 'Raw TCP/IP',
            'ipp': 'Internet Printing Protocol',
            'unknown': 'Generic Network Printer'
        };
        return types[type] || type;
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <Network className="w-8 h-8 text-blue-600" />
                        Network Printer Setup
                    </h1>
                    <p className="text-slate-600">
                        Configure WiFi/Ethernet printers for universal device compatibility
                    </p>
                </div>

                {/* Info Alert */}
                <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <Info className="w-5 h-5 text-blue-600" />
                    <AlertDescription>
                        <p className="font-bold text-blue-900 mb-2">Why Network Printers?</p>
                        <ul className="text-sm text-blue-800 list-disc ml-6 space-y-1">
                            <li>✅ Works on ALL devices (iPad, Android, Windows, Mac)</li>
                            <li>✅ No Bluetooth limitations</li>
                            <li>✅ Multiple devices can print simultaneously</li>
                            <li>✅ More reliable for business/church environments</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="scan" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="scan">
                            <Search className="w-4 h-4 mr-2" />
                            Auto Discover
                        </TabsTrigger>
                        <TabsTrigger value="manual">
                            <Settings className="w-4 h-4 mr-2" />
                            Manual Setup
                        </TabsTrigger>
                        <TabsTrigger value="saved">
                            <Save className="w-4 h-4 mr-2" />
                            Saved Printers
                        </TabsTrigger>
                    </TabsList>

                    {/* Auto Discovery Tab */}
                    <TabsContent value="scan" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Network Scanner</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert className="bg-yellow-50 border-yellow-200">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    <AlertDescription className="text-sm text-yellow-800">
                                        <p className="font-semibold mb-1">Before scanning:</p>
                                        <ul className="list-disc ml-5">
                                            <li>Ensure printer is powered on</li>
                                            <li>Connect printer to same WiFi network as this device</li>
                                            <li>Scanning may take 1-3 minutes</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <Button
                                    onClick={scanNetwork}
                                    disabled={isScanning}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Scanning Network... {scanProgress}%
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5 mr-2" />
                                            Start Network Scan
                                        </>
                                    )}
                                </Button>

                                {isScanning && (
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div
                                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${scanProgress}%` }}
                                        />
                                    </div>
                                )}

                                {printers.length > 0 && (
                                    <div className="space-y-3 mt-6">
                                        <h3 className="font-semibold">Discovered Printers:</h3>
                                        {printers.map((printer, idx) => (
                                            <Card key={idx} className="bg-green-50 border-green-200">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {getPrinterTypeIcon(printer.type)}
                                                                <span className="font-semibold">{printer.ipAddress}:{printer.port}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600">
                                                                Type: {getPrinterTypeName(printer.type)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    setManualConfig({
                                                                        ...manualConfig,
                                                                        ipAddress: printer.ipAddress,
                                                                        port: printer.port.toString(),
                                                                        type: printer.type
                                                                    });
                                                                }}
                                                            >
                                                                Configure
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {!isScanning && printers.length === 0 && (
                                    <Alert>
                                        <Info className="w-5 h-5" />
                                        <AlertDescription>
                                            No printers discovered yet. Click "Start Network Scan" or use Manual Setup.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Manual Setup Tab */}
                    <TabsContent value="manual" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Manual Printer Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Printer Name *</Label>
                                    <Input
                                        placeholder="e.g., Front Desk Printer"
                                        value={manualConfig.name}
                                        onChange={(e) => setManualConfig({...manualConfig, name: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <Label>Printer Type *</Label>
                                    <Select
                                        value={manualConfig.type}
                                        onValueChange={(value) => setManualConfig({...manualConfig, type: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="star_webprnt">Star WebPRNT (TSP650II, TSP100III)</SelectItem>
                                            <SelectItem value="epson_epos">Epson ePOS (TM-M30II, TM-T88VI)</SelectItem>
                                            <SelectItem value="zebra_linkos">Zebra Link-OS (ZD421, ZD620)</SelectItem>
                                            <SelectItem value="raw_tcp">Generic ESC/POS (Raw TCP)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <Label>IP Address *</Label>
                                        <Input
                                            placeholder="192.168.1.100"
                                            value={manualConfig.ipAddress}
                                            onChange={(e) => setManualConfig({...manualConfig, ipAddress: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <Label>Port</Label>
                                        <Input
                                            placeholder="80"
                                            value={manualConfig.port}
                                            onChange={(e) => setManualConfig({...manualConfig, port: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Model (Optional)</Label>
                                    <Input
                                        placeholder="e.g., TSP650II"
                                        value={manualConfig.model}
                                        onChange={(e) => setManualConfig({...manualConfig, model: e.target.value})}
                                    />
                                </div>

                                <Alert className="bg-blue-50 border-blue-200">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    <AlertDescription className="text-sm text-blue-800">
                                        <p className="font-semibold mb-1">How to find your printer's IP address:</p>
                                        <ul className="list-disc ml-5 space-y-1">
                                            <li><strong>Star:</strong> Print network config (hold feed button 3 sec)</li>
                                            <li><strong>Epson:</strong> Settings → Network → IP Address</li>
                                            <li><strong>Zebra:</strong> Print configuration label</li>
                                            <li><strong>Router:</strong> Check DHCP client list</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() => testPrinter(manualConfig)}
                                        variant="outline"
                                        className="flex-1"
                                        disabled={!manualConfig.ipAddress || testingPrinter === 'manual'}
                                    >
                                        {testingPrinter === 'manual' ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <TestTube className="w-4 h-4 mr-2" />
                                                Test Print
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleManualAdd}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        disabled={!manualConfig.name || !manualConfig.ipAddress}
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Printer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Setup Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-orange-600" />
                                    Quick Setup Guide
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <p className="font-semibold mb-2">Star Micronics TSP650II / TSP100III:</p>
                                    <ol className="list-decimal ml-5 space-y-1 text-slate-600">
                                        <li>Connect printer to WiFi via WPS or web interface (192.168.1.x)</li>
                                        <li>Print network configuration (hold feed button)</li>
                                        <li>Note the IP address</li>
                                        <li>Select "Star WebPRNT" as type, port 80</li>
                                    </ol>
                                </div>
                                <div>
                                    <p className="font-semibold mb-2">Epson TM-M30II / TM-T88VI:</p>
                                    <ol className="list-decimal ml-5 space-y-1 text-slate-600">
                                        <li>Connect via Ethernet or WiFi</li>
                                        <li>Access web interface at printer IP</li>
                                        <li>Enable ePOS in settings</li>
                                        <li>Select "Epson ePOS" as type, port 80</li>
                                    </ol>
                                </div>
                                <div>
                                    <p className="font-semibold mb-2">Zebra ZD421 / ZD620:</p>
                                    <ol className="list-decimal ml-5 space-y-1 text-slate-600">
                                        <li>Connect via Ethernet or WiFi</li>
                                        <li>Print configuration label (hold feed + pause buttons)</li>
                                        <li>Note IP address and ensure Link-OS is enabled</li>
                                        <li>Select "Zebra Link-OS" as type, port 9100</li>
                                    </ol>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Saved Printers Tab */}
                    <TabsContent value="saved" className="space-y-6">
                        {savedPrinters.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Printer className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-600">No printers saved yet</p>
                                    <p className="text-sm text-slate-500 mt-2">Use Auto Discover or Manual Setup to add printers</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {savedPrinters.map((printer) => (
                                    <Card key={printer.id} className="hover:shadow-lg transition-all">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <Printer className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{printer.name}</h3>
                                                        <div className="space-y-1 mt-2 text-sm text-slate-600">
                                                            <p>📍 {printer.ipAddress}:{printer.port}</p>
                                                            <p>🖨️ {getPrinterTypeName(printer.type)}</p>
                                                            {printer.model && <p>📦 {printer.model}</p>}
                                                        </div>
                                                        <Badge className="mt-2" variant="outline">
                                                            Network Printer
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => testPrinter(printer)}
                                                        disabled={testingPrinter === printer.id}
                                                    >
                                                        {testingPrinter === printer.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <TestTube className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removePrinter(printer.id)}
                                                        className="text-red-600"
                                                    >
                                                        <XCircle className="w-4 h-4" />
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
            </div>
        </div>
    );
}