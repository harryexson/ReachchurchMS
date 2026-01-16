import React, { useState, useEffect } from "react";
import FeatureGate from "../components/subscription/FeatureGate";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, ShoppingCart, Plus, Minus, Check, Mail, Phone, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import PrintPreview from "../components/printing/PrintPreview";
import { LabelTemplates } from "../components/printing/LabelTemplates";

export default function CoffeeShopKioskPage() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [currentStep, setCurrentStep] = useState('menu'); // menu, customize, checkout, confirmation
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [customization, setCustomization] = useState({});
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        phone: "",
        email: "",
        notifyVia: "sms" // 'sms', 'email', 'both', 'none'
    });
    // Removed orderNumber and printReceipt as they are handled by orderConfirmation and printPreview now.
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderConfirmation, setOrderConfirmation] = useState(null); // { orderNumber, total, pickupTime }
    const [orderType, setOrderType] = useState('takeaway'); // 'takeaway', 'pre-order', 'dine-in'
    const [pickupTime, setPickupTime] = useState(''); // for pre-order
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'credit_card'
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [printPreview, setPrintPreview] = useState(null); // for print modal

    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        const menuItems = await base44.entities.Product.filter({
            category: "coffee_shop",
            is_active: true
        });
        setProducts(menuItems);
    };

    const selectProduct = (product) => {
        setSelectedProduct(product);
        setCustomization({
            size: product.serving_size?.split(',')[0] || 'Medium',
            extras: {}
        });
        if (product.customization_options && product.customization_options.length > 0) {
            setCurrentStep('customize');
        } else {
            addToCart(product, {});
        }
    };

    const addToCart = (product, customizations) => {
        const cartItem = {
            ...product,
            customizations: customizations,
            cartId: Date.now() + Math.random(), // Unique ID for cart item
            quantity: 1
        };
        setCart([...cart, cartItem]);
        setCurrentStep('menu');
        setSelectedProduct(null);
    };

    const removeFromCart = (cartId) => {
        setCart(cart.filter(item => item.cartId !== cartId));
    };

    const updateQuantity = (cartId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(cartId);
        } else {
            setCart(cart.map(item =>
                item.cartId === cartId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    const getItemTotal = (item) => {
        let total = item.price * item.quantity;
        if (item.customizations && item.customizations.extras) {
            Object.values(item.customizations.extras).forEach(extra => {
                if (extra.price) {
                    total += extra.price * item.quantity;
                }
            });
        }
        return total;
    };

    const getCartSubtotal = () => {
        return cart.reduce((sum, item) => sum + getItemTotal(item), 0);
    };

    const calculateTax = (subtotal) => subtotal * 0.08; // 8% tax
    const calculateTotal = (subtotal) => subtotal + calculateTax(subtotal);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setCurrentStep('checkout');
    };

    const createPageUrl = (pageName) => {
        // This is a placeholder. In a real app, this would likely map page names to routes.
        // Assuming 'CoffeeShopKiosk' maps to a base route like '/kiosk'.
        if (pageName === 'CoffeeShopKiosk') {
            return '/coffee-shop-kiosk'; 
        }
        return `/${pageName.toLowerCase()}`;
    };

    const calculateEstimatedTime = (orderItems) => {
        if (!orderItems || orderItems.length === 0) return 5;
        const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        return Math.max(5, Math.min(20, itemCount * 3));
    };

    const resetOrder = () => {
        setCart([]);
        setCustomerInfo({ name: "", phone: "", email: "", notifyVia: "sms" });
        setOrderConfirmation(null);
        setOrderType('takeaway');
        setPickupTime('');
        setPaymentMethod('cash');
        setSpecialInstructions('');
        setCurrentStep('menu');
    };

    const handleCompleteOrder = async () => {
        if (cart.length === 0) {
            alert("Your cart is empty");
            return;
        }

        if (orderType === 'pre-order' && !pickupTime) {
            alert("Please select a pickup time");
            return;
        }

        const subtotal = getCartSubtotal();
        const tax = calculateTax(subtotal);
        const total = calculateTotal(subtotal);

        // Basic validation for customer info based on notification preference
        if (!customerInfo.name) {
            alert("Please enter your name.");
            return;
        }
        if (customerInfo.notifyVia === 'sms' && !customerInfo.phone) {
            alert("Please enter your phone number for SMS notification.");
            return;
        }
        if (customerInfo.notifyVia === 'email' && !customerInfo.email) {
            alert("Please enter your email for email notification.");
            return;
        }
        if (customerInfo.notifyVia === 'both' && (!customerInfo.phone || !customerInfo.email)) {
            alert("Please enter both your phone number and email for notifications.");
            return;
        }

        setIsProcessing(true);

        try {
            const user = await base44.auth.me();
            const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

            // Update product stock
            for (const item of cart) {
                const product = await base44.entities.Product.list();
                const currentProduct = product.find(p => p.id === item.id);
                if (currentProduct) {
                    await base44.entities.Product.update(item.id, {
                        stock_quantity: Math.max(0, (currentProduct.stock_quantity || 0) - item.quantity),
                        total_sold: (currentProduct.total_sold || 0) + item.quantity
                    });
                }
            }

            const orderData = {
                order_number: orderNumber,
                order_type: "coffee_shop",
                customer_name: customerInfo.name || (user ? user.full_name : "Guest"),
                customer_email: customerInfo.email || (user ? user.email : "guest@example.com"),
                customer_phone: customerInfo.phone || "",
                order_date: new Date().toISOString(),
                order_status: "pending",
                payment_status: "pending",
                payment_method: paymentMethod,
                subtotal: subtotal,
                tax_amount: tax,
                total_amount: total,
                order_items: cart.map(item => ({
                    product_id: item.id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    customizations: item.customizations,
                    subtotal: getItemTotal(item),
                })),
                special_instructions: specialInstructions,
                pickup_time: orderType === 'pre-order' ? pickupTime : null,
                is_kiosk_order: true,
                kiosk_number: "KIOSK-01"
            };

            const createdOrder = await base44.entities.Order.create(orderData);

            // Update loyalty points if user is authenticated
            if (user && user.email) {
                const loyaltyRecords = await base44.entities.LoyaltyProgram.filter({
                    user_email: user.email
                });

                const pointsEarned = Math.floor(total);
                
                if (loyaltyRecords.length > 0) {
                    const loyalty = loyaltyRecords[0];
                    const newLifetimePoints = (loyalty.lifetime_points || 0) + pointsEarned;
                    let newTier = loyalty.tier;
                    
                    if (newLifetimePoints >= 5000) newTier = "platinum";
                    else if (newLifetimePoints >= 2000) newTier = "gold";
                    else if (newLifetimePoints >= 500) newTier = "silver";
                    
                    await base44.entities.LoyaltyProgram.update(loyalty.id, {
                        points_balance: (loyalty.points_balance || 0) + pointsEarned,
                        lifetime_points: newLifetimePoints,
                        tier: newTier,
                        total_purchases: (loyalty.total_purchases || 0) + 1,
                        total_spent: (loyalty.total_spent || 0) + total,
                        last_purchase_date: new Date().toISOString()
                    });
                } else {
                    await base44.entities.LoyaltyProgram.create({
                        user_email: user.email,
                        user_name: user.full_name,
                        points_balance: pointsEarned,
                        lifetime_points: pointsEarned,
                        tier: "bronze",
                        total_purchases: 1,
                        total_spent: total,
                        last_purchase_date: new Date().toISOString()
                    });
                }
            }

            if (paymentMethod === 'credit_card') {
                const checkoutResponse = await base44.functions.invoke('createDonationCheckout', {
                    amount: total,
                    donor_email: customerInfo.email || (user ? user.email : "guest@example.com"),
                    donor_name: customerInfo.name || (user ? user.full_name : "Guest"),
                    donation_type: "coffee_shop_purchase",
                    successUrl: window.location.origin + createPageUrl('CoffeeShopKiosk') + '?order_id=' + createdOrder.id + '&success=true',
                    cancelUrl: window.location.origin + createPageUrl('CoffeeShopKiosk')
                });

                if (checkoutResponse.data?.checkout_url) {
                    window.location.href = checkoutResponse.data.checkout_url;
                    return;
                } else {
                    throw new Error("Failed to initiate payment. Please try again.");
                }
            }

            // If not credit card payment (e.g., cash), mark as paid immediately
            await base44.entities.Order.update(createdOrder.id, {
                payment_status: "paid"
            });

            // Generate receipt preview
            const receiptContent = LabelTemplates.coffeeShopReceipt({
                order_number: orderNumber,
                customer_name: createdOrder.customer_name,
                order_items: cart, // Pass the original cart with full item details for receipt generation
                subtotal: subtotal,
                tax_amount: tax,
                total_amount: total,
                order_date: createdOrder.order_date,
                special_instructions: specialInstructions,
                customer_phone: createdOrder.customer_phone,
                estimated_time: calculateEstimatedTime(cart) // Pass cart for calculation
            });

            setPrintPreview({
                content: receiptContent,
                title: `Receipt #${orderNumber}`,
                paperSize: '3x8'
            });

            setOrderConfirmation({
                orderNumber: orderNumber,
                total: total,
                pickupTime: orderType === 'pre-order' ? pickupTime : 'ASAP'
            });
            setCurrentStep('confirmation'); // Move to confirmation screen

        } catch (error) {
            console.error("Order error:", error);
            alert("Failed to place order: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const productsByType = {
        coffee: products.filter(p => p.product_type === 'coffee'),
        beverage: products.filter(p => p.product_type === 'beverage'),
        pastry: products.filter(p => p.product_type === 'pastry'),
        snack: products.filter(p => p.product_type === 'snack')
    };

    return (
        <FeatureGate 
            feature="coffee_shop_enabled"
            featureName="Coffee Shop Kiosk"
            requiredPlan="Growth"
        >
            {currentStep === 'confirmation' && orderConfirmation && (
                <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-2xl w-full"
                    >
                        <Card className="shadow-2xl">
                            <CardContent className="pt-12 pb-12 text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Check className="w-12 h-12 text-green-600" />
                                    </div>
                                </motion.div>
                                <h1 className="text-4xl font-bold text-slate-900">
                                    Order Confirmed!
                                </h1>
                                <div className="bg-amber-50 p-6 rounded-lg inline-block">
                                    <p className="text-sm text-amber-600 mb-2">Your Order Number</p>
                                    <p className="text-5xl font-bold text-amber-600">{orderConfirmation.orderNumber}</p>
                                </div>
                                <p className="text-xl text-slate-600">
                                    We'll call your order number when it's ready!
                                </p>
                                <p className="text-lg text-slate-500">
                                    Total: ${orderConfirmation.total.toFixed(2)}
                                </p>
                                <div className="pt-6">
                                    <Coffee className="w-16 h-16 mx-auto text-amber-600 animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {currentStep === 'checkout' && (
                <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
                    <div className="max-w-2xl mx-auto">
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>Checkout</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label>Name *</Label>
                                        <Input
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                                            placeholder="Your name"
                                            className="text-lg h-14"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label>Order Type</Label>
                                        <Select
                                            value={orderType}
                                            onValueChange={setOrderType}
                                        >
                                            <SelectTrigger className="h-14 text-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="takeaway">Takeaway (Ready ASAP)</SelectItem>
                                                <SelectItem value="pre-order">Pre-Order (Pick a time)</SelectItem>
                                                {/* <SelectItem value="dine-in">Dine-in</SelectItem> */}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {orderType === 'pre-order' && (
                                        <div>
                                            <Label>Pickup Time *</Label>
                                            <Input
                                                type="datetime-local"
                                                value={pickupTime}
                                                onChange={(e) => setPickupTime(e.target.value)}
                                                className="text-lg h-14"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <Label>How should we notify you when your order is ready?</Label>
                                        <Select
                                            value={customerInfo.notifyVia}
                                            onValueChange={(value) => setCustomerInfo({...customerInfo, notifyVia: value})}
                                        >
                                            <SelectTrigger className="h-14 text-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sms">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4" />
                                                        Text Message (SMS)
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="email">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4" />
                                                        Email
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="both">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4" />
                                                        <Mail className="w-4 h-4" />
                                                        Both SMS & Email
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="none">I'll wait at counter</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {(customerInfo.notifyVia === 'sms' || customerInfo.notifyVia === 'both') && (
                                        <div>
                                            <Label>Phone Number *</Label>
                                            <Input
                                                value={customerInfo.phone}
                                                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                                placeholder="(555) 123-4567"
                                                type="tel"
                                                className="text-lg h-14"
                                                required={customerInfo.notifyVia === 'sms' || customerInfo.notifyVia === 'both'}
                                            />
                                        </div>
                                    )}

                                    {(customerInfo.notifyVia === 'email' || customerInfo.notifyVia === 'both') && (
                                        <div>
                                            <Label>Email {customerInfo.notifyVia === 'both' ? '(Optional)' : '*'}</Label>
                                            <Input
                                                value={customerInfo.email}
                                                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                                                placeholder="your@email.com"
                                                type="email"
                                                className="text-lg h-14"
                                                required={customerInfo.notifyVia === 'email'}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <Label>Special Instructions (Optional)</Label>
                                        <Textarea
                                            value={specialInstructions}
                                            onChange={(e) => setSpecialInstructions(e.target.value)}
                                            placeholder="e.g., 'Extra hot latte', 'No sugar', 'Decaf'"
                                            className="text-lg min-h-[80px]"
                                        />
                                    </div>

                                    <div>
                                        <Label>Payment Method</Label>
                                        <Select
                                            value={paymentMethod}
                                            onValueChange={setPaymentMethod}
                                        >
                                            <SelectTrigger className="h-14 text-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="credit_card">Credit Card (Online)</SelectItem>
                                                <SelectItem value="cash">Cash (Pay at counter)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Print receipt checkbox removed as print preview now automatically shows after order */}
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-4">Order Summary</h3>
                                    <div className="space-y-2">
                                        {cart.map(item => (
                                            <div key={item.cartId} className="flex justify-between text-sm">
                                                <span>
                                                    {item.quantity}x {item.product_name}
                                                    {item.customizations?.size && ` (${item.customizations.size})`}
                                                    {item.customizations?.extras && Object.values(item.customizations.extras).map((extra, idx) => ` +${extra.value}`)}
                                                </span>
                                                <span>${getItemTotal(item).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>${getCartSubtotal().toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tax:</span>
                                            <span>${calculateTax(getCartSubtotal()).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-2xl font-bold">
                                            <span>Total:</span>
                                            <span className="text-amber-600">
                                                ${calculateTotal(getCartSubtotal()).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep('menu')}
                                        className="flex-1 h-14 text-lg"
                                        disabled={isProcessing}
                                    >
                                        Back to Menu
                                    </Button>
                                    <Button
                                        onClick={handleCompleteOrder}
                                        className="flex-1 bg-amber-600 hover:bg-amber-700 h-14 text-lg"
                                        disabled={isProcessing || cart.length === 0 || !customerInfo.name}
                                    >
                                        {isProcessing ? "Processing..." : "Confirm Order"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {currentStep === 'customize' && selectedProduct && (
                <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
                    <div className="max-w-2xl mx-auto">
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>Customize: {selectedProduct.product_name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {selectedProduct.serving_size && (
                                    <div>
                                        <Label>Size</Label>
                                        <Select
                                            value={customization.size}
                                            onValueChange={(value) => setCustomization({...customization, size: value})}
                                        >
                                            <SelectTrigger className="h-14 text-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedProduct.serving_size.split(',').map(size => (
                                                    <SelectItem key={size.trim()} value={size.trim()}>
                                                        {size.trim()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedProduct.customization_options?.map((option, idx) => (
                                    <div key={idx}>
                                        <Label>{option.name}</Label>
                                        <Select
                                            onValueChange={(value) => setCustomization({
                                                ...customization,
                                                extras: {
                                                    ...customization.extras,
                                                    [option.name]: { value, price: option.extra_charge || 0 }
                                                }
                                            })}
                                        >
                                            <SelectTrigger className="h-14 text-lg">
                                                <SelectValue placeholder={`Select ${option.name.toLowerCase()}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {option.options.map(opt => (
                                                    <SelectItem key={opt} value={opt}>
                                                        {opt} {option.extra_charge ? `(+$${option.extra_charge})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}

                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep('menu')}
                                        className="flex-1 h-14 text-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => addToCart(selectedProduct, customization)}
                                        className="flex-1 bg-amber-600 hover:bg-amber-700 h-14 text-lg"
                                    >
                                        Add to Order
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {currentStep === 'menu' && (
                <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                                    <Coffee className="w-10 h-10 text-amber-600" />
                                    Church Café
                                </h1>
                                <p className="text-lg text-slate-600 mt-1">Order your favorites!</p>
                            </div>
                            <div className="relative">
                                <Button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="bg-amber-600 hover:bg-amber-700 h-16 px-8 text-lg"
                                >
                                    <ShoppingCart className="w-6 h-6 mr-2" />
                                    Cart ({cart.length})
                                </Button>
                                {cart.length > 0 && (
                                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-lg px-3 py-1">
                                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Menu Tabs */}
                        <Tabs defaultValue="coffee" className="mb-8">
                            <TabsList className="grid grid-cols-4 h-14">
                                <TabsTrigger value="coffee" className="text-lg">☕ Coffee</TabsTrigger>
                                <TabsTrigger value="beverage" className="text-lg">🥤 Beverages</TabsTrigger>
                                <TabsTrigger value="pastry" className="text-lg">🥐 Pastries</TabsTrigger>
                                <TabsTrigger value="snack" className="text-lg">🍪 Snacks</TabsTrigger>
                            </TabsList>

                            {Object.entries(productsByType).map(([type, items]) => (
                                <TabsContent key={type} value={type}>
                                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {items.map(product => (
                                            <motion.div
                                                key={product.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <Card
                                                    className="cursor-pointer hover:shadow-xl transition-all"
                                                    onClick={() => selectProduct(product)}
                                                >
                                                    <CardHeader className="p-0">
                                                        <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center rounded-t-lg">
                                                            {product.image_url ? (
                                                                <img
                                                                    src={product.image_url}
                                                                    alt={product.product_name}
                                                                    className="w-full h-full object-cover rounded-t-lg"
                                                                />
                                                            ) : (
                                                                <Coffee className="w-20 h-20 text-amber-600" />
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-4">
                                                        <h3 className="font-bold text-lg text-slate-900 mb-2">
                                                            {product.product_name}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                                            {product.description}
                                                        </p>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-2xl font-bold text-amber-600">
                                                                ${product.price.toFixed(2)}
                                                            </span>
                                                            {product.preparation_time && (
                                                                <Badge variant="outline">
                                                                    {product.preparation_time} min
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>

                        {/* Current Cart Display */}
                        {cart.length > 0 && (
                            <Card className="fixed bottom-6 right-6 w-96 shadow-2xl">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Current Order</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                                        {cart.map(item => (
                                            <div key={item.cartId} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{item.product_name}</p>
                                                    {item.customizations?.size && (
                                                        <p className="text-xs text-slate-600">{item.customizations.size}</p>
                                                    )}
                                                    {item.customizations?.extras && Object.values(item.customizations.extras).map((extra, idx) => (
                                                        <p key={idx} className="text-xs text-slate-600">+{extra.value}</p>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="w-6 text-center text-sm font-semibold">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-3 space-y-1">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total:</span>
                                            <span className="text-amber-600">
                                                ${calculateTotal(getCartSubtotal()).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Print Preview Modal */}
            {printPreview && (
                <PrintPreview
                    isOpen={true}
                    onClose={() => {
                        setPrintPreview(null);
                        // Do not reset order immediately if user might still want to review
                        // The confirmation screen is shown now, so they can decide what to do next.
                    }}
                    onPrint={() => {
                        setPrintPreview(null);
                        resetOrder(); // Reset order after printing
                    }}
                    content={printPreview.content}
                    title={printPreview.title}
                    paperSize={printPreview.paperSize}
                />
            )}
        </FeatureGate>
    );
}