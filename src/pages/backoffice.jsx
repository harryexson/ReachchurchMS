import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import { Subscription } from "@/entities/Subscription";
import { SupportTicket } from "@/entities/SupportTicket";
import { CustomerInteraction } from "@/entities/CustomerInteraction";
import { Invoice } from "@/entities/Invoice";
import { Refund } from "@/entities/Refund";
import { PlatformExpense } from "@/entities/PlatformExpense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CreditCard, MessageCircle, TrendingUp, Building2, DollarSign, Shield, FileText, Receipt } from "lucide-react";
import SubscriptionDashboard from "../components/backoffice/SubscriptionDashboard";
import SupportDashboard from "../components/backoffice/SupportDashboard";
import CRMDashboard from "../components/backoffice/CRMDashboard";
import UserManagement from "../components/backoffice/UserManagement";
import BackOfficeStats from "../components/backoffice/BackOfficeStats";
import PricingTable from "../components/backoffice/PricingTable";
import BillingDashboard from "../components/backoffice/BillingDashboard";
import AccountingDashboard from "../components/backoffice/AccountingDashboard";

export default function BackOfficePage() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [systemUsers, setSystemUsers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthAndLoadData = async () => {
            try {
                const user = await User.me();
                const isPlatformDeveloper = user.role === 'admin' && 
                                          user.email && 
                                          (user.email.includes('@reachtech.dev') || 
                                           user.email.includes('@platformdev.com') ||
                                           user.developer_access === true ||
                                           user.email === 'david@base44.app');
                
                if (!isPlatformDeveloper) {
                    console.warn("SECURITY ALERT: Unauthorized access attempt");
                    navigate(createPageUrl('Dashboard'));
                    return;
                }
                setIsAuthorized(true);
                await loadBackOfficeData();
            } catch (error) {
                console.error("Authentication check failed:", error);
                navigate(createPageUrl('Dashboard'));
            }
        };
        checkAuthAndLoadData();
    }, [navigate]);

    const loadBackOfficeData = async () => {
        setIsLoading(true);
        try {
            const [subscriptionsList, ticketsList, interactionsList, usersList, invoicesList, refundsList, expensesList] = await Promise.all([
                Subscription.list("-created_date"),
                SupportTicket.list("-created_date"),
                CustomerInteraction.list("-created_date"),
                User.list("-created_date"),
                Invoice.list("-created_date"),
                Refund.list("-created_date"),
                PlatformExpense.list("-created_date")
            ]);
            setSubscriptions(subscriptionsList);
            setSupportTickets(ticketsList);
            setInteractions(interactionsList);
            setSystemUsers(usersList.filter(user => user.role === 'admin'));
            setInvoices(invoicesList);
            setRefunds(refundsList);
            setExpenses(expensesList);
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setIsLoading(false);
    };

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const trialSubscriptions = subscriptions.filter(s => s.status === 'trial').length;
    const openTickets = supportTickets.filter(t => ['open', 'in_progress'].includes(t.status)).length;
    const monthlyRevenue = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.monthly_price || 0), 0);
    const pendingRefunds = refunds.filter(r => r.status === 'pending').length;
    const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length;

    if (!isAuthorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <Shield className="h-16 w-16 text-red-500" />
                    <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
                    <p className="text-slate-600">Developer access only</p>
                    <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Developer Back Office</h1>
                        <p className="text-slate-600 mt-1">Platform management and analytics</p>
                    </div>
                    <Button onClick={loadBackOfficeData}>
                        <Building2 className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Active</p>
                                    <p className="text-2xl font-bold">{activeSubscriptions}</p>
                                </div>
                                <CreditCard className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Trials</p>
                                    <p className="text-2xl font-bold">{trialSubscriptions}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Revenue</p>
                                    <p className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Tickets</p>
                                    <p className="text-2xl font-bold">{openTickets}</p>
                                </div>
                                <MessageCircle className="w-8 h-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Refunds</p>
                                    <p className="text-2xl font-bold">{pendingRefunds}</p>
                                </div>
                                <Receipt className="w-8 h-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Unpaid</p>
                                    <p className="text-2xl font-bold">{unpaidInvoices}</p>
                                </div>
                                <FileText className="w-8 h-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <BackOfficeStats 
                    subscriptions={subscriptions}
                    supportTickets={supportTickets}
                    interactions={interactions}
                />

                <Tabs defaultValue="subscriptions">
                    <TabsList>
                        <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                        <TabsTrigger value="accounting">Accounting</TabsTrigger>
                        <TabsTrigger value="support">Support</TabsTrigger>
                        <TabsTrigger value="crm">CRM</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="subscriptions">
                        <SubscriptionDashboard 
                            subscriptions={subscriptions} 
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                        />
                    </TabsContent>
                    
                    <TabsContent value="billing">
                        <BillingDashboard 
                            invoices={invoices}
                            refunds={refunds}
                            subscriptions={subscriptions}
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                        />
                    </TabsContent>
                    
                    <TabsContent value="accounting">
                        <AccountingDashboard 
                            invoices={invoices}
                            expenses={expenses}
                            subscriptions={subscriptions}
                            refunds={refunds}
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                        />
                    </TabsContent>
                    
                    <TabsContent value="support">
                        <SupportDashboard 
                            supportTickets={supportTickets} 
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                        />
                    </TabsContent>
                    
                    <TabsContent value="crm">
                        <CRMDashboard 
                            interactions={interactions}
                            subscriptions={subscriptions}
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                        />
                    </TabsContent>
                    
                    <TabsContent value="users">
                        <UserManagement 
                            users={systemUsers}
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                        />
                    </TabsContent>
                    
                    <TabsContent value="pricing">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Pricing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PricingTable />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}