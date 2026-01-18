import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, MapPin } from "lucide-react";

export default function ChurchSizeSelector({ selected, onChange }) {
    const sizes = [
        {
            id: "small",
            label: "Small Church",
            members: "Under 200 members",
            icon: Users,
            description: "Starting out or intimate community",
            color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
        },
        {
            id: "medium",
            label: "Medium Church",
            members: "200-1000 members",
            icon: Building2,
            description: "Growing congregation",
            color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50"
        },
        {
            id: "large",
            label: "Large Church",
            members: "1000+ members",
            icon: MapPin,
            description: "Multi-campus or large gathering",
            color: "border-green-200 hover:border-green-400 hover:bg-green-50"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">How large is your church?</h2>
                <p className="text-slate-600">This helps us recommend the right features for your needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {sizes.map((size) => {
                    const Icon = size.icon;
                    const isSelected = selected === size.id;
                    
                    return (
                        <button
                            key={size.id}
                            onClick={() => onChange(size.id)}
                            className={`p-6 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                    ? size.id === 'small' ? 'border-blue-500 bg-blue-50' :
                                      size.id === 'medium' ? 'border-purple-500 bg-purple-50' :
                                      'border-green-500 bg-green-50'
                                    : size.color
                            }`}
                        >
                            <Icon className="w-8 h-8 mb-3 text-slate-600" />
                            <h3 className="font-bold text-slate-900 mb-1">{size.label}</h3>
                            <p className="text-sm text-slate-600 mb-2">{size.members}</p>
                            <p className="text-xs text-slate-500">{size.description}</p>
                            {isSelected && (
                                <div className="mt-3 pt-3 border-t">
                                    <span className="text-xs font-semibold text-slate-700">✓ Selected</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}