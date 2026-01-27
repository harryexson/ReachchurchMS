import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Clock, Users, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ServiceCalendar() {
    const navigate = useNavigate();
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

    const { data: servicePlans = [] } = useQuery({
        queryKey: ['servicePlans'],
        queryFn: () => base44.entities.ServicePlan.list('-service_date')
    });

    const { data: serviceItems = [] } = useQuery({
        queryKey: ['serviceItems'],
        queryFn: () => base44.entities.ServiceItem.list()
    });

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

    const getServicesForDate = (date) => {
        return servicePlans.filter(plan => {
            const planDate = new Date(plan.service_date);
            return isSameDay(planDate, date);
        });
    };

    const getItemsForService = (planId) => {
        return serviceItems.filter(item => item.service_plan_id === planId)
            .sort((a, b) => a.order_index - b.order_index);
    };

    const calculateTotalDuration = (items) => {
        return items.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Service Calendar</h1>
                        <p className="text-slate-600 mt-1">
                            {format(currentWeekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}>
                            Today
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {weekDays.map(day => {
                        const services = getServicesForDate(day);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div key={day.toISOString()} className="min-h-[400px]">
                                <div className={`mb-3 p-3 rounded-lg text-center ${isToday ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`}>
                                    <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                                    <div className="text-2xl font-bold">{format(day, 'd')}</div>
                                </div>

                                <div className="space-y-3">
                                    {services.map(service => {
                                        const items = getItemsForService(service.id);
                                        const totalDuration = calculateTotalDuration(items);

                                        return (
                                            <Card 
                                                key={service.id} 
                                                className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-600"
                                                onClick={() => navigate(createPageUrl('ServicePlanDetail') + `?id=${service.id}`)}
                                            >
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="text-xs text-slate-500 mb-1">
                                                        {service.service_type?.replace('_', ' ').toUpperCase()}
                                                    </div>
                                                    <CardTitle className="text-sm font-bold">
                                                        {service.title}
                                                    </CardTitle>
                                                    <div className="text-xs text-slate-600">
                                                        {format(new Date(service.service_date), 'h:mm a')}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-2 space-y-2">
                                                    <div className="space-y-1">
                                                        {items.slice(0, 5).map((item, idx) => (
                                                            <div key={item.id} className="flex justify-between items-start text-xs">
                                                                <span className="text-slate-700 truncate flex-1">
                                                                    {item.title}
                                                                </span>
                                                                <span className="text-slate-500 ml-2">
                                                                    {item.duration_minutes}min
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {items.length > 5 && (
                                                            <div className="text-xs text-slate-400">
                                                                +{items.length - 5} more items
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-2 border-t border-slate-200">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-500 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                Total {totalDuration}min
                                                            </span>
                                                            <Badge className={
                                                                service.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                                service.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-slate-100 text-slate-800'
                                                            }>
                                                                {service.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}