import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";

export default function ResourceCalendar({ resources, bookings }) {
  const [currentDate, setCurrentDate] = useState(moment());

  const startOfWeek = currentDate.clone().startOf('week');
  const endOfWeek = currentDate.clone().endOf('week');
  const days = [];
  let day = startOfWeek.clone();

  while (day.isSameOrBefore(endOfWeek)) {
    days.push(day.clone());
    day.add(1, 'day');
  }

  const getBookingsForDay = (resource, date) => {
    return bookings.filter(b => {
      if (b.resource_id !== resource.id || b.status === 'cancelled') return false;
      const bookingDate = moment(b.start_datetime);
      return bookingDate.isSame(date, 'day');
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Week of {startOfWeek.format('MMM D')} - {endOfWeek.format('MMM D, YYYY')}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'week'))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(moment())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(currentDate.clone().add(1, 'week'))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-slate-50 text-left font-medium text-slate-700 w-48">
                  Resource
                </th>
                {days.map(day => (
                  <th key={day.format('YYYY-MM-DD')} className="border p-2 bg-slate-50 text-center font-medium text-slate-700">
                    <div>{day.format('ddd')}</div>
                    <div className="text-lg">{day.format('D')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map(resource => (
                <tr key={resource.id}>
                  <td className="border p-2 font-medium text-slate-900">
                    <div>{resource.name}</div>
                    <div className="text-xs text-slate-500">{resource.category}</div>
                  </td>
                  {days.map(day => {
                    const dayBookings = getBookingsForDay(resource, day);
                    return (
                      <td key={day.format('YYYY-MM-DD')} className="border p-1 align-top">
                        <div className="space-y-1">
                          {dayBookings.map(booking => (
                            <div
                              key={booking.id}
                              className="bg-blue-100 border border-blue-300 rounded p-1 text-xs"
                            >
                              <div className="font-medium text-blue-900">
                                {moment(booking.start_datetime).format('h:mm A')}
                              </div>
                              <div className="text-blue-700 truncate">
                                {booking.purpose}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}