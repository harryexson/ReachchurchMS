import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

const eventTypeColors = {
  sunday_service: "bg-blue-100 text-blue-800",
  bible_study: "bg-green-100 text-green-800",
  prayer_meeting: "bg-purple-100 text-purple-800",
  fellowship: "bg-orange-100 text-orange-800",
  outreach: "bg-pink-100 text-pink-800",
  special_event: "bg-red-100 text-red-800",
  conference: "bg-indigo-100 text-indigo-800",
  wedding: "bg-rose-100 text-rose-800",
  funeral: "bg-gray-100 text-gray-800",
  baptism: "bg-cyan-100 text-cyan-800"
};

export default function UpcomingEvents({ events, isLoading }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Calendar className="w-5 h-5 text-blue-600" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : events.length > 0 ? (
          events.map((event, index) => (
            <div key={event.id || index} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors duration-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-900">{event.title}</h3>
                <Badge className={eventTypeColors[event.event_type] || eventTypeColors.special_event}>
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
                {event.expected_attendance && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Expected: {event.expected_attendance} attendees</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No upcoming events</p>
            <p className="text-sm">Events will appear here once scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}