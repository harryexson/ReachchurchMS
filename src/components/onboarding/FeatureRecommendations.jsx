import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function FeatureRecommendations({ churchSize }) {
    const getRecommendations = () => {
        const baseFeatures = [
            { name: "Member Directory", category: "people", essential: true },
            { name: "Event Management", category: "events", essential: true },
            { name: "Online Giving", category: "giving", essential: true },
            { name: "Visitor Tracking", category: "people", essential: true }
        ];

        const sizeFeatures = {
            small: [
                { name: "Email Communications", category: "comms", recommended: true },
                { name: "Basic Analytics", category: "analytics", recommended: true }
            ],
            medium: [
                { name: "SMS/Text Messaging", category: "comms", recommended: true },
                { name: "Kids Check-In System", category: "events", recommended: true },
                { name: "Advanced Analytics", category: "analytics", recommended: true },
                { name: "Automated Workflows", category: "automation", recommended: true }
            ],
            large: [
                { name: "SMS/MMS Campaigns", category: "comms", recommended: true },
                { name: "Video Meetings (200 participants)", category: "video", recommended: true },
                { name: "Multi-Campus Support", category: "enterprise", recommended: true },
                { name: "Workflow Automation", category: "automation", recommended: true },
                { name: "Advanced Financial Reporting", category: "finance", recommended: true },
                { name: "Dedicated Phone Support", category: "support", recommended: true }
            ]
        };

        return [...baseFeatures, ...(sizeFeatures[churchSize] || [])];
    };

    const features = getRecommendations();
    const essentialFeatures = features.filter(f => f.essential);
    const recommendedFeatures = features.filter(f => f.recommended);

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Recommended Features</h2>
                <p className="text-slate-600">Based on your church size, we recommend these features</p>
            </div>

            {/* Essential Features */}
            <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Essential Features (Included)
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                    {essentialFeatures.map((feature) => (
                        <Card key={feature.name} className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-slate-900">{feature.name}</p>
                                        <p className="text-xs text-slate-600 capitalize">{feature.category}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Recommended Features */}
            {recommendedFeatures.length > 0 && (
                <div>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        Recommended for Your Size ({recommendedFeatures.length})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        {recommendedFeatures.map((feature) => (
                            <Card key={feature.name} className="border-blue-200 bg-blue-50">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-slate-900">{feature.name}</p>
                                            <p className="text-xs text-slate-600 capitalize">{feature.category}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}