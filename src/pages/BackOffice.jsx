import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Users, CreditCard, MessageCircle, TrendingUp, Building2, DollarSign, 
    Shield, FileText, Receipt, Settings, UserCog, Lock, AlertTriangle,
    Megaphone, Briefcase, Crown
} from "lucide-react";
import SubscriptionDashboard from "../components/backoffice/SubscriptionDashboard";
import SupportDashboard from "../components/backoffice/SupportDashboard";
import CRMDashboard from "../components/backoffice/CRMDashboard";
import UserManagement from "../components/backoffice/UserManagement";
import BackOfficeStats from "../components/backoffice/BackOfficeStats";
import PricingTable from "../components/backoffice/PricingTable";
import BillingDashboard from "../components/backoffice/BillingDashboard";
import AccountingDashboard from "../components/backoffice/AccountingDashboard";
import PricingManagement from "../components/backoffice/PricingManagement";
import TermsManagement from "../components/backoffice/TermsManagement";
import AccountSuspension from "../components/backoffice/AccountSuspension";
import RefundProcessing from "../components/backoffice/RefundProcessing";
import BackOfficeUserManagement from "../components/backoffice/BackOfficeUserManagement";
import MarketingDashboard from "../components/backoffice/MarketingDashboard";
import HRDashboard from "../components/backoffice/HRDashboard";
import SubscriptionPricingManager from "../components/backoffice/SubscriptionPricingManager";
import HRManagement from "../components/backoffice/HRManagement";
import SupportChatDashboard from "../components/backoffice/SupportChatDashboard";

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
    const [currentUser, setCurrentUser] = useState(null);
    const [backOfficeUser, setBackOfficeUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthAndLoadData = async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
                
                // Check if user is platform developer
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

                // Load back office user profile and permissions
                const backOfficeUsers = await base44.entities.BackOfficeUser.filter({ 
                    user_email: user.email,
                    is_active: true
                });

                if (backOfficeUsers.length > 0) {
                    const boUser = backOfficeUsers[0];
                    setBackOfficeUser(boUser);
                    setUserPermissions(boUser.permissions);
                } else {
                    // Super admin/developer gets all permissions - FULLY ACTIVATED
                    setUserPermissions({
                        can_view_financials: true,
                        can_process_refunds: true,
                        can_manage_subscriptions: true,
                        can_update_pricing: true,
                        can_suspend_accounts: true,
                        can_view_support_tickets: true,
                        can_manage_support_tickets: true,
                        can_view_crm: true,
                        can_manage_crm: true,
                        can_view_marketing: true,
                        can_manage_marketing: true,
                        can_view_hr: true,
                        can_manage_hr: true,
                        can_manage_users: true,
                        can_view_analytics: true,
                        can_export_data: true,
                        can_manage_terms: true,
                        can_manage_support_chat: true
                    });
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
                base44.entities.Subscription.list("-created_date", 200),
                base44.entities.SupportTicket.list("-created_date", 200),
                base44.entities.CustomerInteraction.list("-created_date", 200),
                base44.entities.User.list("-created_date", 200),
                base44.entities.Invoice.list("-created_date", 200),
                base44.entities.Refund.list("-created_date", 200),
                base44.entities.PlatformExpense.list("-created_date", 200)
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

    const hasPermission = (permission) => {
        return userPermissions && userPermissions[permission] === true;
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
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Crown className="w-8 h-8 text-blue-600" />
                            Developer Back Office
                        </h1>
                        <p className="text-slate-600 mt-1">Platform management and analytics</p>
                        {backOfficeUser && (
                            <Badge className="mt-2" variant="outline">
                                {backOfficeUser.role === 'super_admin' ? 'Super Administrator' : 
                                 backOfficeUser.role === 'accounting' ? 'Accounting' :
                                 backOfficeUser.role === 'support' ? 'Support Team' :
                                 backOfficeUser.role === 'marketing' ? 'Marketing' :
                                 backOfficeUser.role === 'hr' ? 'Human Resources' :
                                 backOfficeUser.role === 'developer' ? 'Developer' : 'Team Member'}
                            </Badge>
                        )}
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

                {!hasPermission('can_view_analytics') && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            You have limited access. Contact an administrator to adjust your permissions.
                        </AlertDescription>
                    </Alert>
                )}

                <BackOfficeStats 
                    subscriptions={subscriptions}
                    supportTickets={supportTickets}
                    interactions={interactions}
                />

                <Tabs defaultValue="subscriptions">
                    <TabsList className="grid grid-cols-5 lg:grid-cols-10">
                        <TabsTrigger value="support-chat">Support Chat</TabsTrigger>
                        <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                        <TabsTrigger value="pricing-manager">Pricing Manager</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                        <TabsTrigger value="refunds">Refunds</TabsTrigger>
                        <TabsTrigger value="suspension">Accounts</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                        <TabsTrigger value="accounting">Accounting</TabsTrigger>
                        <TabsTrigger value="support">Support</TabsTrigger>
                        <TabsTrigger value="crm">CRM</TabsTrigger>
                        <TabsTrigger value="marketing">Marketing</TabsTrigger>
                        <TabsTrigger value="hr-management">HR Management</TabsTrigger>
                        <TabsTrigger value="hr">HR</TabsTrigger>
                        <TabsTrigger value="terms">Terms</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="bo-users">BO Users</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="support-chat">
                        <SupportChatDashboard />
                    </TabsContent>

                    <TabsContent value="subscriptions">
                        <SubscriptionDashboard 
                            subscriptions={subscriptions} 
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                            canManage={true}
                        />
                    </TabsContent>

                    <TabsContent value="pricing-manager">
                        <SubscriptionPricingManager />
                    </TabsContent>

                    <TabsContent value="hr-management">
                        <HRManagement />
                    </TabsContent>
                    
                    <TabsContent value="pricing">
                        <PricingManagement 
                            onRefresh={loadBackOfficeData}
                            currentUser={currentUser}
                        />
                    </TabsContent>
                    
                    <TabsContent value="refunds">
                        <RefundProcessing 
                            refunds={refunds}
                            subscriptions={subscriptions}
                            invoices={invoices}
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                            currentUser={currentUser}
                        />
                    </TabsContent>
                    
                    <TabsContent value="suspension">
                        <AccountSuspension 
                            subscriptions={subscriptions}
                            onRefresh={loadBackOfficeData}
                            currentUser={currentUser}
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
                            canManage={true}
                        />
                    </TabsContent>
                    
                    <TabsContent value="crm">
                        <CRMDashboard 
                            interactions={interactions}
                            subscriptions={subscriptions}
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                            canManage={true}
                        />
                    </TabsContent>
                    
                    <TabsContent value="marketing">
                        <MarketingDashboard 
                            subscriptions={subscriptions}
                            interactions={interactions}
                            onRefresh={loadBackOfficeData}
                            canManage={true}
                        />
                    </TabsContent>
                    
                    <TabsContent value="hr">
                        <HRDashboard 
                            onRefresh={loadBackOfficeData}
                            canManage={true}
                        />
                    </TabsContent>
                    
                    <TabsContent value="terms">
                        <TermsManagement 
                            onRefresh={loadBackOfficeData}
                            currentUser={currentUser}
                        />
                    </TabsContent>
                    
                    <TabsContent value="users">
                        <UserManagement 
                            users={systemUsers}
                            isLoading={isLoading}
                            onRefresh={loadBackOfficeData}
                        />
                    </TabsContent>
                    
                    <TabsContent value="bo-users">
                        <BackOfficeUserManagement 
                            onRefresh={loadBackOfficeData}
                            currentUser={currentUser}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}