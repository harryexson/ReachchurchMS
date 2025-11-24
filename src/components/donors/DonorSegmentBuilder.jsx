import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DonorSegmentBuilder({ criteria, onChange }) {
    const [selectedTypes, setSelectedTypes] = React.useState(criteria.donation_types || []);

    const donationTypes = [
        "tithe", "offering", "building_fund", "building_fundraising",
        "missions", "pastor_welfare", "childrens_ministry", "youth_ministry",
        "food_bank", "conference", "orphanage", "benevolence", "special_event", "other"
    ];

    const toggleDonationType = (type) => {
        const updated = selectedTypes.includes(type)
            ? selectedTypes.filter(t => t !== type)
            : [...selectedTypes, type];
        setSelectedTypes(updated);
        onChange({ ...criteria, donation_types: updated });
    };

    return (
        <Card className="bg-slate-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="w-5 h-5" />
                    Target Audience Filters
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Donation Types (leave empty for all)</Label>
                    <div className="flex flex-wrap gap-2">
                        {donationTypes.map(type => (
                            <Badge
                                key={type}
                                variant={selectedTypes.includes(type) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-blue-100"
                                onClick={() => toggleDonationType(type)}
                            >
                                {type.replace(/_/g, ' ')}
                                {selectedTypes.includes(type) && <X className="w-3 h-3 ml-1" />}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Min Donation Amount</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={criteria.min_donation_amount || ''}
                            onChange={(e) => onChange({ ...criteria, min_donation_amount: parseFloat(e.target.value) || null })}
                            placeholder="e.g., 50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Max Donation Amount</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={criteria.max_donation_amount || ''}
                            onChange={(e) => onChange({ ...criteria, max_donation_amount: parseFloat(e.target.value) || null })}
                            placeholder="e.g., 1000"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Donated From</Label>
                        <Input
                            type="date"
                            value={criteria.donation_date_from || ''}
                            onChange={(e) => onChange({ ...criteria, donation_date_from: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Donated Until</Label>
                        <Input
                            type="date"
                            value={criteria.donation_date_to || ''}
                            onChange={(e) => onChange({ ...criteria, donation_date_to: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="recurring"
                            checked={criteria.recurring_donors_only || false}
                            onChange={(e) => onChange({ ...criteria, recurring_donors_only: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <Label htmlFor="recurring" className="cursor-pointer">Recurring donors only</Label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="firstTime"
                            checked={criteria.first_time_donors_only || false}
                            onChange={(e) => onChange({ ...criteria, first_time_donors_only: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <Label htmlFor="firstTime" className="cursor-pointer">First-time donors only</Label>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Member Status</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={criteria.member_status?.includes('member') ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                const current = criteria.member_status || [];
                                const updated = current.includes('member')
                                    ? current.filter(s => s !== 'member')
                                    : [...current, 'member'];
                                onChange({ ...criteria, member_status: updated });
                            }}
                        >
                            Members Only
                        </Button>
                        <Button
                            type="button"
                            variant={criteria.member_status?.includes('non_member') ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                const current = criteria.member_status || [];
                                const updated = current.includes('non_member')
                                    ? current.filter(s => s !== 'non_member')
                                    : [...current, 'non_member'];
                                onChange({ ...criteria, member_status: updated });
                            }}
                        >
                            Non-Members Only
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}