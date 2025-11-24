import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Printer, CheckCircle, ExternalLink, Wifi, Usb, DollarSign, Star, Package, Zap, AlertCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KidsPrinterSetup() {
    const printerRecommendations = [
        {
            name: "Brother QL-820NWB",
            price: "$199",
            type: "Label Printer",
            rating: 4.8,
            labelSize: "2.4\" x 4\" (Perfect Match)",
            connectivity: ["USB", "WiFi", "Bluetooth"],
            speed: "110 labels/min",
            pros: [
                "✅ Prints 2.25\" x 4\" labels perfectly",
                "✅ Wireless connectivity - works from any device",
                "✅ Red/Black printing for allergy warnings",
                "✅ Works with die-cut labels (no backing waste)",
                "✅ Auto-cutter included",
                "✅ Compatible with Windows, Mac, iOS, Android"
            ],
            cons: [
                "⚠️ Labels cost ~$0.02-0.03 each",
                "⚠️ Thermal printing (fades over time)"
            ],
            buyLink: "https://www.amazon.com/Brother-QL-820NWB-Professional-Ultra-Flexible-Connectivity/dp/B071NDXW2H",
            recommended: true
        },
        {
            name: "Dymo LabelWriter 550",
            price: "$249",
            type: "Label Printer",
            rating: 4.6,
            labelSize: "2.25\" x 4\" (Perfect Match)",
            connectivity: ["USB"],
            speed: "62 labels/min",
            pros: [
                "✅ Direct 2.25\" x 4\" label support",
                "✅ High-quality thermal printing",
                "✅ Very reliable (church favorite)",
                "✅ Easy label loading",
                "✅ Works with generic labels"
            ],
            cons: [
                "⚠️ USB only (no wireless)",
                "⚠️ Dymo labels can be expensive (~$0.04 each)",
                "⚠️ Generic labels may need calibration"
            ],
            buyLink: "https://www.amazon.com/DYMO-LabelWriter-Thermal-Printer-2112722/dp/B08BC2R93X",
            recommended: true
        },
        {
            name: "Zebra ZD421",
            price: "$349",
            type: "Thermal Label Printer",
            rating: 4.9,
            labelSize: "2.25\" x 4\" + Custom Sizes",
            connectivity: ["USB", "Ethernet", "WiFi (optional)"],
            speed: "152 labels/min",
            pros: [
                "✅ Industrial grade - extremely reliable",
                "✅ Fastest printing speed",
                "✅ Supports custom label sizes",
                "✅ Works with cheap generic labels",
                "✅ 5-year warranty available",
                "✅ Can print barcodes, QR codes perfectly"
            ],
            cons: [
                "⚠️ More expensive upfront",
                "⚠️ Overkill for small churches (<100 kids)",
                "⚠️ Requires label roll setup"
            ],
            buyLink: "https://www.amazon.com/Zebra-ZD421-Direct-Thermal-Printer/dp/B081V7JSJM",
            recommended: false
        },
        {
            name: "Rollo Label Printer",
            price: "$199",
            type: "Thermal Label Printer",
            rating: 4.7,
            labelSize: "Up to 4.1\" wide",
            connectivity: ["USB"],
            speed: "150 labels/min",
            pros: [
                "✅ Works with cheap labels from Amazon",
                "✅ Fast printing",
                "✅ No ink/toner needed",
                "✅ Great for high-volume printing",
                "✅ Supports 2\" x 3\" and 2.25\" x 4\" labels"
            ],
            cons: [
                "⚠️ USB only",
                "⚠️ Requires label roll (not die-cut)",
                "⚠️ May need driver updates"
            ],
            buyLink: "https://www.amazon.com/Rollo-Printer-Commercial-Compatible-Fedex/dp/B01MA3EWW7",
            recommended: false
        }
    ];

    const labelSuppliers = [
        {
            name: "Amazon Basics Labels",
            size: "2.25\" x 4\"",
            price: "$18 for 500 labels (~$0.036/label)",
            compatible: "Brother, Rollo",
            link: "https://www.amazon.com/s?k=2.25+x+4+thermal+labels"
        },
        {
            name: "Dymo Authentic Labels",
            size: "2.25\" x 4\"",
            price: "$35 for 450 labels (~$0.078/label)",
            compatible: "Dymo LabelWriter 550",
            link: "https://www.dymo.com"
        },
        {
            name: "Zebra Labels",
            size: "2.25\" x 4\"",
            price: "$25 for 1000 labels (~$0.025/label)",
            compatible: "Zebra ZD421",
            link: "https://www.zebra.com/us/en/products/supplies.html"
        },
        {
            name: "OnlineLabels.com",
            size: "Custom 2.25\" x 4\"",
            price: "$20-30 for 500-1000 labels",
            compatible: "Most thermal printers",
            link: "https://www.onlinelabels.com"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center">
                    <Printer className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                    <h1 className="text-4xl font-bold text-gray-900">Kids Check-In Printer Setup</h1>
                    <p className="text-lg text-gray-600 mt-2">
                        Recommended printers for 2.25" x 4" check-in stickers
                    </p>
                </div>

                <Card className="shadow-xl border-2 border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-6 h-6 text-blue-600" />
                            Standard Label Size: 2.25" x 4"
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold text-lg mb-2">✅ Why This Size?</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                        <span><strong>Standard church size</strong> - Used by 90% of churches</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                        <span><strong>Fits QR code + barcode</strong> - Scannable from 3 feet away</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                        <span><strong>Easy to read</strong> - Large fonts for child's name</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                        <span><strong>Cheap labels</strong> - Generic thermal labels work</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                        <span><strong>Sticks to clothing</strong> - Won't fall off easily</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">📐 Label Dimensions</h3>
                                <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                                    <div className="aspect-[2.25/4] border-4 border-dashed border-blue-400 rounded flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="font-bold text-2xl">2.25"</p>
                                            <p className="text-sm text-gray-600">width</p>
                                            <p className="font-bold text-2xl mt-2">4"</p>
                                            <p className="text-sm text-gray-600">height</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-center mt-2 text-slate-600">
                                        Actual size: 57mm x 102mm
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-2xl font-bold mb-4">🖨️ Recommended Printers</h2>
                    <div className="grid gap-6">
                        {printerRecommendations.map((printer, index) => (
                            <Card 
                                key={index} 
                                className={`shadow-lg border-2 ${
                                    printer.recommended 
                                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-white' 
                                        : 'border-slate-200'
                                }`}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <CardTitle className="text-xl">{printer.name}</CardTitle>
                                                {printer.recommended && (
                                                    <Badge className="bg-green-600 text-white">
                                                        ⭐ Recommended
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <Badge variant="outline" className="bg-blue-50">
                                                    <DollarSign className="w-3 h-3 mr-1" />
                                                    {printer.price}
                                                </Badge>
                                                <Badge variant="outline" className="bg-yellow-50">
                                                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                                    {printer.rating}/5.0
                                                </Badge>
                                                <Badge variant="outline" className="bg-purple-50">
                                                    <Zap className="w-3 h-3 mr-1" />
                                                    {printer.speed}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="font-semibold text-slate-700 mb-1">Label Size</p>
                                            <p className="text-slate-600">{printer.labelSize}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700 mb-1">Connectivity</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {printer.connectivity.map((conn, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                        {conn === 'WiFi' && <Wifi className="w-3 h-3 mr-1" />}
                                                        {conn === 'USB' && <Usb className="w-3 h-3 mr-1" />}
                                                        {conn}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700 mb-1">Type</p>
                                            <p className="text-slate-600">{printer.type}</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-semibold text-green-700 mb-2">Pros:</p>
                                            <ul className="space-y-1 text-sm">
                                                {printer.pros.map((pro, i) => (
                                                    <li key={i} className="text-slate-700">{pro}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-orange-700 mb-2">Cons:</p>
                                            <ul className="space-y-1 text-sm">
                                                {printer.cons.map((con, i) => (
                                                    <li key={i} className="text-slate-700">{con}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <Button
                                        variant={printer.recommended ? "default" : "outline"}
                                        className={printer.recommended ? "w-full bg-green-600 hover:bg-green-700" : "w-full"}
                                        onClick={() => window.open(printer.buyLink, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        View on Amazon
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>🏷️ Where to Buy Labels</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            {labelSuppliers.map((supplier, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <h3 className="font-bold text-lg mb-2">{supplier.name}</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><strong>Size:</strong> {supplier.size}</p>
                                        <p><strong>Price:</strong> {supplier.price}</p>
                                        <p><strong>Works with:</strong> {supplier.compatible}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => window.open(supplier.link, '_blank')}
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Shop Now
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Alert>
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Quick Setup Tips</AlertTitle>
                    <AlertDescription>
                        <ol className="list-decimal ml-5 space-y-2 mt-2">
                            <li><strong>Order printer + labels</strong> - Start with 500-1000 labels</li>
                            <li><strong>Install printer drivers</strong> - Download from manufacturer website</li>
                            <li><strong>Load labels</strong> - Follow printer manual for label roll installation</li>
                            <li><strong>Test print</strong> - Go to Kids Check-In → Check in a test child</li>
                            <li><strong>Adjust settings</strong> - If printing is off-center, calibrate in printer settings</li>
                            <li><strong>Train volunteers</strong> - Show them how to reload labels and troubleshoot jams</li>
                        </ol>
                    </AlertDescription>
                </Alert>

                <Card className="shadow-xl border-4 border-green-500 bg-gradient-to-br from-green-50 to-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <Crown className="w-6 h-6" />
                            Our Top Pick: Brother QL-820NWB
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-700">
                            <strong>Best for most churches:</strong> Wireless printing, affordable labels, fast, and reliable. 
                            You can print from any tablet or computer without cables.
                        </p>
                        <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                            <p className="font-bold text-lg mb-2">💰 Total Cost to Get Started:</p>
                            <ul className="space-y-1 text-sm">
                                <li>Brother QL-820NWB: <strong>$199</strong></li>
                                <li>1000 labels (2.25" x 4"): <strong>$25</strong></li>
                                <li><strong className="text-green-600">Total: ~$224</strong></li>
                                <li className="text-xs text-slate-500 mt-2">Labels last 3-6 months for church of 50-100 kids</li>
                            </ul>
                        </div>
                        <Button
                            size="lg"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => window.open('https://www.amazon.com/Brother-QL-820NWB-Professional-Ultra-Flexible-Connectivity/dp/B071NDXW2H', '_blank')}
                        >
                            <ExternalLink className="w-5 h-5 mr-2" />
                            Order Brother QL-820NWB on Amazon
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}