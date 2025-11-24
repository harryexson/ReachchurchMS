import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, X, RotateCcw } from "lucide-react";

export default function DonationFilters({ filters, onChange }) {
    const donationTypes = [
        "tithe", "offering", "building_fund", "building_fundraising",
        "missions", "pastor_welfare", "childrens_ministry", "youth_ministry",
        "food_bank", "conference", "orphanage", "benevolence", "special_event", "other"
    ];

    const toggleDonationType = (type) => {
        const updated = filters.donationTypes.includes(type)
            ? filters.donationTypes.filter(t => t !== type)
            : [...filters.donationTypes, type];
        onChange({ ...filters, donationTypes: updated });
    };

    const resetFilters = () => {
        onChange({
            dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0],
            donationTypes: [],
            minAmount: null,
            maxAmount: null,
            memberStatus: 'all',
            recurringOnly: false
        });
    };

    const quickRanges = [
        { label: 'This Month', getValue: () => {
            const now = new Date();
            return {
                dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0]
            };
        }},
        { label: 'Last Month', getValue: () => {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return {
                dateFrom: lastMonth.toISOString().split('T')[0],
                dateTo: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
            };
        }},
        { label: 'This Year', getValue: () => ({
            dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0]
        })},
        { label: 'Last Year', getValue: () => ({
            dateFrom: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
            dateTo: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0]
        })}
    ];

    return (
        <Card className="shadow-lg border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        Report Filters
                    </CardTitle>
                    <Button onClick={resetFilters} variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div>
                    <Label className="mb-2 block">Quick Date Ranges</Label>
                    <div className="flex flex-wrap gap-2">
                        {quickRanges.map(range => (
                            <Button
                                key={range.label}
                                variant="outline"
                                size="sm"
                                onClick={() => onChange({ ...filters, ...range.getValue() })}
                            >
                                {range.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>From Date</Label>
                        <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>To Date</Label>
                        <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Donation Types (click to filter)</Label>
                    <div className="flex flex-wrap gap-2">
                        {donationTypes.map(type => (
                            <Badge
                                key={type}
                                variant={filters.donationTypes.includes(type) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-blue-100"
                                onClick={() => toggleDonationType(type)}
                            >
                                {type.replace(/_/g, ' ')}
                                {filters.donationTypes.includes(type) && <X className="w-3 h-3 ml-1" />}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Min Amount ($)</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={filters.minAmount || ''}
                            onChange={(e) => onChange({ ...filters, minAmount: parseFloat(e.target.value) || null })}
                            placeholder="e.g., 50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Max Amount ($)</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={filters.maxAmount || ''}
                            onChange={(e) => onChange({ ...filters, maxAmount: parseFloat(e.target.value) || null })}
                            placeholder="e.g., 5000"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Member Status</Label>
                        <Select
                            value={filters.memberStatus}
                            onValueChange={(value) => onChange({ ...filters, memberStatus: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Donors</SelectItem>
                                <SelectItem value="members">Members Only</SelectItem>
                                <SelectItem value="non_members">Non-Members Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Donation Pattern</Label>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="recurring"
                                checked={filters.recurringOnly}
                                onChange={(e) => onChange({ ...filters, recurringOnly: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="recurring" className="cursor-pointer">Recurring Donations Only</Label>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}