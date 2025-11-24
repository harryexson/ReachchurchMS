
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function EventCalendar({ events = [], onEventSelect }) {
    const eventTypeColors = {
        sunday_service: "bg-blue-100 text-blue-800",
        sunday_school: "bg-yellow-100 text-yellow-800",
        kids_zone: "bg-pink-100 text-pink-800",
        bible_study: "bg-green-100 text-green-800",
        prayer_meeting: "bg-purple-100 text-purple-800",
        fellowship: "bg-orange-100 text-orange-800",
        outreach: "bg-red-100 text-red-800",
        special_event: "bg-pink-100 text-pink-800",
        conference: "bg-indigo-100 text-indigo-800",
        wedding: "bg-rose-100 text-rose-800",
        funeral: "bg-gray-100 text-gray-800",
        baptism: "bg-cyan-100 text-cyan-800"
    };

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Event Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {events.length > 0 ? (
                        events.map((event) => (
                            <div 
                                key={event.id} 
                                className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                onClick={() => onEventSelect && onEventSelect(event)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                                    <Badge className={eventTypeColors[event.event_type] || "bg-gray-100 text-gray-800"}>
                                        {event.event_type?.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{format(new Date(event.start_datetime), 'EEE, MMM d • h:mm a')}</span>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{event.location}</span>
                                        </div>
                                    )}
                                </div>
                                {event.description && (
                                    <p className="text-sm text-slate-600 mt-2">{event.description}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No events to display</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
