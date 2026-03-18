import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Baby, CheckCircle, QrCode, Smartphone, Mail, MessageSquare, Loader2, Calendar, ChevronDown, User } from "lucide-react";

export default function ParentKidsCheckInPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [memberProfile, setMemberProfile] = useState(null);
    const [childProfiles, setChildProfiles] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedChild, setSelectedChild] = useState(null);
    const [formData, setFormData] = useState({
        child_name: "",
        child_age: "",
        child_grade: "",
        child_allergies: "",
        parent_name: "",
        parent_phone: "",
        parent_email: "",
        ministry_area: "",
        location_room: "",
        notes: ""
    });
    const [deliveryChannels, setDeliveryChannels] = useState({ sms: true, email: false, in_app: true });
    const [checkInResult, setCheckInResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: select child, 2: select event, 3: confirm

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const [members, children, allEvents] = await Promise.all([
                base44.entities.Member.filter({ email: user.email }),
                base44.entities.ChildProfile.filter({ parent_email: user.email }),
                base44.entities.Event.list('-start_datetime', 50)
            ]);

            if (members.length > 0) {
                setMemberProfile(members[0]);
                setFormData(prev => ({
                    ...prev,
                    parent_name: members[0].first_name + ' ' + members[0].last_name,
                    parent_phone: members[0].phone || '',
                    parent_email: user.email
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    parent_name: user.full_name || '',
                    parent_email: user.email
                }));
            }

            setChildProfiles(children);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcoming = allEvents.filter(e => e.start_datetime && new Date(e.start_datetime) >= today);
            upcoming.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
            setEvents(upcoming);
            if (upcoming.length > 0) setSelectedEvent(upcoming[0]);
        } catch (error) {
            console.error("Error loading data:", error);
        }
        setIsLoading(false);
    };

    const selectChildProfile = (child) => {
        setSelectedChild(child);
        setFormData(prev => ({
            ...prev,
            child_name: child.child_name,
            child_age: child.child_age?.toString() || '',
            child_grade: child.child_grade || '',
            child_allergies: child.child_allergies || ''
        }));
    };

    const generateCheckInCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const handleCheckIn = async () => {
        if (!selectedEvent || !formData.child_name || !formData.parent_name || !formData.parent_phone) {
            alert("Please fill in all required fields");
            return;
        }
        setIsProcessing(true);
        try {
            const checkInCode = generateCheckInCode();
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${checkInCode}`;
            const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${checkInCode}&scale=3&height=10`;

            // Determine ministry area from grade
            const ministryMap = {
                'Infant': 'nursery', 'Toddler': 'nursery', 'Preschool': 'preschool',
                'Kindergarten': 'kids_zone', '1st Grade': 'kids_zone', '2nd Grade': 'kids_zone',
                '3rd Grade': 'elementary', '4th Grade': 'elementary', '5th Grade': 'elementary', '6th Grade': 'elementary'
            };
            const ministryArea = formData.ministry_area || ministryMap[formData.child_grade] || 'kids_zone';
            const room = formData.location_room || (formData.child_grade ? `${formData.child_grade} Room` : "Children's Church");

            const record = await base44.entities.KidsCheckIn.create({
                event_id: selectedEvent.id,
                event_title: selectedEvent.title,
                child_name: formData.child_name,
                child_age: parseInt(formData.child_age) || 0,
                child_grade: formData.child_grade,
                child_allergies: formData.child_allergies,
                parent_name: formData.parent_name,
                parent_phone: formData.parent_phone,
                parent_email: formData.parent_email,
                check_in_code: checkInCode,
                qr_code_url: qrCodeUrl,
                barcode_url: barcodeUrl,
                registration_date: new Date().toISOString(),
                check_in_time: new Date().toISOString(),
                check_in_by: currentUser.email,
                check_in_by_name: currentUser.full_name,
                ministry_area: ministryArea,
                location_room: room,
                notes: formData.notes,
                sms_sent: false,
                slips_printed: 0
            });

            // Send SMS
            if (deliveryChannels.sms && formData.parent_phone) {
                try {
                    await base44.functions.invoke('sendKidsCheckInSMS', {
                        phone: formData.parent_phone,
                        child_name: formData.child_name,
                        check_in_code: checkInCode,
                        event_title: selectedEvent.title,
                        qr_code_url: qrCodeUrl
                    });
                    await base44.entities.KidsCheckIn.update(record.id, { sms_sent: true });
                    record.sms_sent = true;
                } catch (e) {
                    console.error("SMS error:", e);
                }
            }

            // Send Email
            if (deliveryChannels.email && formData.parent_email) {
                try {
                    await base44.integrations.Core.SendEmail({
                        to: formData.parent_email,
                        from_name: "Children's Church",
                        subject: `Kids Check-In: ${formData.child_name} - Code: ${checkInCode}`,
                        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #7c3aed, #db2777); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0;">👶 Kids Check-In Confirmed!</h1>
                            </div>
                            <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                                <p style="font-size: 18px; font-weight: bold; color: #111;">✅ ${formData.child_name} is checked in!</p>
                                <p style="color: #6b7280;">Event: ${selectedEvent.title}</p>
                                <p style="color: #6b7280;">Room: ${room}</p>
                                <div style="text-align: center; background: #f3f4f6; padding: 24px; border-radius: 12px; margin: 20px 0;">
                                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Your Pick-Up Code</p>
                                    <p style="font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #7c3aed; margin: 0;">${checkInCode}</p>
                                    <img src="${qrCodeUrl}" alt="QR Code" style="width: 180px; height: 180px; margin-top: 16px;" />
                                    <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">Show this code or QR to staff at pickup</p>
                                </div>
                            </div>
                        </div>`
                    });
                } catch (e) {
                    console.error("Email error:", e);
                }
            }

            // In-app notification
            if (deliveryChannels.in_app) {
                try {
                    await base44.entities.Notification.create({
                        user_email: currentUser.email,
                        title: `${formData.child_name} is checked in! ✅`,
                        message: `Code: ${checkInCode} | Room: ${room} | Event: ${selectedEvent.title}`,
                        type: 'kids_checkin',
                        read: false,
                        created_at: new Date().toISOString()
                    });
                } catch (e) {
                    console.error("In-app notification error:", e);
                }
            }

            setCheckInResult({ ...record, check_in_code: checkInCode, qr_code_url: qrCodeUrl, location_room: room, event_title: selectedEvent.title });
        } catch (error) {
            alert("Check-in failed: " + error.message);
        }
        setIsProcessing(false);
    };

    const toggleChannel = (ch) => setDeliveryChannels(prev => ({ ...prev, [ch]: !prev[ch] }));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (checkInResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 flex items-center justify-center">
                <Card className="max-w-md w-full shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-xl">
                        <CardTitle className="text-center flex flex-col items-center gap-2">
                            <CheckCircle className="w-16 h-16" />
                            <span className="text-2xl">Check-In Complete!</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-center space-y-4">
                        <p className="text-xl font-bold text-slate-900">{checkInResult.child_name} is all set! 🎉</p>
                        <p className="text-slate-600">{checkInResult.event_title}</p>
                        <p className="text-slate-600">Room: <strong>{checkInResult.location_room}</strong></p>

                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                            <p className="text-sm text-slate-500 mb-2 font-medium">YOUR PICK-UP CODE</p>
                            <p className="text-5xl font-black tracking-widest text-purple-700">{checkInResult.check_in_code}</p>
                            <img src={checkInResult.qr_code_url} alt="QR Code" className="w-44 h-44 mx-auto mt-4 rounded-lg border-4 border-purple-200" />
                            <p className="text-xs text-slate-500 mt-2">Show this QR code or code to staff at pickup</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                            {checkInResult.sms_sent && (
                                <div className="bg-green-50 p-2 rounded-lg text-green-700 flex flex-col items-center gap-1">
                                    <Smartphone className="w-4 h-4" />
                                    <span>SMS Sent</span>
                                </div>
                            )}
                            <div className="bg-purple-50 p-2 rounded-lg text-purple-700 flex flex-col items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>In-App</span>
                            </div>
                        </div>

                        <Alert className="bg-yellow-50 border-yellow-200 text-left">
                            <AlertDescription>
                                <p className="font-semibold text-yellow-800">⚠️ Keep this code safe!</p>
                                <p className="text-sm text-yellow-700">This is your pick-up code. Staff will scan or verify it when you collect {checkInResult.child_name}.</p>
                            </AlertDescription>
                        </Alert>

                        <Button onClick={() => { setCheckInResult(null); setStep(1); setSelectedChild(null); }} className="w-full bg-purple-600 hover:bg-purple-700">
                            Check In Another Child
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 pb-24">
            <div className="max-w-lg mx-auto space-y-6">
                <div className="text-center pt-4">
                    <Baby className="w-14 h-14 mx-auto text-purple-600 mb-2" />
                    <h1 className="text-3xl font-bold text-slate-900">Kids Self Check-In</h1>
                    <p className="text-slate-500 mt-1">Children's Ministry</p>
                </div>

                {/* Step 1: Choose child */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="w-5 h-5 text-purple-600" />
                            {childProfiles.length > 0 ? "Select Your Child" : "Child Information"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {childProfiles.length > 0 && (
                            <div className="grid gap-3">
                                {childProfiles.map(child => (
                                    <button
                                        key={child.id}
                                        onClick={() => selectChildProfile(child)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selectedChild?.id === child.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {child.photo_url
                                                ? <img src={child.photo_url} alt={child.child_name} className="w-full h-full object-cover" />
                                                : <Baby className="w-6 h-6 text-purple-600" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{child.child_name}</p>
                                            <p className="text-sm text-slate-500">{child.child_grade || ''} {child.child_age ? `• Age ${child.child_age}` : ''}</p>
                                        </div>
                                        {selectedChild?.id === child.id && <CheckCircle className="w-5 h-5 text-purple-600 ml-auto" />}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setSelectedChild(null); setFormData(prev => ({ ...prev, child_name: '', child_age: '', child_grade: '', child_allergies: '' })); }}
                                    className="text-sm text-purple-600 underline text-center py-1"
                                >
                                    + Enter a different child manually
                                </button>
                            </div>
                        )}

                        {(!selectedChild || childProfiles.length === 0) && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Label>Child's Full Name *</Label>
                                        <Input value={formData.child_name} onChange={e => setFormData({ ...formData, child_name: e.target.value })} placeholder="Child's name" />
                                    </div>
                                    <div>
                                        <Label>Age</Label>
                                        <Input type="number" value={formData.child_age} onChange={e => setFormData({ ...formData, child_age: e.target.value })} placeholder="5" />
                                    </div>
                                    <div>
                                        <Label>Grade</Label>
                                        <Select value={formData.child_grade} onValueChange={v => setFormData({ ...formData, child_grade: v })}>
                                            <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                                            <SelectContent>
                                                {["Infant","Toddler","Preschool","Kindergarten","1st Grade","2nd Grade","3rd Grade","4th Grade","5th Grade","6th Grade"].map(g => (
                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Allergies / Medical Notes</Label>
                                        <Input value={formData.child_allergies} onChange={e => setFormData({ ...formData, child_allergies: e.target.value })} placeholder="None / list allergies" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Select event */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Select Service / Event
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {events.length === 0 ? (
                            <p className="text-slate-500 text-sm">No upcoming events found. Please check with church staff.</p>
                        ) : (
                            <Select value={selectedEvent?.id} onValueChange={id => setSelectedEvent(events.find(e => e.id === id))}>
                                <SelectTrigger className="h-12"><SelectValue placeholder="Choose event" /></SelectTrigger>
                                <SelectContent>
                                    {events.map(ev => {
                                        const d = new Date(ev.start_datetime);
                                        const isToday = d.toDateString() === new Date().toDateString();
                                        return (
                                            <SelectItem key={ev.id} value={ev.id}>
                                                <span className="font-semibold">{ev.title}</span>
                                                {isToday && <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">TODAY</span>}
                                                <span className="text-sm text-slate-500 ml-2">
                                                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        )}
                    </CardContent>
                </Card>

                {/* Parent contact confirmation */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Smartphone className="w-5 h-5 text-green-600" />
                            Your Contact Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label>Your Name *</Label>
                            <Input value={formData.parent_name} onChange={e => setFormData({ ...formData, parent_name: e.target.value })} placeholder="Parent/Guardian name" />
                        </div>
                        <div>
                            <Label>Phone Number * (for SMS code)</Label>
                            <Input type="tel" value={formData.parent_phone} onChange={e => setFormData({ ...formData, parent_phone: e.target.value })} placeholder="(555) 123-4567" />
                        </div>
                        <div>
                            <Label>Email (optional)</Label>
                            <Input type="email" value={formData.parent_email} onChange={e => setFormData({ ...formData, parent_email: e.target.value })} placeholder="email@example.com" />
                        </div>
                    </CardContent>
                </Card>

                {/* Notification channels */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Receive Confirmation Via</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { key: 'sms', icon: Smartphone, label: 'SMS Text', activeClass: 'border-green-500 bg-green-50 text-green-700' },
                                { key: 'email', icon: Mail, label: 'Email', activeClass: 'border-blue-500 bg-blue-50 text-blue-700' },
                                { key: 'in_app', icon: MessageSquare, label: 'In-App', activeClass: 'border-purple-500 bg-purple-50 text-purple-700' }
                            ].map(({ key, icon: Icon, label, activeClass }) => (
                                <button
                                    key={key}
                                    onClick={() => toggleChannel(key)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${deliveryChannels[key] ? activeClass : 'border-slate-200 text-slate-400'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Button
                    onClick={handleCheckIn}
                    disabled={isProcessing || !formData.child_name || !formData.parent_name || !formData.parent_phone || !selectedEvent}
                    className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                >
                    {isProcessing ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                    ) : (
                        <><QrCode className="w-5 h-5 mr-2" /> Complete Self Check-In</>
                    )}
                </Button>
            </div>
        </div>
    );
}