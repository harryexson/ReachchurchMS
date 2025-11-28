import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Receipt, CheckCircle, ArrowLeft, History, 
    Camera, Plus, Loader2, Sparkles
} from "lucide-react";
import { createPageUrl } from "@/utils";
import ReceiptScanner from "../components/expenses/ReceiptScanner";

export default function QuickExpensePage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [showScanner, setShowScanner] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            // Load recent expenses submitted by this user
            const expenses = await base44.entities.Expense.filter({
                submitted_by: user.email
            }, "-created_date", 5);
            setRecentExpenses(expenses);
        } catch (err) {
            console.error("Error loading data:", err);
        }
        setIsLoading(false);
    };

    const handleExpenseExtracted = async (expenseData) => {
        setIsSaving(true);
        try {
            // Generate expense number
            const allExpenses = await base44.entities.Expense.list("-created_date", 1);
            const lastNum = allExpenses.length > 0 && allExpenses[0].expense_number
                ? parseInt(allExpenses[0].expense_number.split('-')[2]) || 0
                : 0;
            const expenseNumber = `EXP-${new Date().getFullYear()}-${String(lastNum + 1).padStart(3, '0')}`;

            await base44.entities.Expense.create({
                ...expenseData,
                expense_number: expenseNumber,
                submitted_by: currentUser.email,
                approval_status: "pending"
            });

            setSuccessMessage("Expense submitted successfully!");
            setShowScanner(false);
            loadData();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error saving expense:", err);
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 pb-24">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quick Expense</h1>
                        <p className="text-sm text-slate-600">Snap a receipt to add an expense</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = createPageUrl("FinancialManagement")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {successMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main Action Card */}
                {!showScanner ? (
                    <Card className="shadow-lg border-0 bg-white">
                        <CardContent className="p-6">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                                    <Receipt className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Add New Expense</h2>
                                    <p className="text-slate-600 text-sm mt-1">
                                        Take a photo of your receipt and our AI will extract all the details
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowScanner(true)}
                                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg"
                                >
                                    <Camera className="w-6 h-6 mr-2" />
                                    Scan Receipt
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <span>AI-powered data extraction</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="shadow-lg border-0 bg-white">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Scan Receipt</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowScanner(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ReceiptScanner
                                onExpenseExtracted={handleExpenseExtracted}
                                onClose={() => setShowScanner(false)}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Recent Expenses */}
                {recentExpenses.length > 0 && !showScanner && (
                    <Card className="shadow-lg border-0 bg-white/80">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Your Recent Submissions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentExpenses.map(expense => (
                                    <div 
                                        key={expense.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            {expense.receipt_url ? (
                                                <img 
                                                    src={expense.receipt_url} 
                                                    alt="Receipt"
                                                    className="w-10 h-10 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">
                                                    <Receipt className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm">
                                                    {expense.vendor_name || expense.description}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(expense.expense_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900">
                                                ${expense.amount?.toFixed(2)}
                                            </p>
                                            <Badge className={`text-xs ${
                                                expense.approval_status === 'approved' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : expense.approval_status === 'rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {expense.approval_status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Tips */}
                {!showScanner && (
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-blue-50">
                        <CardContent className="p-4">
                            <h3 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                Tips for Best Results
                            </h3>
                            <ul className="text-sm text-slate-600 space-y-1">
                                <li>• Ensure good lighting on your receipt</li>
                                <li>• Lay the receipt flat to avoid wrinkles</li>
                                <li>• Include the entire receipt in the frame</li>
                                <li>• Review and edit extracted data before saving</li>
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}