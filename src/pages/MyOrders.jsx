import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    ShoppingBag, Coffee, Book, Clock, CheckCircle, 
    XCircle, Package, Star, AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";

export default function MyOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loyaltyInfo, setLoyaltyInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("all");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const user = await base44.auth.me();
        setCurrentUser(user);

        const myOrders = await base44.entities.Order.filter({
            customer_email: user.email
        }, '-order_date');
        setOrders(myOrders);

        // Get loyalty info
        const loyaltyRecords = await base44.entities.LoyaltyProgram.filter({
            user_email: user.email
        });
        
        if (loyaltyRecords.length > 0) {
            setLoyaltyInfo(loyaltyRecords[0]);
        }

        setIsLoading(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed": return <CheckCircle className="h-5 w-5 text-green-600" />;
            case "ready": return <Package className="h-5 w-5 text-blue-600" />;
            case "preparing": return <Clock className="h-5 w-5 text-yellow-600" />;
            case "cancelled": return <XCircle className="h-5 w-5 text-red-600" />;
            default: return <AlertCircle className="h-5 w-5 text-slate-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "completed": return "bg-green-100 text-green-800";
            case "ready": return "bg-blue-100 text-blue-800";
            case "preparing": return "bg-yellow-100 text-yellow-800";
            case "cancelled": return "bg-red-100 text-red-800";
            default: return "bg-slate-100 text-slate-800";
        }
    };

    const getTierBadgeColor = (tier) => {
        switch (tier) {
            case "platinum": return "bg-purple-600 text-white";
            case "gold": return "bg-yellow-500 text-white";
            case "silver": return "bg-slate-400 text-white";
            default: return "bg-amber-700 text-white";
        }
    };

    const filteredOrders = orders.filter(order => {
        if (selectedTab === "all") return true;
        if (selectedTab === "coffee_shop") return order.order_type === "coffee_shop";
        if (selectedTab === "bookstore") return order.order_type === "bookstore";
        return true;
    });

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
                    <p className="text-slate-600">Track your purchases and order history</p>
                </div>

                {/* Loyalty Card */}
                {loyaltyInfo && (
                    <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="h-6 w-6" />
                                        <h3 className="text-2xl font-bold">Loyalty Member</h3>
                                    </div>
                                    <p className="text-blue-100">
                                        {currentUser?.full_name}
                                    </p>
                                </div>
                                <Badge className={getTierBadgeColor(loyaltyInfo.tier) + " text-lg px-4 py-2"}>
                                    {loyaltyInfo.tier.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div>
                                    <div className="text-3xl font-bold">{loyaltyInfo.points_balance}</div>
                                    <div className="text-sm text-blue-100">Points Balance</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{loyaltyInfo.total_purchases}</div>
                                    <div className="text-sm text-blue-100">Total Orders</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">${loyaltyInfo.total_spent?.toFixed(2)}</div>
                                    <div className="text-sm text-blue-100">Total Spent</div>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-blue-100">
                                💡 Earn 1 point for every $1 spent. Redeem 100 points for $10 off!
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Order Tabs */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid grid-cols-3 w-full max-w-md">
                        <TabsTrigger value="all">All Orders</TabsTrigger>
                        <TabsTrigger value="coffee_shop">Coffee Shop</TabsTrigger>
                        <TabsTrigger value="bookstore">Bookstore</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Orders List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-slate-600">Loading orders...</p>
                            </CardContent>
                        </Card>
                    ) : filteredOrders.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-600">No orders yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredOrders.map(order => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {order.order_type === "coffee_shop" ? 
                                                    <Coffee className="h-6 w-6 text-amber-600" /> : 
                                                    <Book className="h-6 w-6 text-blue-600" />
                                                }
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        Order #{order.order_number}
                                                    </CardTitle>
                                                    <p className="text-sm text-slate-600">
                                                        {new Date(order.order_date).toLocaleDateString()} at {new Date(order.order_date).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(order.order_status)}
                                                <Badge className={getStatusColor(order.order_status)}>
                                                    {order.order_status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 mb-4">
                                            {order.order_items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>
                                                        {item.quantity}x {item.product_name}
                                                        {item.customizations?.size && ` (${item.customizations.size})`}
                                                    </span>
                                                    <span className="font-medium">${item.subtotal?.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <div>
                                                <span className="text-sm text-slate-600">Total Amount</span>
                                                <p className="text-2xl font-bold text-slate-900">
                                                    ${order.total_amount?.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="text-green-600 border-green-600">
                                                    +{Math.floor(order.total_amount || 0)} points earned
                                                </Badge>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {order.payment_method}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}