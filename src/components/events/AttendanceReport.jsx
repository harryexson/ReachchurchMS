import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, Users, UserCheck, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";

export default function AttendanceReport({ events, registrations }) {
    const exportAttendanceCSV = (event, regs) => {
        const rows = [
            ["Name", "Email", "Phone", "Reg Code", "Status", "Check-in Time", "Special Requirements"]
        ];
        regs.forEach(r => {
            rows.push([
                r.registrant_name || "",
                r.registrant_email || "",
                r.registrant_phone || "",
                r.registration_code || "",
                r.checked_in ? "Checked In" : "Registered",
                r.check_in_time ? format(new Date(r.check_in_time), "MMM d, yyyy h:mm a") : "",
                r.special_requirements || ""
            ]);
        });
        const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${event.title.replace(/\s+/g, "_")}_attendance.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportAllEventsCSV = () => {
        const rows = [["Event", "Date", "Location", "Registered", "Checked In", "Attendance Rate"]];
        events.forEach(event => {
            const regs = registrations.filter(r => r.event_id === event.id);
            const checkedIn = regs.filter(r => r.checked_in).length;
            const rate = regs.length > 0 ? Math.round((checkedIn / regs.length) * 100) : 0;
            rows.push([
                event.title,
                event.start_datetime ? format(new Date(event.start_datetime), "MMM d, yyyy") : "",
                event.location || "",
                regs.length,
                checkedIn,
                `${rate}%`
            ]);
        });
        const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `all_events_attendance_report.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Build chart data for events with registrations
    const chartData = events
        .filter(e => registrations.some(r => r.event_id === e.id))
        .slice(-10)
        .map(event => {
            const regs = registrations.filter(r => r.event_id === event.id);
            const checkedIn = regs.filter(r => r.checked_in).length;
            return {
                name: event.title.length > 15 ? event.title.slice(0, 15) + "…" : event.title,
                Registered: regs.length,
                "Checked In": checkedIn,
            };
        });

    const totalRegistered = registrations.length;
    const totalCheckedIn = registrations.filter(r => r.checked_in).length;
    const overallRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Registered</p>
                                <p className="text-2xl font-bold text-slate-900">{totalRegistered}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Checked In</p>
                                <p className="text-2xl font-bold text-green-600">{totalCheckedIn}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Attendance Rate</p>
                                <p className="text-2xl font-bold text-purple-600">{overallRate}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Events with Regs</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {events.filter(e => registrations.some(r => r.event_id === e.id)).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Attendance by Event</CardTitle>
                            <Button variant="outline" size="sm" onClick={exportAllEventsCSV}>
                                <Download className="w-4 h-4 mr-2" />
                                Export All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="Registered" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Checked In" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Per-Event Breakdown */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Per-Event Attendance</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-center">Registered</TableHead>
                                    <TableHead className="text-center">Checked In</TableHead>
                                    <TableHead className="text-center">Rate</TableHead>
                                    <TableHead className="text-right">Export</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map(event => {
                                    const regs = registrations.filter(r => r.event_id === event.id);
                                    if (regs.length === 0) return null;
                                    const checkedIn = regs.filter(r => r.checked_in).length;
                                    const rate = Math.round((checkedIn / regs.length) * 100);
                                    return (
                                        <TableRow key={event.id}>
                                            <TableCell className="font-medium">{event.title}</TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {event.start_datetime ? format(new Date(event.start_datetime), "MMM d, yyyy") : "—"}
                                            </TableCell>
                                            <TableCell className="text-center">{regs.length}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-semibold text-green-600">{checkedIn}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={rate >= 75 ? "bg-green-100 text-green-800" : rate >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                                                    {rate}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => exportAttendanceCSV(event, regs)}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}