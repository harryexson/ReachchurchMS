import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Camera, Upload, Loader2, CheckCircle, XCircle, 
    FileImage, Sparkles, Edit, Save, RotateCcw
} from "lucide-react";

const SUBCATEGORIES = {
    facilities: ["rent", "mortgage", "repairs", "cleaning", "security", "landscaping"],
    utilities: ["electric", "gas", "water", "internet", "phone", "trash"],
    salaries: ["pastoral", "administrative", "custodial", "music", "youth", "benefits"],
    missions: ["local", "international", "disaster_relief", "partnerships"],
    ministry_programs: ["small_groups", "bible_study", "discipleship", "counseling"],
    office_supplies: ["paper", "ink", "equipment", "furniture", "software"],
    marketing: ["advertising", "printing", "signage", "social_media", "website"],
    events: ["decorations", "equipment_rental", "catering", "entertainment", "venue"],
    maintenance: ["hvac", "plumbing", "electrical", "painting", "general"],
    insurance: ["property", "liability", "workers_comp", "vehicle"],
    professional_services: ["accounting", "legal", "consulting", "it_services"],
    technology: ["computers", "av_equipment", "streaming", "software_subscriptions"],
    food_beverages: ["coffee", "meals", "snacks", "communion_supplies"],
    travel: ["mileage", "flights", "lodging", "meals", "conference_fees"],
    education_training: ["books", "courses", "conferences", "materials"],
    outreach: ["community_events", "evangelism", "benevolence", "food_pantry"],
    worship: ["music_licensing", "instruments", "sound_equipment", "stage"],
    childcare: ["supplies", "curriculum", "toys", "safety", "snacks"],
    youth: ["activities", "camps", "curriculum", "events", "supplies"],
    other: ["miscellaneous", "uncategorized"]
};

export default function ReceiptScanner({ onExpenseExtracted, onClose }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setExtractedData(null);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const processReceipt = async () => {
        if (!file) return;
        
        setIsProcessing(true);
        setError(null);

        try {
            // Upload the file first
            const { file_url } = await base44.integrations.Core.UploadFile({ file });

            // Use AI to extract data from the receipt
            const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
                file_url: file_url,
                json_schema: {
                    type: "object",
                    properties: {
                        vendor_name: { type: "string", description: "Name of the store or vendor" },
                        vendor_address: { type: "string", description: "Address of the vendor if visible" },
                        expense_date: { type: "string", description: "Date on the receipt in YYYY-MM-DD format" },
                        subtotal: { type: "number", description: "Subtotal before tax" },
                        tax_amount: { type: "number", description: "Tax amount" },
                        total_amount: { type: "number", description: "Total amount paid" },
                        payment_method: { type: "string", description: "Payment method used (cash, credit_card, debit_card, check)" },
                        items: { 
                            type: "array", 
                            items: { 
                                type: "object",
                                properties: {
                                    description: { type: "string" },
                                    amount: { type: "number" }
                                }
                            },
                            description: "List of items purchased"
                        },
                        suggested_category: { 
                            type: "string", 
                            description: "Suggested expense category based on items (facilities, utilities, office_supplies, food_beverages, technology, maintenance, events, travel, other)"
                        },
                        suggested_subcategory: {
                            type: "string",
                            description: "More specific subcategory"
                        },
                        description: { type: "string", description: "Brief description of what was purchased" }
                    }
                }
            });

            if (extractionResult.status === "success" && extractionResult.output) {
                const data = extractionResult.output;
                setExtractedData({
                    vendor_name: data.vendor_name || "",
                    vendor_address: data.vendor_address || "",
                    expense_date: data.expense_date || new Date().toISOString().split('T')[0],
                    amount: data.total_amount || data.subtotal || 0,
                    tax_amount: data.tax_amount || 0,
                    payment_method: data.payment_method || "other",
                    category: data.suggested_category || "other",
                    subcategory: data.suggested_subcategory || "",
                    description: data.description || (data.items?.map(i => i.description).join(", ") || ""),
                    items: data.items || [],
                    receipt_url: file_url,
                    ai_extracted: true,
                    ai_confidence: 85
                });
            } else {
                throw new Error(extractionResult.details || "Failed to extract data from receipt");
            }
        } catch (err) {
            console.error("Receipt processing error:", err);
            setError(err.message || "Failed to process receipt. Please enter details manually.");
            
            // Still set the uploaded file URL for manual entry
            try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setExtractedData({
                    vendor_name: "",
                    expense_date: new Date().toISOString().split('T')[0],
                    amount: 0,
                    tax_amount: 0,
                    payment_method: "other",
                    category: "other",
                    subcategory: "",
                    description: "",
                    receipt_url: file_url,
                    ai_extracted: false
                });
            } catch (uploadErr) {
                setError("Failed to upload receipt. Please try again.");
            }
        }

        setIsProcessing(false);
    };

    const handleDataChange = (field, value) => {
        setExtractedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = () => {
        if (!extractedData) return;
        
        const expenseData = {
            vendor_name: extractedData.vendor_name,
            vendor_address: extractedData.vendor_address,
            expense_date: extractedData.expense_date,
            amount: parseFloat(extractedData.amount) || 0,
            tax_amount: parseFloat(extractedData.tax_amount) || 0,
            payment_method: extractedData.payment_method,
            category: extractedData.category,
            subcategory: extractedData.subcategory,
            description: extractedData.description,
            receipt_url: extractedData.receipt_url,
            ai_extracted: extractedData.ai_extracted,
            ai_confidence: extractedData.ai_confidence,
            submitted_via: "receipt_scan"
        };
        
        onExpenseExtracted(expenseData);
    };

    const resetScanner = () => {
        setFile(null);
        setPreview(null);
        setExtractedData(null);
        setError(null);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            {!preview && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={() => cameraInputRef.current?.click()}
                            className="h-32 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Camera className="w-8 h-8" />
                            <span>Take Photo</span>
                        </Button>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="h-32 flex flex-col gap-2"
                        >
                            <Upload className="w-8 h-8" />
                            <span>Upload Image</span>
                        </Button>
                    </div>

                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <p className="text-sm text-center text-slate-500">
                        Take a photo or upload an image of your receipt
                    </p>
                </div>
            )}

            {/* Preview Section */}
            {preview && !extractedData && (
                <div className="space-y-4">
                    <div className="relative">
                        <img 
                            src={preview} 
                            alt="Receipt preview" 
                            className="w-full max-h-64 object-contain rounded-lg border"
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={resetScanner}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={processReceipt}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Scanning Receipt...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Extract Data with AI
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-yellow-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Extracted Data Display */}
            {extractedData && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {extractedData.ai_extracted ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-sm text-green-700 font-medium">Data Extracted</span>
                                    <Badge className="bg-purple-100 text-purple-800">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        AI Powered
                                    </Badge>
                                </>
                            ) : (
                                <>
                                    <FileImage className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm text-blue-700 font-medium">Manual Entry</span>
                                </>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            <Edit className="w-4 h-4 mr-1" />
                            {isEditing ? "Done" : "Edit"}
                        </Button>
                    </div>

                    {/* Receipt thumbnail */}
                    {preview && (
                        <div className="flex gap-4">
                            <img 
                                src={preview} 
                                alt="Receipt" 
                                className="w-20 h-20 object-cover rounded-lg border"
                            />
                            <div className="flex-1">
                                <p className="font-semibold">{extractedData.vendor_name || "Unknown Vendor"}</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${parseFloat(extractedData.amount || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-slate-500">{extractedData.expense_date}</p>
                            </div>
                        </div>
                    )}

                    {/* Editable Fields */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Vendor</Label>
                                <Input
                                    value={extractedData.vendor_name}
                                    onChange={(e) => handleDataChange("vendor_name", e.target.value)}
                                    disabled={!isEditing}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Date</Label>
                                <Input
                                    type="date"
                                    value={extractedData.expense_date}
                                    onChange={(e) => handleDataChange("expense_date", e.target.value)}
                                    disabled={!isEditing}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Amount</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={extractedData.amount}
                                    onChange={(e) => handleDataChange("amount", e.target.value)}
                                    disabled={!isEditing}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Tax</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={extractedData.tax_amount}
                                    onChange={(e) => handleDataChange("tax_amount", e.target.value)}
                                    disabled={!isEditing}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Category</Label>
                                <select
                                    value={extractedData.category}
                                    onChange={(e) => handleDataChange("category", e.target.value)}
                                    disabled={!isEditing}
                                    className="w-full h-9 px-3 rounded-md border border-slate-300 text-sm mt-1"
                                >
                                    {Object.keys(SUBCATEGORIES).map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs">Subcategory</Label>
                                <select
                                    value={extractedData.subcategory}
                                    onChange={(e) => handleDataChange("subcategory", e.target.value)}
                                    disabled={!isEditing}
                                    className="w-full h-9 px-3 rounded-md border border-slate-300 text-sm mt-1"
                                >
                                    <option value="">Select...</option>
                                    {(SUBCATEGORIES[extractedData.category] || []).map(sub => (
                                        <option key={sub} value={sub}>
                                            {sub.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">Payment Method</Label>
                            <select
                                value={extractedData.payment_method}
                                onChange={(e) => handleDataChange("payment_method", e.target.value)}
                                disabled={!isEditing}
                                className="w-full h-9 px-3 rounded-md border border-slate-300 text-sm mt-1"
                            >
                                <option value="cash">Cash</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="check">Check</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="petty_cash">Petty Cash</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <Label className="text-xs">Description</Label>
                            <Input
                                value={extractedData.description}
                                onChange={(e) => handleDataChange("description", e.target.value)}
                                disabled={!isEditing}
                                placeholder="What was this expense for?"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Expense
                        </Button>
                        <Button
                            variant="outline"
                            onClick={resetScanner}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Scan Another
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}