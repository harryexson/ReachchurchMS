import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, Filter, Baby } from "lucide-react";
import { format } from "date-fns";

export default function KidsCheckInReport() {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [childNameFilter, setChildNameFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");

    useEffect(() => {
        loadRecords();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [records, startDate, endDate, childNameFilter, locationFilter]);

    const loadRecords = async () => {
        setIsLoading(true);
        try {
            const allRecords = await base44.entities.KidsCheckIn.list("-check_in_time");
            setRecords(allRecords);
        } catch (error) {
            console.error("Error loading records:", error);
        }
        setIsLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...records];

        // Date range filter
        if (startDate) {
            filtered = filtered.filter(r => {
                const checkInDate = new Date(r.check_in_time);
                return checkInDate >= new Date(startDate);
            });
        }

        if (endDate) {
            filtered = filtered.filter(r => {
                const checkInDate = new Date(r.check_in_time);
                return checkInDate <= new Date(endDate + "T23:59:59");
            });
        }

        // Child name filter
        if (childNameFilter) {
            filtered = filtered.filter(r => 
                r.child_name.toLowerCase().includes(childNameFilter.toLowerCase())
            );
        }

        // Location filter
        if (locationFilter) {
            filtered = filtered.filter(r => 
                r.location_room?.toLowerCase().includes(locationFilter.toLowerCase()) ||
                r.ministry_area?.toLowerCase().includes(locationFilter.toLowerCase())
            );
        }

        setFilteredRecords(filtered);
    };

    const exportToCSV = () => {
        const headers = [
            "Child Name",
            "Age",
            "Grade",
            "Parent Name",
            "Parent Phone",
            "Ministry Area",
            "Room/Location",
            "Teacher/Staff",
            "Event",
            "Registration Date",
            "Check-In Time",
            "Check-In By",
            "Checked Out",
            "Check-Out Time",
            "Check-Out By",
            "Allergies/Notes"
        ];

        const rows = filteredRecords.map(r => [
            r.child_name,
            r.child_age,
            r.child_grade || "",
            r.parent_name,
            r.parent_phone,
            r.ministry_area?.replace('_', ' ') || "",
            r.location_room || "",
            r.teacher_staff || "",
            r.event_title,
            r.registration_date ? format(new Date(r.registration_date), 'yyyy-MM-dd HH:mm:ss') : "",
            r.check_in_time ? format(new Date(r.check_in_time), 'yyyy-MM-dd HH:mm:ss') : "",
            r.check_in_by_name || r.check_in_by || "",
            r.checked_out ? "Yes" : "No",
            r.check_out_time ? format(new Date(r.check_out_time), 'yyyy-MM-dd HH:mm:ss') : "",
            r.check_out_by_name || r.check_out_by || "",
            r.child_allergies || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kids-checkin-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const calculateDuration = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return "N/A";
        const diff = new Date(checkOut) - new Date(checkIn);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Baby className="w-6 h-6 text-purple-600" />
                        Kids Check-In/Out Records
                    </CardTitle>
                    <Button onClick={exportToCSV} disabled={filteredRecords.length === 0} className="bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export to CSV
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>End Date</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Child Name</Label>
                        <Input
                            placeholder="Search by name..."
                            value={childNameFilter}
                            onChange={(e) => setChildNameFilter(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Location/Room</Label>
                        <Input
                            placeholder="Search location..."
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        />
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium">Total Check-Ins</p>
                        <p className="text-2xl font-bold text-blue-900">{filteredRecords.length}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-600 font-medium">Checked Out</p>
                        <p className="text-2xl font-bold text-green-900">
                            {filteredRecords.filter(r => r.checked_out).length}
                        </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-600 font-medium">Still Checked In</p>
                        <p className="text-2xl font-bold text-yellow-900">
                            {filteredRecords.filter(r => !r.checked_out).length}
                        </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-600 font-medium">Unique Children</p>
                        <p className="text-2xl font-bold text-purple-900">
                            {new Set(filteredRecords.map(r => r.child_name)).size}
                        </p>
                    </div>
                </div>

                {/* Records Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Child</TableHead>
                                <TableHead>Parent</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Check-In</TableHead>
                                <TableHead>Check-Out</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Staff</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-semibold">{record.child_name}</p>
                                            <p className="text-xs text-slate-500">
                                                Age {record.child_age} • {record.child_grade}
                                            </p>
                                            {record.child_allergies && (
                                                <Badge className="mt-1 bg-red-100 text-red-800 text-xs">
                                                    ⚠️ Allergies
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="text-sm">{record.parent_name}</p>
                                            <p className="text-xs text-slate-500">{record.parent_phone}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="text-sm font-medium">{record.location_room}</p>
                                            <p className="text-xs text-slate-500 capitalize">
                                                {record.ministry_area?.replace('_', ' ')}
                                            </p>
                                            {record.teacher_staff && (
                                                <p className="text-xs text-slate-500">👨‍🏫 {record.teacher_staff}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm">{record.event_title}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="text-sm">
                                                {format(new Date(record.check_in_time), 'MMM d, h:mm a')}
                                            </p>
                                            <p className="text-xs text-slate-500">{record.check_in_by_name}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {record.checked_out ? (
                                            <div>
                                                <p className="text-sm text-green-700">
                                                    {format(new Date(record.check_out_time), 'MMM d, h:mm a')}
                                                </p>
                                                <p className="text-xs text-slate-500">{record.check_out_by_name}</p>
                                            </div>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                Still Checked In
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm">
                                            {calculateDuration(record.check_in_time, record.check_out_time)}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs">
                                            <p>In: {record.check_in_by_name || record.check_in_by}</p>
                                            {record.checked_out && (
                                                <p className="text-green-600">Out: {record.check_out_by_name || record.check_out_by}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {filteredRecords.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <Baby className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No check-in records found</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}