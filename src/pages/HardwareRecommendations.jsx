import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Printer, Tablet, Monitor, ShoppingCart, Search, Star, 
    CheckCircle, AlertCircle, ExternalLink, DollarSign, Wifi,
    Bluetooth, Usb, Shield, TrendingUp
} from "lucide-react";

export default function HardwareRecommendationsPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [hardware, setHardware] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        checkAccessAndLoadData();
    }, [navigate]);

    const checkAccessAndLoadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Check if user has back office access
            const isBackOffice = user.role === 'admin' && 
                               (user.email?.includes('@reachtech.dev') || 
                                user.email?.includes('@platformdev.com') ||
                                user.developer_access === true ||
                                user.email === 'david@base44.app');

            if (!isBackOffice) {
                alert("This page is restricted to back office team members only.");
                navigate(createPageUrl('Dashboard'));
                return;
            }

            await loadHardware();
        } catch (error) {
            console.error("Access check failed:", error);
            navigate(createPageUrl('Dashboard'));
        }
    };

    const loadHardware = async () => {
        setIsLoading(true);
        try {
            const hardwareList = await base44.entities.HardwareRecommendation.list("-customer_rating");
            setHardware(hardwareList);
            
            // Auto-create testing tasks for items with status='testing' that don't have a task yet
            for (const hw of hardwareList) {
                if (hw.status === 'testing') {
                    try {
                        await base44.functions.invoke('createTestingTask', {
                            hardware_id: hw.id
                        });
                        console.log(`Testing task checked/created for ${hw.product_name}`);
                    } catch (error) {
                        // This catch block specifically handles errors from createTestingTask
                        // indicating the task might already exist or another specific issue.
                        // The base44 function itself might return an error if the task exists.
                        console.log(`Testing task may already exist or error occurred for ${hw.product_name}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading hardware:", error);
        }
        setIsLoading(false);
    };

    const categories = [
        { id: "all", name: "All Hardware", icon: ShoppingCart },
        { id: "thermal_printer", name: "Receipt Printers", icon: Printer },
        { id: "kiosk_tablet", name: "Kiosk Tablets", icon: Tablet },
        { id: "counter_tablet", name: "Counter Tablets", icon: Tablet },
        { id: "kitchen_display", name: "Kitchen Displays", icon: Monitor },
        { id: "large_display", name: "Large Displays", icon: Monitor }
    ];

    const filteredHardware = hardware.filter(item => {
        const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.model_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const ConnectivityBadge = ({ type }) => {
        const icons = {
            bluetooth: <Bluetooth className="w-3 h-3" />,
            wifi: <Wifi className="w-3 h-3" />,
            usb: <Usb className="w-3 h-3" />
        };

        return (
            <Badge variant="outline" className="gap-1">
                {icons[type]}
                {type.toUpperCase()}
            </Badge>
        );
    };

    const HardwareCard = ({ item }) => (
        <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{item.product_name}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                            {item.manufacturer} • {item.model_number}
                        </p>
                    </div>
                    <Badge className={
                        item.status === 'recommended' ? 'bg-green-100 text-green-800' :
                        item.status === 'compatible' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }>
                        {item.status === 'recommended' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {item.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Price */}
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                        ${item.approximate_price}
                    </span>
                    <span className="text-sm text-slate-500">{item.price_range}</span>
                </div>

                {/* Rating */}
                {item.customer_rating && (
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${
                                        i < item.customer_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-slate-600">{item.customer_rating}/5</span>
                        {item.is_verified && (
                            <Badge className="bg-blue-100 text-blue-800">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                            </Badge>
                        )}
                    </div>
                )}

                {/* Connectivity */}
                {item.connectivity && item.connectivity.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {item.connectivity.map(conn => (
                            <ConnectivityBadge key={conn} type={conn} />
                        ))}
                    </div>
                )}

                {/* Compatible With */}
                {item.compatible_with && item.compatible_with.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Compatible With:</p>
                        <div className="flex flex-wrap gap-2">
                            {item.compatible_with.map(feature => (
                                <Badge key={feature} variant="outline" className="text-xs">
                                    {feature}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Specs */}
                {item.specifications && (
                    <details className="text-sm">
                        <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                            Technical Specifications
                        </summary>
                        <div className="mt-2 p-3 bg-slate-50 rounded space-y-1">
                            {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="text-slate-600">{key}:</span>
                                    <span className="font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}

                {/* Pros & Cons */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {item.pros && item.pros.length > 0 && (
                        <div>
                            <p className="font-semibold text-green-700 mb-2">✅ Pros:</p>
                            <ul className="space-y-1">
                                {item.pros.slice(0, 3).map((pro, idx) => (
                                    <li key={idx} className="text-slate-600">• {pro}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {item.cons && item.cons.length > 0 && (
                        <div>
                            <p className="font-semibold text-red-700 mb-2">❌ Cons:</p>
                            <ul className="space-y-1">
                                {item.cons.slice(0, 3).map((con, idx) => (
                                    <li key={idx} className="text-slate-600">• {con}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Setup Difficulty */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Setup:</span>
                    <Badge className={
                        item.setup_difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        item.setup_difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }>
                        {item.setup_difficulty}
                    </Badge>
                </div>

                {/* Recommended For */}
                {item.recommended_for && item.recommended_for.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Recommended For:</p>
                        <p className="text-sm text-slate-600">{item.recommended_for.join(', ')}</p>
                    </div>
                )}

                {/* Purchase Links */}
                {item.purchase_links && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {item.purchase_links.amazon && (
                            <a 
                                href={item.purchase_links.amazon} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1"
                            >
                                <Button variant="outline" className="w-full gap-2">
                                    <ExternalLink className="w-4 h-4" />
                                    Amazon
                                </Button>
                            </a>
                        )}
                        {item.purchase_links.manufacturer && (
                            <a 
                                href={item.purchase_links.manufacturer} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1"
                            >
                                <Button variant="outline" className="w-full gap-2">
                                    <ExternalLink className="w-4 h-4" />
                                    Manufacturer
                                </Button>
                            </a>
                        )}
                    </div>
                )}

                {/* Internal Notes */}
                {item.notes && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-xs text-blue-900">
                            <strong>Internal Note:</strong> {item.notes}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                    <p className="text-slate-600">Loading hardware recommendations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <ShoppingCart className="w-8 h-8 text-blue-600" />
                            Hardware Recommendations
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Compatible hardware for REACH ChurchConnect features
                        </p>
                        <Badge className="mt-2 bg-red-100 text-red-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Internal Use Only - Team Access
                        </Badge>
                    </div>
                    <Button onClick={loadHardware} variant="outline">
                        Refresh
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Products</p>
                                    <p className="text-2xl font-bold">{hardware.length}</p>
                                </div>
                                <ShoppingCart className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Recommended</p>
                                    <p className="text-2xl font-bold">
                                        {hardware.filter(h => h.status === 'recommended').length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Verified</p>
                                    <p className="text-2xl font-bold">
                                        {hardware.filter(h => h.is_verified).length}
                                    </p>
                                </div>
                                <Shield className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Avg Rating</p>
                                    <p className="text-2xl font-bold">
                                        {hardware.length > 0 ? (hardware.reduce((sum, h) => sum + (h.customer_rating || 0), 0) / hardware.length).toFixed(1) : '0.0'}
                                    </p>
                                </div>
                                <Star className="w-8 h-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    placeholder="Search by product name, manufacturer, or model..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Categories */}
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="grid grid-cols-3 lg:grid-cols-6">
                        {categories.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                                    <Icon className="w-4 h-4" />
                                    {cat.name}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    <TabsContent value={selectedCategory} className="mt-6">
                        {filteredHardware.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-600">No hardware found matching your criteria</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredHardware.map(item => (
                                    <HardwareCard key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}