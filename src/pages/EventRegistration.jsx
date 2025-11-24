import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Event } from "@/entities/Event";
import { EventRegistration } from "@/entities/EventRegistration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format, isAfter } from "date-fns";
import EventRegistrationForm from "../components/events/EventRegistrationForm";

export default function EventRegistrationPage() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const eventId = searchParams.get('eventId');
    
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const loadEventData = useCallback(async () => {
        if (!eventId) return;
        
        setIsLoading(true);
        try {
            const [eventsList, registrationsList] = await Promise.all([
                Event.list(),
                EventRegistration.filter({ event_id: eventId })
            ]);
            
            const foundEvent = eventsList.find(e => e.id === eventId);
            setEvent(foundEvent);
            setRegistrations(registrationsList);
        } catch (error) {
            console.error("Failed to load event data:", error);
        }
        setIsLoading(false);
    }, [eventId]);

    useEffect(() => {
        loadEventData();
    }, [loadEventData]);

    const handleRegistrationComplete = (registration) => {
        setRegistrations(prev => [...prev, registration]);
        setIsFormOpen(false);
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-4">Event Not Found</h1>
                        <p className="text-slate-600">The event you're looking for could not be found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isRegistrationClosed = event.registration_deadline && 
        isAfter(new Date(), new Date(event.registration_deadline));
    const isRegistrationFull = event.registration_limit && 
        registrations.length >= event.registration_limit;
    const canRegister = !isRegistrationClosed && !isRegistrationFull;

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-6">
                        <div className="text-center space-y-4">
                            <CardTitle className="text-3xl font-bold text-slate-900">
                                {event.title}
                            </CardTitle>
                            <p className="text-lg text-slate-600">{event.description}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-blue-900">Date & Time</p>
                                        <p className="text-blue-800">
                                            {format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy')}
                                        </p>
                                        <p className="text-blue-800">
                                            {format(new Date(event.start_datetime), 'h:mm a')}
                                            {event.end_datetime && ` - ${format(new Date(event.end_datetime), 'h:mm a')}`}
                                        </p>
                                    </div>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                        <MapPin className="w-6 h-6 text-green-600" />
                                        <div>
                                            <p className="font-semibold text-green-900">Location</p>
                                            <p className="text-green-800">{event.location}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                                    <Users className="w-6 h-6 text-purple-600" />
                                    <div>
                                        <p className="font-semibold text-purple-900">Registration</p>
                                        <p className="text-purple-800">
                                            {registrations.length} registered
                                            {event.registration_limit && ` of ${event.registration_limit} spots`}
                                        </p>
                                    </div>
                                </div>
                                {event.registration_deadline && (
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                                        <Clock className="w-6 h-6 text-amber-600" />
                                        <div>
                                            <p className="font-semibold text-amber-900">Registration Deadline</p>
                                            <p className="text-amber-800">
                                                {format(new Date(event.registration_deadline), 'MMMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Registration Fee */}
                        {event.registration_fee && (
                            <div className="text-center p-6 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-bold text-slate-900">
                                    Registration Fee: ${event.registration_fee}
                                </p>
                            </div>
                        )}

                        {/* Registration Status */}
                        <div className="text-center space-y-4">
                            {isRegistrationClosed && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="font-semibold text-red-800">Registration Closed</p>
                                    <p className="text-red-600">The registration deadline has passed.</p>
                                </div>
                            )}
                            {isRegistrationFull && !isRegistrationClosed && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="font-semibold text-amber-800">Registration Full</p>
                                    <p className="text-amber-600">This event has reached its capacity limit.</p>
                                </div>
                            )}
                            {canRegister && (
                                <Button
                                    onClick={() => setIsFormOpen(true)}
                                    size="lg"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
                                >
                                    Register Now
                                </Button>
                            )}
                        </div>

                        {/* Additional Information */}
                        {event.pastor_speaker && (
                            <div className="text-center p-4 bg-slate-50 rounded-lg">
                                <p className="text-slate-600">
                                    <strong>Speaker:</strong> {event.pastor_speaker}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Registration Form Modal */}
                <EventRegistrationForm
                    event={event}
                    isOpen={isFormOpen}
                    setIsOpen={setIsFormOpen}
                    onRegistrationComplete={handleRegistrationComplete}
                />
            </div>
        </div>
    );
}