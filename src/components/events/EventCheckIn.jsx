import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Search, UserCheck, Users, HandHeart, Camera, CameraOff, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function EventCheckIn({ event }) {
    const [attendees, setAttendees] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [searchCode, setSearchCode] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [checkInMessage, setCheckInMessage] = useState({ text: "", type: "info" });
    const [activeTab, setActiveTab] = useState("attendees");
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [attendeeList, volunteerList] = await Promise.all([
            base44.entities.EventRegistration.filter({ event_id: event.id }, "-registration_date"),
            base44.entities.VolunteerRegistration.filter({ event_id: event.id }, "-registration_date")
        ]);
        setAttendees(attendeeList);
        setVolunteers(volunteerList);
        setIsLoading(false);
    }, [event.id]);

    useEffect(() => {
        loadData();
        return () => stopCamera();
    }, [loadData]);

    const showMessage = (text, type = "info") => {
        setCheckInMessage({ text, type });
        setTimeout(() => setCheckInMessage({ text: "", type: "info" }), 3000);
    };

    const handleCheckIn = async (registration, type) => {
        const now = new Date().toISOString();
        const payload = { checked_in: true, check_in_time: now };
        const name = type === "attendee" ? registration.registrant_name : registration.volunteer_name;

        if (type === "attendee") {
            await base44.entities.EventRegistration.update(registration.id, payload);
            setAttendees(prev => prev.map(r => r.id === registration.id ? { ...r, ...payload } : r));
        } else {
            await base44.entities.VolunteerRegistration.update(registration.id, payload);
            setVolunteers(prev => prev.map(r => r.id === registration.id ? { ...r, ...payload } : r));
        }
        showMessage(`✅ ${name} checked in successfully!`, "success");
    };

    const handleCodeSearch = (code) => {
        const query = (code || searchCode).trim().toLowerCase();
        if (!query) return;
        const list = activeTab === "attendees" ? attendees : volunteers;
        const registration = list.find(r =>
            (r.registration_code?.toLowerCase().includes(query)) ||
            (r.registrant_name?.toLowerCase().includes(query)) ||
            (r.volunteer_name?.toLowerCase().includes(query))
        );

        if (!registration) {
            showMessage("❌ Registration not found", "error");
        } else if (registration.checked_in) {
            showMessage("ℹ️ Already checked in", "info");
        } else {
            handleCheckIn(registration, activeTab === "attendees" ? "attendee" : "volunteer");
        }
        setSearchCode("");
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCameraActive(true);
            // Poll for QR codes using BarcodeDetector if available
            if ("BarcodeDetector" in window) {
                const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
                scanIntervalRef.current = setInterval(async () => {
                    if (videoRef.current && videoRef.current.readyState === 4) {
                        const barcodes = await detector.detect(videoRef.current).catch(() => []);
                        if (barcodes.length > 0) {
                            handleCodeSearch(barcodes[0].rawValue);
                        }
                    }
                }, 800);
            }
        } catch {
            showMessage("❌ Camera access denied or unavailable", "error");
        }
    };

    const stopCamera = () => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setIsCameraActive(false);
    };

    const exportCSV = () => {
        const list = activeTab === "attendees" ? attendees : volunteers;
        const headers = activeTab === "attendees"
            ? ["Name", "Email", "Phone", "Reg Code", "Status", "Check-in Time"]
            : ["Name", "Email", "Role", "Status", "Check-in Time"];

        const rows = list.map(r => activeTab === "attendees"
            ? [r.registrant_name, r.registrant_email, r.registrant_phone || "", r.registration_code || "",
               r.checked_in ? "Checked In" : "Registered",
               r.check_in_time ? format(new Date(r.check_in_time), "h:mm a") : ""]
            : [r.volunteer_name, r.volunteer_email, r.selected_role || "",
               r.checked_in ? "Checked In" : "Registered",
               r.check_in_time ? format(new Date(r.check_in_time), "h:mm a") : ""]
        );

        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${event.title.replace(/\s+/g, "_")}_${activeTab}_checkin.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const checkedInAttendees = attendees.filter(r => r.checked_in).length;
    const checkedInVolunteers = volunteers.filter(r => r.checked_in).length;
    const msgColors = { success: "bg-green-50 border-green-200 text-green-800", error: "bg-red-50 border-red-200 text-red-800", info: "bg-blue-50 border-blue-200 text-blue-800" };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Registered</p><p className="text-2xl font-bold">{attendees.length}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Attendees In</p><p className="text-2xl font-bold text-green-600">{checkedInAttendees}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Volunteers</p><p className="text-2xl font-bold">{volunteers.length}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Volunteers In</p><p className="text-2xl font-bold text-green-600">{checkedInVolunteers}</p></CardContent></Card>
            </div>

            {/* Check-in Controls */}
            <Card className="shadow-lg border-0 bg-white/80">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <QrCode className="w-5 h-5" />
                        Quick Check-In
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        <Input
                            placeholder="Search by name or registration code..."
                            value={searchCode}
                            onChange={e => setSearchCode(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCodeSearch()}
                            className="flex-1"
                            autoFocus
                        />
                        <Button onClick={() => handleCodeSearch()} disabled={!searchCode.trim()}>
                            <Search className="w-4 h-4 mr-2" />
                            Check In
                        </Button>
                        <Button
                            variant="outline"
                            onClick={isCameraActive ? stopCamera : startCamera}
                            className={isCameraActive ? "text-red-600 border-red-300" : "text-blue-600 border-blue-300"}
                        >
                            {isCameraActive ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                            {isCameraActive ? "Stop" : "Scan QR"}
                        </Button>
                    </div>

                    {isCameraActive && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black" style={{ maxWidth: 400 }}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-48 border-4 border-blue-400 rounded-lg opacity-70" />
                            </div>
                            <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs bg-black/40 py-1">
                                Point camera at QR code
                            </p>
                        </div>
                    )}

                    {checkInMessage.text && (
                        <div className={`p-3 border rounded-lg ${msgColors[checkInMessage.type]}`}>
                            <p className="font-medium">{checkInMessage.text}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attendee / Volunteer Lists */}
            <Card className="shadow-lg border-0 bg-white/80">
                <CardHeader className="pb-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="attendees"><Users className="w-4 h-4 mr-2" />Attendees ({attendees.length})</TabsTrigger>
                                <TabsTrigger value="volunteers"><HandHeart className="w-4 h-4 mr-2" />Volunteers ({volunteers.length})</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <TabsContent value="attendees">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Reg Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Check-in Time</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendees.map(reg => (
                                        <TableRow key={reg.id}>
                                            <TableCell className="font-medium">{reg.registrant_name}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{reg.registrant_email}</TableCell>
                                            <TableCell><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{reg.registration_code}</code></TableCell>
                                            <TableCell>
                                                <Badge className={reg.checked_in ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                                                    {reg.checked_in ? "Checked In" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{reg.check_in_time ? format(new Date(reg.check_in_time), "h:mm a") : "—"}</TableCell>
                                            <TableCell className="text-right">
                                                {!reg.checked_in && (
                                                    <Button variant="outline" size="sm" onClick={() => handleCheckIn(reg, "attendee")}>
                                                        <UserCheck className="w-4 h-4 mr-1" />
                                                        Check In
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {attendees.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No registrations yet</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                    <TabsContent value="volunteers">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Check-in Time</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {volunteers.map(reg => (
                                        <TableRow key={reg.id}>
                                            <TableCell className="font-medium">{reg.volunteer_name}</TableCell>
                                            <TableCell className="text-sm">{reg.selected_role}</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{reg.volunteer_email}</TableCell>
                                            <TableCell>
                                                <Badge className={reg.checked_in ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                                                    {reg.checked_in ? "Checked In" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{reg.check_in_time ? format(new Date(reg.check_in_time), "h:mm a") : "—"}</TableCell>
                                            <TableCell className="text-right">
                                                {!reg.checked_in && (
                                                    <Button variant="outline" size="sm" onClick={() => handleCheckIn(reg, "volunteer")}>
                                                        <UserCheck className="w-4 h-4 mr-1" />
                                                        Check In
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {volunteers.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No volunteer sign-ups yet</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </CardContent>
            </Card>
        </div>
    );
}