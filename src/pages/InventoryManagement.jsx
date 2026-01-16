import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Package, AlertTriangle, TrendingUp, TrendingDown, 
    Search, Plus, Minus, RefreshCw, CheckCircle 
} from "lucide-react";

export default function InventoryManagementPage() {
    const [products, setProducts] = useState([]);
    const [stockAlerts, setStockAlerts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [allProducts, alerts] = await Promise.all([
            base44.entities.Product.list('-updated_date'),
            base44.entities.StockAlert.filter({ status: "pending" })
        ]);
        setProducts(allProducts);
        setStockAlerts(alerts);
        setIsLoading(false);
    };

    const updateStock = async (productId, change) => {
        const product = products.find(p => p.id === productId);
        const newStock = Math.max(0, (product.stock_quantity || 0) + change);
        
        await base44.entities.Product.update(productId, {
            stock_quantity: newStock
        });

        // Check if we need to create/resolve alerts
        if (newStock <= product.low_stock_threshold && newStock > 0) {
            await base44.entities.StockAlert.create({
                product_id: productId,
                product_name: product.product_name,
                current_stock: newStock,
                threshold: product.low_stock_threshold,
                alert_type: "low_stock",
                alert_date: new Date().toISOString()
            });
        } else if (newStock === 0) {
            await base44.entities.StockAlert.create({
                product_id: productId,
                product_name: product.product_name,
                current_stock: 0,
                threshold: product.low_stock_threshold,
                alert_type: "out_of_stock",
                alert_date: new Date().toISOString()
            });
        } else if (newStock > product.low_stock_threshold) {
            // Resolve any existing alerts
            const existingAlerts = stockAlerts.filter(a => a.product_id === productId);
            for (const alert of existingAlerts) {
                await base44.entities.StockAlert.update(alert.id, {
                    status: "resolved",
                    resolved_date: new Date().toISOString()
                });
            }
        }

        loadData();
    };

    const acknowledgeAlert = async (alertId) => {
        await base44.entities.StockAlert.update(alertId, {
            status: "acknowledged"
        });
        loadData();
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = !searchQuery || 
            p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const lowStockProducts = products.filter(p => 
        p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0
    );

    const outOfStockProducts = products.filter(p => p.stock_quantity === 0);

    const getStockStatus = (product) => {
        if (product.stock_quantity === 0) {
            return { label: "Out of Stock", color: "bg-red-500" };
        }
        if (product.stock_quantity <= product.low_stock_threshold) {
            return { label: "Low Stock", color: "bg-yellow-500" };
        }
        return { label: "In Stock", color: "bg-green-500" };
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
                    <p className="text-slate-600">Track stock levels and manage alerts</p>
                </div>

                {/* Stock Alerts */}
                {stockAlerts.length > 0 && (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-900">
                            <strong>{stockAlerts.length} stock alerts</strong> - {lowStockProducts.length} low stock, {outOfStockProducts.length} out of stock
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{products.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">In Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {products.filter(p => p.stock_quantity > p.low_stock_threshold).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Low Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-yellow-600">{lowStockProducts.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Out of Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{outOfStockProducts.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="bookstore">Bookstore</TabsTrigger>
                                    <TabsTrigger value="coffee_shop">Coffee Shop</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button onClick={loadData} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Products Inventory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {filteredProducts.map(product => {
                                const status = getStockStatus(product);
                                return (
                                    <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold">{product.product_name}</h4>
                                                <Badge className={status.color + " text-white"}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                SKU: {product.sku || "N/A"} • ${product.price?.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => updateStock(product.id, -1)}
                                                disabled={product.stock_quantity === 0}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <div className="w-20 text-center">
                                                <div className="text-2xl font-bold">{product.stock_quantity || 0}</div>
                                                <div className="text-xs text-slate-500">units</div>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => updateStock(product.id, 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Alerts */}
                {stockAlerts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Active Stock Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {stockAlerts.map(alert => (
                                    <div key={alert.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                                        <div>
                                            <h4 className="font-semibold text-red-900">{alert.product_name}</h4>
                                            <p className="text-sm text-red-700">
                                                {alert.alert_type === "out_of_stock" ? "Out of stock" : `Only ${alert.current_stock} left (threshold: ${alert.threshold})`}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => acknowledgeAlert(alert.id)}
                                            variant="outline"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Acknowledge
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}