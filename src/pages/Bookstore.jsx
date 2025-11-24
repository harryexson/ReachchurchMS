
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingCart, Book, Music, Gift, Package, Plus, Minus, Heart } from "lucide-react";
import { motion } from "framer-motion";
import FeatureGate from "../components/subscription/FeatureGate";

export default function BookstorePage() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchQuery, selectedCategory]);

    const loadProducts = async () => {
        setIsLoading(true);
        const bookstoreProducts = await base44.entities.Product.filter({
            category: "bookstore",
            is_active: true
        });
        setProducts(bookstoreProducts);
        setIsLoading(false);
    };

    const filterProducts = () => {
        let filtered = [...products];

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.author?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== "all") {
            filtered = filtered.filter(p => p.product_type === selectedCategory);
        }

        setFilteredProducts(filtered);
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(cart.map(item =>
                item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    const getCartTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const user = await base44.auth.me();
        
        // Create order
        const orderNumber = `ORD-${Date.now()}`;
        const orderData = {
            order_number: orderNumber,
            order_type: "bookstore",
            customer_name: user.full_name,
            customer_email: user.email,
            order_date: new Date().toISOString(),
            order_status: "pending",
            payment_status: "pending",
            subtotal: getCartTotal(),
            tax_amount: getCartTotal() * 0.08,
            total_amount: getCartTotal() * 1.08,
            order_items: cart.map(item => ({
                product_id: item.id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.price * item.quantity
            }))
        };

        try {
            await base44.entities.Order.create(orderData);
            
            // TODO: Integrate payment
            alert(`Order placed! Total: $${(getCartTotal() * 1.08).toFixed(2)}\n\nYou can pick up your order at the church bookstore.`);
            setCart([]);
        } catch (error) {
            console.error("Order error:", error);
            alert("Failed to place order. Please try again.");
        }
    };

    const categoryIcons = {
        book: Book,
        bible: Book,
        music: Music,
        gift: Gift,
        merchandise: Package
    };

    return (
        <FeatureGate 
            feature="bookstore_enabled"
            featureName="Church Bookstore"
            requiredPlan="Growth"
        >
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Church Bookstore</h1>
                            <p className="text-slate-600">Browse books, Bibles, music, and gifts</p>
                        </div>
                        <div className="relative">
                            <Button
                                className="bg-amber-600 hover:bg-amber-700"
                                onClick={() => document.getElementById('cart-section').scrollIntoView({ behavior: 'smooth' })}
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Cart ({cart.length})
                            </Button>
                            {cart.length > 0 && (
                                <Badge className="absolute -top-2 -right-2 bg-red-500">
                                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="lg:col-span-2">
                            <TabsList className="grid grid-cols-6">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="book">Books</TabsTrigger>
                                <TabsTrigger value="bible">Bibles</TabsTrigger>
                                <TabsTrigger value="music">Music</TabsTrigger>
                                <TabsTrigger value="gift">Gifts</TabsTrigger>
                                <TabsTrigger value="merchandise">Merch</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Products Grid */}
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, index) => (
                                <Card key={index} className="animate-pulse">
                                    <CardHeader className="p-0">
                                        <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                                        <div className="h-10 bg-gray-200 rounded mb-4"></div>
                                        <div className="flex justify-between items-center">
                                            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            filteredProducts.map(product => {
                                const Icon = categoryIcons[product.product_type] || Package;
                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <Card className="hover:shadow-xl transition-all">
                                            <CardHeader className="p-0">
                                                <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center rounded-t-lg relative overflow-hidden">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.product_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Icon className="w-20 h-20 text-amber-600" />
                                                    )}
                                                    {product.is_featured && (
                                                        <Badge className="absolute top-2 right-2 bg-red-500">
                                                            Featured
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <h3 className="font-bold text-slate-900 mb-1">
                                                    {product.product_name}
                                                </h3>
                                                {product.author && (
                                                    <p className="text-sm text-slate-600 mb-2">
                                                        by {product.author}
                                                    </p>
                                                )}
                                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                                    {product.description}
                                                </p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-2xl font-bold text-amber-600">
                                                        ${product.price.toFixed(2)}
                                                    </span>
                                                    <Button
                                                        onClick={() => addToCart(product)}
                                                        className="bg-amber-600 hover:bg-amber-700"
                                                    >
                                                        <ShoppingCart className="w-4 h-4 mr-1" />
                                                        Add
                                                    </Button>
                                                </div>
                                                {product.stock_quantity <= product.low_stock_threshold && (
                                                    <Badge variant="outline" className="mt-2 text-red-600 border-red-600">
                                                        Only {product.stock_quantity} left!
                                                    </Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>

                    {/* Shopping Cart */}
                    <div id="cart-section" className="mt-12">
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="w-6 h-6 text-amber-600" />
                                    Shopping Cart
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {cart.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                        <p>Your cart is empty</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            {cart.map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{item.product_name}</h4>
                                                        <p className="text-sm text-slate-600">
                                                            ${item.price.toFixed(2)} each
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </Button>
                                                            <span className="w-12 text-center font-semibold">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        <span className="w-24 text-right font-bold text-amber-600">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-red-600"
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 pt-6 border-t">
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Subtotal:</span>
                                                    <span>${getCartTotal().toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Tax (8%):</span>
                                                    <span>${(getCartTotal() * 0.08).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-2xl font-bold">
                                                    <span>Total:</span>
                                                    <span className="text-amber-600">
                                                        ${(getCartTotal() * 1.08).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleCheckout}
                                                className="w-full bg-amber-600 hover:bg-amber-700 py-6 text-lg"
                                            >
                                                <ShoppingCart className="w-5 h-5 mr-2" />
                                                Proceed to Checkout
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
}
