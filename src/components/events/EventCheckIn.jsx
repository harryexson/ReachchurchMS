import React, { useState, useEffect, useCallback } from "react";
import { EventRegistration } from "@/entities/EventRegistration";
import { VolunteerRegistration } from "@/entities/VolunteerRegistration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Search, UserCheck, Users, Clock, HandHeart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function EventCheckIn({ event }) {
    const [attendees, setAttendees] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [searchCode, setSearchCode] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [checkInMessage, setCheckInMessage] = useState("");
    const [activeTab, setActiveTab] = useState("attendees");

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [attendeeList, volunteerList] = await Promise.all([
            EventRegistration.filter({ event_id: event.id }, "-registration_date"),
            VolunteerRegistration.filter({ event_id: event.id }, "-registration_date")
        ]);
        setAttendees(attendeeList);
        setVolunteers(volunteerList);
        setIsLoading(false);
    }, [event.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCheckIn = async (registration, type) => {
        try {
            const now = new Date().toISOString();
            const payload = { checked_in: true, check_in_time: now };
            const name = type === 'attendee' ? registration.registrant_name : registration.volunteer_name;

            if (type === 'attendee') {
                await EventRegistration.update(registration.id, payload);
                setAttendees(prev => prev.map(reg => reg.id === registration.id ? { ...reg, ...payload } : reg));
            } else {
                await VolunteerRegistration.update(registration.id, payload);
                setVolunteers(prev => prev.map(reg => reg.id === registration.id ? { ...reg, ...payload } : reg));
            }

            setCheckInMessage(`✅ ${name} checked in successfully!`);
            setTimeout(() => setCheckInMessage(""), 3000);
        } catch (error) {
            console.error("Check-in failed:", error);
            setCheckInMessage(`❌ Check-in failed`);
            setTimeout(() => setCheckInMessage(""), 3000);
        }
    };

    const handleCodeSearch = () => {
        const list = activeTab === 'attendees' ? attendees : volunteers;
        const registration = list.find(reg => 
            (reg.registration_code && reg.registration_code.toLowerCase().includes(searchCode.toLowerCase())) ||
            (reg.registrant_name && reg.registrant_name.toLowerCase().includes(searchCode.toLowerCase())) ||
            (reg.volunteer_name && reg.volunteer_name.toLowerCase().includes(searchCode.toLowerCase()))
        );
        
        if (registration && !registration.checked_in) {
            handleCheckIn(registration, activeTab === 'attendees' ? 'attendee' : 'volunteer');
            setSearchCode("");
        } else if (registration && registration.checked_in) {
            setCheckInMessage(`ℹ️ This person is already checked in`);
            setTimeout(() => setCheckInMessage(""), 3000);
        } else {
            setCheckInMessage("❌ Registration not found");
            setTimeout(() => setCheckInMessage(""), 3000);
        }
    };

    const checkedInAttendees = attendees.filter(reg => reg.checked_in).length;
    const checkedInVolunteers = volunteers.filter(reg => reg.checked_in).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-4"><p className="text-sm font-medium text-slate-600">Attendees</p><p className="text-xl font-bold">{attendees.length}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm font-medium text-slate-600">Attendees Checked In</p><p className="text-xl font-bold text-green-600">{checkedInAttendees}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm font-medium text-slate-600">Volunteers</p><p className="text-xl font-bold">{volunteers.length}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-sm font-medium text-slate-600">Volunteers Checked In</p><p className="text-xl font-bold text-green-600">{checkedInVolunteers}</p></CardContent></Card>
            </div>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        Quick Check-In
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        <Input
                            placeholder={`Search ${activeTab === 'attendees' ? 'attendee' : 'volunteer'} by name or code...`}
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCodeSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleCodeSearch} disabled={!searchCode.trim()}>
                            <Search className="w-4 h-4 mr-2" />
                            Check In
                        </Button>
                    </div>
                    {checkInMessage && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="font-medium text-blue-800">{checkInMessage}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="attendees">
                                <Users className="w-4 h-4 mr-2"/>
                                Attendees ({attendees.length})
                            </TabsTrigger>
                            <TabsTrigger value="volunteers">
                                <HandHeart className="w-4 h-4 mr-2"/>
                                Volunteers ({volunteers.length})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <TabsContent value="attendees">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Reg. Code</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Check-in Time</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendees.map(reg => (
                                        <TableRow key={reg.id}>
                                            <TableCell className="font-medium">{reg.registrant_name}</TableCell>
                                            <TableCell>{reg.registrant_email}</TableCell>
                                            <TableCell><code className="bg-slate-100 px-2 py-1 rounded text-sm">{reg.registration_code}</code></TableCell>
                                            <TableCell><Badge className={reg.checked_in ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>{reg.checked_in ? "Checked In" : "Pending"}</Badge></TableCell>
                                            <TableCell>{reg.check_in_time ? format(new Date(reg.check_in_time), 'h:mm a') : '-'}</TableCell>
                                            <TableCell className="text-right">{!reg.checked_in && <Button variant="outline" size="sm" onClick={() => handleCheckIn(reg, 'attendee')}>Check In</Button>}</TableCell>
                                        </TableRow>
                                    ))}
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
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {volunteers.map(reg => (
                                        <TableRow key={reg.id}>
                                            <TableCell className="font-medium">{reg.volunteer_name}</TableCell>
                                            <TableCell>{reg.selected_role}</TableCell>
                                            <TableCell>{reg.volunteer_email}</TableCell>
                                            <TableCell><Badge className={reg.checked_in ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>{reg.checked_in ? "Checked In" : "Pending"}</Badge></TableCell>
                                            <TableCell>{reg.check_in_time ? format(new Date(reg.check_in_time), 'h:mm a') : '-'}</TableCell>
                                            <TableCell className="text-right">{!reg.checked_in && <Button variant="outline" size="sm" onClick={() => handleCheckIn(reg, 'volunteer')}>Check In</Button>}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </CardContent>
            </Card>
        </div>
    );
}