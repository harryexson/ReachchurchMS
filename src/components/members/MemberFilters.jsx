import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, RotateCcw } from "lucide-react";

const MINISTRY_AREAS = [
    { value: "worship_team", label: "Worship Team" },
    { value: "children_ministry", label: "Children's Ministry" },
    { value: "youth_ministry", label: "Youth Ministry" },
    { value: "hospitality", label: "Hospitality" },
    { value: "security", label: "Security" },
    { value: "media_tech", label: "Media/Tech" },
    { value: "prayer_team", label: "Prayer Team" },
    { value: "outreach", label: "Outreach" },
    { value: "administration", label: "Administration" },
    { value: "maintenance", label: "Maintenance" },
    { value: "small_groups", label: "Small Groups" },
    { value: "missions", label: "Missions" }
];

const AGE_GROUPS = [
    { value: "child", label: "Child (0-12)" },
    { value: "teen", label: "Teen (13-17)" },
    { value: "young_adult", label: "Young Adult (18-35)" },
    { value: "adult", label: "Adult (36-59)" },
    { value: "senior", label: "Senior (60+)" }
];

const MEMBER_STATUSES = [
    { value: "member", label: "Member" },
    { value: "visitor", label: "Visitor" },
    { value: "regular_attendee", label: "Regular Attendee" },
    { value: "inactive", label: "Inactive" }
];

const GENDERS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer Not to Say" }
];

export default function MemberFilters({ filters, onFilterChange, members, memberGroups = [], onClearFilters }) {
    // Extract unique cities, states, and regions from members
    const uniqueCities = [...new Set(members.map(m => m.city).filter(Boolean))].sort();
    const uniqueStates = [...new Set(members.map(m => m.state).filter(Boolean))].sort();
    const uniqueRegions = [...new Set(members.map(m => m.region).filter(Boolean))].sort();

    const activeFilterCount = Object.values(filters).filter(v => v && v !== "all" && v !== "").length;

    return (
        <Card className="shadow-md border-0 bg-white/90">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-slate-700">Filters</span>
                        {activeFilterCount > 0 && (
                            <Badge className="bg-blue-100 text-blue-700">{activeFilterCount} active</Badge>
                        )}
                    </div>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={onClearFilters}>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {/* Search */}
                    <div>
                        <Label className="text-xs text-slate-500">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Name, email..."
                                className="pl-8 h-9"
                                value={filters.search || ""}
                                onChange={(e) => onFilterChange("search", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <Label className="text-xs text-slate-500">Status</Label>
                        <Select
                            value={filters.status || "all"}
                            onValueChange={(value) => onFilterChange("status", value)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {MEMBER_STATUSES.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Gender */}
                    <div>
                        <Label className="text-xs text-slate-500">Gender</Label>
                        <Select
                            value={filters.gender || "all"}
                            onValueChange={(value) => onFilterChange("gender", value)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Genders" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Genders</SelectItem>
                                {GENDERS.map(g => (
                                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Age Group */}
                    <div>
                        <Label className="text-xs text-slate-500">Age Group</Label>
                        <Select
                            value={filters.ageGroup || "all"}
                            onValueChange={(value) => onFilterChange("ageGroup", value)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Ages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Age Groups</SelectItem>
                                {AGE_GROUPS.map(a => (
                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* City */}
                    <div>
                        <Label className="text-xs text-slate-500">City</Label>
                        <Select
                            value={filters.city || "all"}
                            onValueChange={(value) => onFilterChange("city", value)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Cities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cities</SelectItem>
                                {uniqueCities.map(city => (
                                    <SelectItem key={city} value={String(city)}>{city}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* State */}
                    <div>
                        <Label className="text-xs text-slate-500">State/Region</Label>
                        <Select
                            value={filters.state || "all"}
                            onValueChange={(value) => onFilterChange("state", value)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All States" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All States</SelectItem>
                                {uniqueStates.map(state => (
                                    <SelectItem key={state} value={String(state)}>{state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ministry Involvement */}
                    <div>
                        <Label className="text-xs text-slate-500">Ministry Involvement</Label>
                        <Select
                            value={filters.ministry || "all"}
                            onValueChange={(value) => onFilterChange("ministry", value)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Ministries" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Ministries</SelectItem>
                                {MINISTRY_AREAS.map(m => (
                                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Region */}
                    <div>
                        <Label className="text-xs text-slate-500">Region</Label>
                        <Select
                            value={filters.region || "all"}
                            onValueChange={(value) => onFilterChange("region", value)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Regions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Regions</SelectItem>
                                {uniqueRegions.map(region => (
                                    <SelectItem key={region} value={String(region)}>{region}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Member Groups */}
                    <div>
                        <Label className="text-xs text-slate-500">Member Group</Label>
                        <Select
                            value={filters.group || "all"}
                            onValueChange={(value) => onFilterChange("group", value)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Groups" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Groups</SelectItem>
                                {memberGroups.map(group => (
                                    <SelectItem key={group.id} value={String(group.id)}>{group.group_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export { MINISTRY_AREAS, AGE_GROUPS, MEMBER_STATUSES, GENDERS };