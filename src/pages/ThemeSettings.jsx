import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Palette, Check, Eye, RefreshCw 
} from "lucide-react";
import { motion } from "framer-motion";

const THEME_TEMPLATES = [
    {
        name: "Modern Blue",
        primary: "#3b82f6",
        secondary: "#8b5cf6",
        accent: "#f59e0b",
        layout: "modern",
        preview: "bg-gradient-to-br from-blue-500 to-purple-600"
    },
    {
        name: "Classic Church",
        primary: "#7c3aed",
        secondary: "#db2777",
        accent: "#f97316",
        layout: "classic",
        preview: "bg-gradient-to-br from-purple-600 to-pink-600"
    },
    {
        name: "Fresh Green",
        primary: "#10b981",
        secondary: "#14b8a6",
        accent: "#f59e0b",
        layout: "modern",
        preview: "bg-gradient-to-br from-green-500 to-teal-500"
    },
    {
        name: "Bold Red",
        primary: "#ef4444",
        secondary: "#dc2626",
        accent: "#f97316",
        layout: "bold",
        preview: "bg-gradient-to-br from-red-600 to-orange-600"
    },
    {
        name: "Elegant Dark",
        primary: "#1e293b",
        secondary: "#475569",
        accent: "#3b82f6",
        layout: "minimal",
        preview: "bg-gradient-to-br from-slate-800 to-slate-600"
    },
    {
        name: "Warm Orange",
        primary: "#f97316",
        secondary: "#fb923c",
        accent: "#f59e0b",
        layout: "modern",
        preview: "bg-gradient-to-br from-orange-500 to-amber-500"
    }
];

export default function ThemeSettingsPage() {
    const [currentTheme, setCurrentTheme] = useState(null);
    const [customTheme, setCustomTheme] = useState({
        theme_name: "Custom Theme",
        primary_color: "#3b82f6",
        secondary_color: "#8b5cf6",
        accent_color: "#f59e0b",
        layout_style: "modern",
        font_family: "inter",
        card_style: "rounded",
        sidebar_style: "light",
        button_style: "rounded"
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        const themes = await base44.entities.ChurchTheme.filter({ is_active: true });
        if (themes.length > 0) {
            setCurrentTheme(themes[0]);
            setCustomTheme(themes[0]);
        }
    };

    const applyTemplate = (template) => {
        setCustomTheme({
            ...customTheme,
            theme_name: template.name,
            primary_color: template.primary,
            secondary_color: template.secondary,
            accent_color: template.accent,
            layout_style: template.layout
        });
    };

    const saveTheme = async () => {
        setIsSaving(true);
        try {
            // Deactivate current theme
            if (currentTheme) {
                await base44.entities.ChurchTheme.update(currentTheme.id, { is_active: false });
            }

            // Create or update new theme
            const newTheme = await base44.entities.ChurchTheme.create({
                ...customTheme,
                is_active: true
            });

            setCurrentTheme(newTheme);
            alert("Theme saved successfully! Refresh the page to see changes.");
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save theme.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Theme & Appearance</h1>
                    <p className="text-slate-600">Customize your church's look and feel</p>
                </div>

                <Tabs defaultValue="templates" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                        <TabsTrigger value="colors">Colors</TabsTrigger>
                        <TabsTrigger value="layout">Layout</TabsTrigger>
                    </TabsList>

                    {/* Templates */}
                    <TabsContent value="templates">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Choose a Template</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {THEME_TEMPLATES.map((template, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ scale: 1.02 }}
                                            className="cursor-pointer"
                                            onClick={() => applyTemplate(template)}
                                        >
                                            <Card className="overflow-hidden border-2 hover:border-blue-500 transition-colors">
                                                <div className={`h-40 ${template.preview} flex items-center justify-center text-white`}>
                                                    <div className="text-center">
                                                        <Palette className="h-12 w-12 mx-auto mb-2 opacity-90" />
                                                        <p className="font-semibold text-lg">{template.name}</p>
                                                    </div>
                                                </div>
                                                <CardContent className="pt-4">
                                                    <div className="flex gap-2 mb-2">
                                                        <div className="w-8 h-8 rounded" style={{ backgroundColor: template.primary }}></div>
                                                        <div className="w-8 h-8 rounded" style={{ backgroundColor: template.secondary }}></div>
                                                        <div className="w-8 h-8 rounded" style={{ backgroundColor: template.accent }}></div>
                                                    </div>
                                                    <Badge variant="outline">{template.layout}</Badge>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Colors */}
                    <TabsContent value="colors">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Customize Colors</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div>
                                        <Label>Primary Color</Label>
                                        <div className="flex gap-2 mt-2">
                                            <Input
                                                type="color"
                                                value={customTheme.primary_color}
                                                onChange={(e) => setCustomTheme({...customTheme, primary_color: e.target.value})}
                                                className="h-14 w-14"
                                            />
                                            <Input
                                                value={customTheme.primary_color}
                                                onChange={(e) => setCustomTheme({...customTheme, primary_color: e.target.value})}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Secondary Color</Label>
                                        <div className="flex gap-2 mt-2">
                                            <Input
                                                type="color"
                                                value={customTheme.secondary_color}
                                                onChange={(e) => setCustomTheme({...customTheme, secondary_color: e.target.value})}
                                                className="h-14 w-14"
                                            />
                                            <Input
                                                value={customTheme.secondary_color}
                                                onChange={(e) => setCustomTheme({...customTheme, secondary_color: e.target.value})}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Accent Color</Label>
                                        <div className="flex gap-2 mt-2">
                                            <Input
                                                type="color"
                                                value={customTheme.accent_color}
                                                onChange={(e) => setCustomTheme({...customTheme, accent_color: e.target.value})}
                                                className="h-14 w-14"
                                            />
                                            <Input
                                                value={customTheme.accent_color}
                                                onChange={(e) => setCustomTheme({...customTheme, accent_color: e.target.value})}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="border-2 rounded-lg p-6" style={{
                                    background: `linear-gradient(135deg, ${customTheme.primary_color}, ${customTheme.secondary_color})`
                                }}>
                                    <div className="bg-white rounded-lg p-6">
                                        <h3 className="text-2xl font-bold mb-4" style={{ color: customTheme.primary_color }}>
                                            Theme Preview
                                        </h3>
                                        <Button style={{ backgroundColor: customTheme.primary_color }} className="mr-2">
                                            Primary Button
                                        </Button>
                                        <Button style={{ backgroundColor: customTheme.secondary_color }}>
                                            Secondary Button
                                        </Button>
                                        <div className="mt-4">
                                            <Badge style={{ backgroundColor: customTheme.accent_color }} className="text-white">
                                                Accent Badge
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Layout */}
                    <TabsContent value="layout">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Layout Options</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Layout Style</Label>
                                    <div className="grid grid-cols-4 gap-3 mt-2">
                                        {["modern", "classic", "minimal", "bold"].map(style => (
                                            <Button
                                                key={style}
                                                variant={customTheme.layout_style === style ? "default" : "outline"}
                                                onClick={() => setCustomTheme({...customTheme, layout_style: style})}
                                                className="capitalize"
                                            >
                                                {style}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label>Card Style</Label>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        {["rounded", "sharp", "soft"].map(style => (
                                            <Button
                                                key={style}
                                                variant={customTheme.card_style === style ? "default" : "outline"}
                                                onClick={() => setCustomTheme({...customTheme, card_style: style})}
                                                className="capitalize"
                                            >
                                                {style}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label>Button Style</Label>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        {["rounded", "sharp", "pill"].map(style => (
                                            <Button
                                                key={style}
                                                variant={customTheme.button_style === style ? "default" : "outline"}
                                                onClick={() => setCustomTheme({...customTheme, button_style: style})}
                                                className="capitalize"
                                            >
                                                {style}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Save Button */}
                <Card className="shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Ready to apply your theme?</h3>
                                <p className="text-sm text-slate-600">Changes will be visible after refresh</p>
                            </div>
                            <Button
                                onClick={saveTheme}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                {isSaving ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-5 w-5 mr-2" />
                                        Save Theme
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}