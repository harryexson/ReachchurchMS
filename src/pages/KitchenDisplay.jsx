import React, { useState, useEffect } from "react";
import FeatureGate from "../components/subscription/FeatureGate";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Clock, Check, AlertCircle, Coffee, RefreshCw, Printer, Loader2, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PrinterSetup from "../components/printing/PrinterSetup";
import PrintPreview from "../components/printing/PrintPreview";
import { LabelTemplates } from "../components/printing/LabelTemplates";

export default function KitchenDisplayPage() {
    const [orders, setOrders] = useState([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [sendingNotification, setSendingNotification] = useState(null);
    const [showPrinterSetup, setShowPrinterSetup] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [printPreview, setPrintPreview] = useState(null);
    const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);

    useEffect(() => {
        loadOrders();
        if (autoRefresh) {
            const interval = setInterval(loadOrders, 10000); // Refresh every 10 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    useEffect(() => {
        // Load saved printer preference
        const savedPrinterId = localStorage.getItem('kitchenDisplayPrinter');
        if (savedPrinterId) {
            const printers = JSON.parse(localStorage.getItem('churchConnectPrinters') || '[]');
            const printer = printers.find(p => p.id === savedPrinterId);
            if (printer) setSelectedPrinter(printer);
        }

        // Load auto-print preference
        const autoPrint = localStorage.getItem('kitchenDisplayAutoPrint') === 'true';
        setAutoPrintEnabled(autoPrint);
    }, []);

    const loadOrders = async () => {
        const allOrders = await base44.entities.Order.filter({
            order_type: "coffee_shop"
        });
        
        // Sort by order date, newest first
        const sorted = allOrders.sort((a, b) => 
            new Date(b.order_date) - new Date(a.order_date)
        );
        
        // Check for new pending orders to auto-print
        if (autoPrintEnabled && selectedPrinter) {
            const newPendingOrders = sorted.filter(o => 
                o.order_status === 'pending' || o.order_status === 'confirmed'
            );
            
            newPendingOrders.forEach(order => {
                if (!order.kitchen_ticket_printed) {
                    handlePrintOrder(order, true); // Auto-print
                }
            });
        }
        
        setOrders(sorted);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        const order = orders.find(o => o.id === orderId);
        const updates = { order_status: newStatus };
        
        if (newStatus === 'preparing' && !order.preparation_started) {
            updates.preparation_started = new Date().toISOString();
        }
        
        if (newStatus === 'ready') {
            updates.preparation_completed = new Date().toISOString();
            
            // Send "order ready" notification
            setSendingNotification(orderId);
            try {
                await base44.functions.invoke('sendOrderNotification', {
                    orderId: orderId,
                    notificationType: 'order_ready'
                });
                updates.notified_customer = true;
            } catch (error) {
                console.error('Failed to send notification:', error);
            }
            setSendingNotification(null);
        }
        
        if (newStatus === 'completed') {
            updates.picked_up = true;
            updates.pickup_time_actual = new Date().toISOString();
            
            try {
                await base44.functions.invoke('sendOrderNotification', {
                    orderId: orderId,
                    notificationType: 'order_completed'
                });
            } catch (error) {
                console.error('Failed to send thank you:', error);
            }
        }
        
        await base44.entities.Order.update(orderId, updates);
        loadOrders();
    };

    const getTimeSince = (dateString) => {
        const minutes = Math.floor((new Date() - new Date(dateString)) / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
    };

    const handlePrintOrder = async (order, isAutoPrint = false) => {
        if (!selectedPrinter && !isAutoPrint) {
            alert('Please select a printer first');
            setShowPrinterSetup(true);
            return;
        }

        const printContent = LabelTemplates.kitchenOrderTicket({
            order_number: order.order_number,
            customer_name: order.customer_name,
            order_items: order.order_items,
            order_date: order.order_date,
            special_instructions: order.special_instructions,
            is_urgent: (new Date() - new Date(order.order_date)) / 60000 > 15 // Urgent if over 15 minutes old
        });

        if (isAutoPrint) {
            // Direct print without preview
            const printWindow = window.open('', '', 'width=600,height=800');
            printWindow.document.write(printContent);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);

            // Mark as printed
            await base44.entities.Order.update(order.id, {
                kitchen_ticket_printed: true
            });
        } else {
            // Show preview
            setPrintPreview({
                content: printContent,
                title: `Kitchen Ticket #${order.order_number}`,
                paperSize: '4x6',
                orderId: order.id
            });
        }
    };

    const handlePrintComplete = async () => {
        if (printPreview?.orderId) {
            await base44.entities.Order.update(printPreview.orderId, {
                kitchen_ticket_printed: true
            });
        }
        setPrintPreview(null);
        loadOrders();
    };

    const handlePrinterSelected = (printer) => {
        setSelectedPrinter(printer);
        localStorage.setItem('kitchenDisplayPrinter', printer.id);
    };

    const toggleAutoPrint = () => {
        const newValue = !autoPrintEnabled;
        setAutoPrintEnabled(newValue);
        localStorage.setItem('kitchenDisplayAutoPrint', newValue.toString());
    };

    const pendingOrders = orders.filter(o => o.order_status === 'pending' || o.order_status === 'confirmed');
    const preparingOrders = orders.filter(o => o.order_status === 'preparing');
    const readyOrders = orders.filter(o => o.order_status === 'ready');
    const completedOrders = orders.filter(o => o.order_status === 'completed');

    const OrderCard = ({ order }) => {
        const isUrgent = order.preparation_started && 
            (new Date() - new Date(order.preparation_started)) / 60000 > 10;

        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`${isUrgent ? 'ring-4 ring-red-500' : ''}`}
            >
                <Card className="shadow-lg hover:shadow-xl transition-all">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-bold">
                                    {order.order_number}
                                </CardTitle>
                                <p className="text-sm text-slate-600 mt-1">
                                    {order.customer_name}
                                </p>
                                {order.customer_phone && (
                                    <p className="text-xs text-slate-500">
                                        📱 {order.customer_phone}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge className={`text-lg px-3 py-1 ${
                                    isUrgent ? 'bg-red-500' : 'bg-blue-500'
                                }`}>
                                    {getTimeSince(order.order_date)}
                                </Badge>
                                {selectedPrinter && !order.kitchen_ticket_printed && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePrintOrder(order)}
                                        className="gap-1"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print Ticket
                                    </Button>
                                )}
                                {order.kitchen_ticket_printed && (
                                    <Badge variant="outline" className="text-xs">
                                        ✓ Printed
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {order.order_items?.map((item, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-lg">
                                            {item.quantity}x {item.product_name}
                                        </span>
                                    </div>
                                    {item.customizations && (
                                        <div className="text-sm text-slate-600 ml-4">
                                            {item.customizations.size && (
                                                <div>Size: {item.customizations.size}</div>
                                            )}
                                            {item.customizations.extras && Object.entries(item.customizations.extras).map(([key, value]) => (
                                                <div key={key}>
                                                    {key}: {value.value}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {order.special_instructions && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm font-semibold text-yellow-900">
                                    📝 Special Instructions:
                                </p>
                                <p className="text-sm text-yellow-800 mt-1">
                                    {order.special_instructions}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {order.order_status === 'pending' && (
                                <Button
                                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
                                >
                                    <Clock className="w-5 h-5 mr-2" />
                                    Start Preparing
                                </Button>
                            )}
                            {order.order_status === 'confirmed' && (
                                <Button
                                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
                                >
                                    <Clock className="w-5 h-5 mr-2" />
                                    Start Preparing
                                </Button>
                            )}
                            {order.order_status === 'preparing' && (
                                <Button
                                    onClick={() => updateOrderStatus(order.id, 'ready')}
                                    className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                                    disabled={sendingNotification === order.id}
                                >
                                    {sendingNotification === order.id ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Notifying...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5 mr-2" />
                                            Mark Ready & Notify
                                        </>
                                    )}
                                </Button>
                            )}
                            {order.order_status === 'ready' && (
                                <Button
                                    onClick={() => updateOrderStatus(order.id, 'completed')}
                                    className="flex-1 bg-slate-600 hover:bg-slate-700 h-12"
                                >
                                    <Check className="w-5 h-5 mr-2" />
                                    Mark Picked Up
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    if (showPrinterSetup) {
        return (
            <FeatureGate 
                feature="coffee_shop_enabled"
                featureName="Kitchen Display System"
                requiredPlan="Growth"
            >
                <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Printer Setup</h1>
                                <p className="text-slate-400 mt-1">Configure printer for kitchen tickets</p>
                            </div>
                            <Button onClick={() => setShowPrinterSetup(false)} variant="outline" className="text-white border-white">
                                Back to Kitchen Display
                            </Button>
                        </div>

                        <Card>
                            <CardContent className="p-6">
                                <PrinterSetup 
                                    onPrinterSelected={handlePrinterSelected}
                                    selectedPrinterId={selectedPrinter?.id}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </FeatureGate>
        );
    }

    return (
        <FeatureGate 
            feature="coffee_shop_enabled"
            featureName="Kitchen Display System"
            requiredPlan="Growth"
        >
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                <Coffee className="w-10 h-10 text-amber-400" />
                                Kitchen Display
                            </h1>
                            <p className="text-slate-400 mt-1 text-lg">
                                Real-time order management
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {selectedPrinter && (
                                <div className="text-right">
                                    <div className="text-xs text-slate-400">Active Printer:</div>
                                    <div className="text-sm text-white font-semibold">{selectedPrinter.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button
                                            variant={autoPrintEnabled ? "default" : "outline"}
                                            size="sm"
                                            onClick={toggleAutoPrint}
                                            className={autoPrintEnabled ? "bg-green-600 hover:bg-green-700" : "text-white border-white"}
                                        >
                                            {autoPrintEnabled ? '✓ Auto-Print ON' : 'Auto-Print OFF'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button onClick={() => setShowPrinterSetup(true)} variant="outline" className="gap-2 text-white border-white">
                                <Settings className="w-5 h-5" />
                                Printer Setup
                            </Button>
                            <Button
                                variant={autoRefresh ? "default" : "outline"}
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "text-white border-white"}
                            >
                                <RefreshCw className={`w-5 h-5 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
                            </Button>
                            <Button onClick={loadOrders} variant="outline" className="text-white border-white">
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Refresh Now
                            </Button>
                        </div>
                    </div>

                    {/* Order Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <Card className="bg-blue-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="text-4xl font-bold">{pendingOrders.length}</div>
                                <div className="text-blue-100">New Orders</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="text-4xl font-bold">{preparingOrders.length}</div>
                                <div className="text-amber-100">In Progress</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="text-4xl font-bold">{readyOrders.length}</div>
                                <div className="text-green-100">Ready</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="text-4xl font-bold">{completedOrders.length}</div>
                                <div className="text-slate-100">Completed</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Orders Grid */}
                    <Tabs defaultValue="pending" className="space-y-6">
                        <TabsList className="grid grid-cols-4 bg-slate-800 h-14">
                            <TabsTrigger value="pending" className="text-lg data-[state=active]:bg-blue-600">
                                New ({pendingOrders.length})
                            </TabsTrigger>
                            <TabsTrigger value="preparing" className="text-lg data-[state=active]:bg-amber-600">
                                Preparing ({preparingOrders.length})
                            </TabsTrigger>
                            <TabsTrigger value="ready" className="text-lg data-[state=active]:bg-green-600">
                                Ready ({readyOrders.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="text-lg data-[state=active]:bg-slate-600">
                                Completed ({completedOrders.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {pendingOrders.map(order => (
                                        <OrderCard key={order.id} order={order} />
                                    ))}
                                </AnimatePresence>
                            </div>
                            {pendingOrders.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Coffee className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-xl">No pending orders</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="preparing">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {preparingOrders.map(order => (
                                        <OrderCard key={order.id} order={order} />
                                    ))}
                                </AnimatePresence>
                            </div>
                            {preparingOrders.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-xl">No orders in progress</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="ready">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {readyOrders.map(order => (
                                        <OrderCard key={order.id} order={order} />
                                    ))}
                                </AnimatePresence>
                            </div>
                            {readyOrders.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Check className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-xl">No orders ready for pickup</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="completed">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {completedOrders.slice(0, 12).map(order => (
                                        <OrderCard key={order.id} order={order} />
                                    ))}
                                </AnimatePresence>
                            </div>
                            {completedOrders.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-xl">No completed orders</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Print Preview Modal */}
            {printPreview && (
                <PrintPreview
                    isOpen={true}
                    onClose={() => setPrintPreview(null)}
                    onPrint={handlePrintComplete}
                    content={printPreview.content}
                    title={printPreview.title}
                    paperSize={printPreview.paperSize}
                />
            )}
        </FeatureGate>
    );
}