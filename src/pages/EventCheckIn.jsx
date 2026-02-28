import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Camera, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function EventCheckInPage() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const eventId = searchParams.get('eventId');
    const mode = searchParams.get('mode'); // 'walk-in' or undefined
    
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [registrantName, setRegistrantName] = useState('');
    const [registrantEmail, setRegistrantEmail] = useState('');
    const [registrantPhone, setRegistrantPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = React.useRef(null);

    useEffect(() => {
        loadEventData();
    }, [eventId]);

    const loadEventData = async () => {
        if (!eventId) return;
        setIsLoading(true);
        try {
            const events = await base44.entities.Event.filter({ id: eventId });
            if (events.length > 0) {
                setEvent(events[0]);
            }
        } catch (error) {
            console.error("Failed to load event:", error);
        }
        setIsLoading(false);
    };

    const handleQuickCheckIn = async (e) => {
        e.preventDefault();
        
        if (!registrantName || !registrantEmail) {
            alert('Please enter name and email');
            return;
        }

        setIsSubmitting(true);
        try {
            // Generate unique registration code
            const regCode = `${event.id}-${Date.now()}`;
            
            // Create event registration for walk-in attendee
            await base44.entities.EventRegistration.create({
                event_id: event.id,
                event_title: event.title,
                church_admin_email: event.church_admin_email || event.created_by || "",
                registrant_name: registrantName,
                registrant_email: registrantEmail,
                registrant_phone: registrantPhone || "",
                registration_code: regCode,
                registration_date: new Date().toISOString().split('T')[0],
                checked_in: true,
                check_in_time: new Date().toISOString()
            });

            setSuccessMessage(`${registrantName} checked in successfully!`);
            setShowSuccess(true);
            
            // Reset form
            setRegistrantName('');
            setRegistrantEmail('');
            setRegistrantPhone('');
            
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Check-in failed:", error);
            alert("Check-in failed. Please try again.");
        }
        setIsSubmitting(false);
    };

    const activateCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (error) {
            console.error('Camera access failed:', error);
            alert('Could not access camera. Please enter details manually.');
        }
    };

    const deactivateCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            setCameraActive(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p>Loading event...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-slate-900 mb-4">Event Not Found</h1>
                        <p className="text-slate-600">The event could not be found. Please check the link and try again.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-2xl mx-auto">
                <Card className="shadow-2xl border-0">
                    <CardHeader>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl text-blue-600">Check-In: {event.title}</CardTitle>
                            <p className="text-slate-600">
                                {format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy • h:mm a')}
                            </p>
                            {mode === 'walk-in' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 flex gap-2">
                                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <p className="text-sm text-blue-900">Walk-in check-in mode - registering attendees without pre-registration</p>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {/* Camera Option */}
                        {!cameraActive && (
                            <Button
                                onClick={activateCamera}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Use Camera for Quick Check-In
                            </Button>
                        )}

                        {cameraActive && (
                            <div className="space-y-2">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full rounded-lg"
                                />
                                <Button
                                    onClick={deactivateCamera}
                                    variant="outline"
                                    className="w-full text-red-600"
                                >
                                    Close Camera
                                </Button>
                            </div>
                        )}

                        {/* Manual Entry Form */}
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Or Enter Details Manually</h3>
                            <form onSubmit={handleQuickCheckIn} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Full Name *</label>
                                    <Input
                                        value={registrantName}
                                        onChange={(e) => setRegistrantName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">Email *</label>
                                    <Input
                                        type="email"
                                        value={registrantEmail}
                                        onChange={(e) => setRegistrantEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700">Phone (Optional)</label>
                                    <Input
                                        type="tel"
                                        value={registrantPhone}
                                        onChange={(e) => setRegistrantPhone(e.target.value)}
                                        placeholder="(555) 123-4567"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    size="lg"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Check className="w-5 h-5 mr-2" />
                                    )}
                                    Check In Attendee
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Success Dialog */}
            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                            <DialogTitle className="text-2xl">Success!</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div className="text-center">
                        <p className="text-lg font-semibold text-slate-900 mb-4">{successMessage}</p>
                        <p className="text-slate-600">The attendee has been checked in successfully.</p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}