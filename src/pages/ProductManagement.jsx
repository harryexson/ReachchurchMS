import React, { useState, useEffect } from "react";
import FeatureGate from "../components/subscription/FeatureGate";
import { useSubscription } from "../components/subscription/useSubscription";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Edit, Trash, Package, Coffee, Book, AlertCircle, Crown, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function ProductManagementPage() {
    const { hasFeature, getPlanName, loading } = useSubscription();
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        product_name: "",
        product_type: "coffee",
        category: "coffee_shop",
        description: "",
        price: 0,
        stock_quantity: 0,
        is_active: true
    });

    const canAccessFeature = hasFeature('bookstore_enabled');
    const currentPlan = getPlanName();

    useEffect(() => {
        if (canAccessFeature) {
            loadProducts();
        }
    }, [canAccessFeature]);

    const loadProducts = async () => {
        const allProducts = await base44.entities.Product.list("-created_date");
        setProducts(allProducts);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await base44.entities.Product.update(editingProduct.id, formData);
            } else {
                await base44.entities.Product.create(formData);
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            resetForm();
            loadProducts();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product");
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        await base44.entities.Product.delete(id);
        loadProducts();
    };

    const resetForm = () => {
        setFormData({
            product_name: "",
            product_type: "coffee",
            category: "coffee_shop",
            description: "",
            price: 0,
            stock_quantity: 0,
            is_active: true
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show upgrade prompt if they don't have access
    if (!canAccessFeature) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header with Current Plan */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Product Management</h1>
                            <p className="text-slate-600 mt-1">Manage bookstore and coffee shop inventory</p>
                        </div>
                        <Badge variant="outline" className="text-lg px-4 py-2">
                            Current: {currentPlan} Plan
                        </Badge>
                    </div>

                    {/* Upgrade Alert */}
                    <Alert className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
                        <Crown className="h-5 w-5 text-amber-600" />
                        <AlertTitle className="text-lg font-semibold text-amber-900 mb-2">
                            Unlock Product Management with Growth Plan
                        </AlertTitle>
                        <AlertDescription className="space-y-4">
                            <p className="text-amber-800">
                                This feature is available on the <strong>Growth Plan ($129/month)</strong>. 
                                Upgrade now to manage your church bookstore and coffee shop inventory!
                            </p>

                            <div className="grid md:grid-cols-2 gap-4 my-4">
                                <Card className="border-2 border-amber-200 bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Book className="w-8 h-8 text-amber-600 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Bookstore Management</h4>
                                                <ul className="text-sm text-slate-600 space-y-1">
                                                    <li>• Sell books, Bibles, music & gifts</li>
                                                    <li>• Track inventory & stock levels</li>
                                                    <li>• Online ordering system</li>
                                                    <li>• Generate additional revenue</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 border-amber-200 bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Coffee className="w-8 h-8 text-amber-600 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Coffee Shop Kiosk</h4>
                                                <ul className="text-sm text-slate-600 space-y-1">
                                                    <li>• Sell coffee, snacks & meals</li>
                                                    <li>• Self-service kiosk ordering</li>
                                                    <li>• Kitchen display integration</li>
                                                    <li>• Revenue tracking & analytics</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="bg-white border-2 border-amber-200 rounded-lg p-4">
                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                    Everything Else in Growth Plan:
                                </h4>
                                <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                        <span>1,000 SMS messages/month</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                        <span>10 MMS campaigns/month</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                        <span>Video meetings (25 people)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                        <span>Kids check-in system</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                        <span>Automated workflows</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                        <span>Visitor follow-up sequences</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                        <span>Advanced analytics</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                        <span>Tax statements & reports</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Link to={createPageUrl('SubscriptionPlans')} className="flex-1">
                                    <Button 
                                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 h-12 text-lg font-semibold"
                                    >
                                        <Crown className="w-5 h-5 mr-2" />
                                        Upgrade to Growth Plan
                                    </Button>
                                </Link>
                                <Link to={createPageUrl('Dashboard')} className="flex-1">
                                    <Button variant="outline" className="w-full h-12">
                                        Back to Dashboard
                                    </Button>
                                </Link>
                            </div>

                            <div className="text-center pt-2">
                                <p className="text-sm text-slate-600">
                                    ✨ <strong>14-day free trial</strong> • Cancel anytime • No credit card required
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Preview of What They'll Get */}
                    <Card className="border-2 border-slate-200 opacity-60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-6 h-6 text-slate-400" />
                                Product Management Dashboard (Preview)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <Card key={i} className="border-2 border-slate-100 bg-slate-50">
                                        <CardContent className="p-4">
                                            <div className="h-32 bg-slate-200 rounded-lg mb-3 animate-pulse"></div>
                                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <div className="text-center mt-6">
                                <p className="text-slate-500 font-medium">
                                    🔒 Upgrade to Growth Plan to unlock this feature
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const bookstoreProducts = products.filter(p => p.category === "bookstore");
    const coffeeShopProducts = products.filter(p => p.category === "coffee_shop");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Product Management</h1>
                        <p className="text-slate-600">Manage bookstore and coffee shop inventory</p>
                    </div>
                    <Button
                        onClick={() => {
                            resetForm();
                            setEditingProduct(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Product
                    </Button>
                </div>

                <Tabs defaultValue="coffee_shop">
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="coffee_shop">
                            <Coffee className="w-5 h-5 mr-2" />
                            Coffee Shop ({coffeeShopProducts.length})
                        </TabsTrigger>
                        <TabsTrigger value="bookstore">
                            <Book className="w-5 h-5 mr-2" />
                            Bookstore ({bookstoreProducts.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="coffee_shop">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {coffeeShopProducts.map(product => (
                                <Card key={product.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle>{product.product_name}</CardTitle>
                                            <Badge className={product.is_active ? "bg-green-500" : "bg-gray-500"}>
                                                {product.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-slate-600">{product.description}</p>
                                        <div className="flex justify-between text-sm">
                                            <span>Price:</span>
                                            <span className="font-bold">${product.price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Stock:</span>
                                            <span className={product.stock_quantity < 10 ? "text-red-600 font-bold" : ""}>
                                                {product.stock_quantity}
                                            </span>
                                        </div>
                                        {product.stock_quantity < product.low_stock_threshold && (
                                            <div className="flex items-center gap-2 text-sm text-red-600">
                                                <AlertCircle className="w-4 h-4" />
                                                Low Stock!
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(product)}
                                                className="flex-1"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="bookstore">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bookstoreProducts.map(product => (
                                <Card key={product.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle>{product.product_name}</CardTitle>
                                            <Badge className={product.is_active ? "bg-green-500" : "bg-gray-500"}>
                                                {product.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {product.author && (
                                            <p className="text-sm text-slate-600">by {product.author}</p>
                                        )}
                                        <p className="text-sm text-slate-600">{product.description}</p>
                                        <div className="flex justify-between text-sm">
                                            <span>Price:</span>
                                            <span className="font-bold">${product.price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Stock:</span>
                                            <span className={product.stock_quantity < 5 ? "text-red-600 font-bold" : ""}>
                                                {product.stock_quantity}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(product)}
                                                className="flex-1"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Add/Edit Product Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingProduct ? "Edit Product" : "Add New Product"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Product Name *</Label>
                                    <Input
                                        value={formData.product_name}
                                        onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Category *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({...formData, category: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bookstore">Bookstore</SelectItem>
                                            <SelectItem value="coffee_shop">Coffee Shop</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Product Type *</Label>
                                    <Select
                                        value={formData.product_type}
                                        onValueChange={(value) => setFormData({...formData, product_type: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formData.category === "bookstore" ? (
                                                <>
                                                    <SelectItem value="book">Book</SelectItem>
                                                    <SelectItem value="bible">Bible</SelectItem>
                                                    <SelectItem value="music">Music</SelectItem>
                                                    <SelectItem value="gift">Gift</SelectItem>
                                                    <SelectItem value="merchandise">Merchandise</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="coffee">Coffee</SelectItem>
                                                    <SelectItem value="beverage">Beverage</SelectItem>
                                                    <SelectItem value="pastry">Pastry</SelectItem>
                                                    <SelectItem value="snack">Snack</SelectItem>
                                                    <SelectItem value="meal">Meal</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Price *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={3}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Stock Quantity</Label>
                                    <Input
                                        type="number"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <Label>Active Status</Label>
                                    <Select
                                        value={formData.is_active ? "true" : "false"}
                                        onValueChange={(value) => setFormData({...formData, is_active: value === "true"})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Active</SelectItem>
                                            <SelectItem value="false">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {editingProduct ? "Update Product" : "Add Product"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}