import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Loader2 } from "lucide-react";

export default function MessageTemplateSelector({ onTemplateSelected }) {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const allTemplates = await base44.entities.GivingMessage.list();
            setTemplates(allTemplates);
        } catch (error) {
            console.error("Failed to load templates:", error);
        }
        setIsLoading(false);
    };

    const messageTypeLabels = {
        thank_you: "Thank You",
        reminder: "Reminder",
        impact_update: "Impact Update",
        recurring_thanks: "Recurring Thanks",
        first_time_donor: "First-Time Donor"
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                    <p className="text-slate-600">Loading templates...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Message Templates</h3>
                <Button onClick={loadTemplates} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {templates.map(template => (
                    <Card key={template.id} className="hover:shadow-lg transition-all cursor-pointer">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">
                                        {messageTypeLabels[template.message_type] || template.message_type}
                                    </CardTitle>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="outline">{template.channel}</Badge>
                                        {template.is_active ? (
                                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                                        ) : (
                                            <Badge variant="outline">Inactive</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                                {template.message_body}
                            </p>
                            <Button
                                onClick={() => onTemplateSelected(template)}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Use This Template
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {templates.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-600">No templates available</p>
                        <p className="text-sm text-slate-500 mt-1">Create templates in Giving Messages</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}