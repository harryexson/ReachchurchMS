import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, Heart, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function PublicEventsCalendar() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [rsvpData, setRsvpData] = useState({
        name: '',
        email: '',
        phone: '',
        attendees: 1
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rsvpSuccess, setRsvpSuccess] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const allEvents = await base44.entities.Event.filter({ public_event: true });
            const sorted = allEvents.sort((a, b) => 
                new Date(a.start_datetime) - new Date(b.start_datetime)
            );
            setEvents(sorted);
        } catch (error) {
            console.error("Failed to load events:", error);
        }
        setIsLoading(false);
    };

    const handleRSVP = async (e) => {
        e.preventDefault();
        if (!selectedEvent) return;

        setIsSubmitting(true);
        try {
            await base44.entities.EventRegistration.create({
                event_id: selectedEvent.id,
                event_title: selectedEvent.title,
                registrant_name: rsvpData.name,
                registrant_email: rsvpData.email,
                registrant_phone: rsvpData.phone,
                registration_date: new Date().toISOString().split('T')[0],
                special_requirements: `${rsvpData.attendees} attendee(s)`
            });

            setRsvpSuccess(true);
            setTimeout(() => {
                setSelectedEvent(null);
                setRsvpSuccess(false);
                setRsvpData({ name: '', email: '', phone: '', attendees: 1 });
            }, 3000);
        } catch (error) {
            console.error("RSVP failed:", error);
            alert("Failed to register. Please try again.");
        }
        setIsSubmitting(false);
    };

    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.start_datetime);
        const now = new Date();
        
        if (filter === 'upcoming') {
            return eventDate >= now;
        } else if (filter === 'past') {
            return eventDate < now;
        }
        return true;
    });

    const eventTypeColors = {
        sunday_service: 'bg-blue-100 text-blue-800',
        bible_study: 'bg-purple-100 text-purple-800',
        fellowship: 'bg-green-100 text-green-800',
        special_event: 'bg-orange-100 text-orange-800',
        conference: 'bg-red-100 text-red-800',
        outreach: 'bg-pink-100 text-pink-800'
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-12 px-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">
                        Upcoming Events
                    </h1>
                    <p className="text-lg text-slate-600">
                        Join us for worship, fellowship, and community
                    </p>
                </div>

                <div className="flex justify-center gap-3">
                    <Button
                        variant={filter === 'upcoming' ? 'default' : 'outline'}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming Events
                    </Button>
                    <Button
                        variant={filter === 'past' ? 'default' : 'outline'}
                        onClick={() => setFilter('past')}
                    >
                        Past Events
                    </Button>
                </div>

                {filteredEvents.length === 0 ? (
                    <Card className="shadow-lg">
                        <CardContent className="p-12 text-center">
                            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-600">No events to display</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map(event => (
                            <Card key={event.id} className="shadow-lg hover:shadow-xl transition-all">
                                <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50">
                                    <Badge className={eventTypeColors[event.event_type] || 'bg-slate-100 text-slate-800'}>
                                        {event.event_type.replace(/_/g, ' ')}
                                    </Badge>
                                    <CardTitle className="mt-2">{event.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <p className="text-slate-600 text-sm line-clamp-3">{event.description}</p>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>{format(new Date(event.start_datetime), 'MMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{format(new Date(event.start_datetime), 'h:mm a')}</span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <MapPin className="w-4 h-4" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    {event.registration_required && (
                                        <Button
                                            onClick={() => setSelectedEvent(event)}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            RSVP Now
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {selectedEvent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                        <Card className="max-w-lg w-full shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <CardTitle>RSVP - {selectedEvent.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {rsvpSuccess ? (
                                    <div className="text-center py-8">
                                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                                            You're Registered!
                                        </h3>
                                        <p className="text-slate-600">
                                            We'll send you a confirmation email shortly.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRSVP} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Name *</label>
                                            <input
                                                type="text"
                                                value={rsvpData.name}
                                                onChange={(e) => setRsvpData({...rsvpData, name: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Email *</label>
                                            <input
                                                type="email"
                                                value={rsvpData.email}
                                                onChange={(e) => setRsvpData({...rsvpData, email: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={rsvpData.phone}
                                                onChange={(e) => setRsvpData({...rsvpData, phone: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Number of Attendees</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={rsvpData.attendees}
                                                onChange={(e) => setRsvpData({...rsvpData, attendees: parseInt(e.target.value)})}
                                                className="w-full px-3 py-2 border rounded-md"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm RSVP'}
                                            </Button>
                                            <Button type="button" onClick={() => setSelectedEvent(null)} variant="outline">
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}