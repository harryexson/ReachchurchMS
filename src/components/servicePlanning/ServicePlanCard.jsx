import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Music, User, ChevronRight, Send, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function ServicePlanCard({ plan, onUpdate }) {
  const statusColors = {
    draft: "bg-slate-100 text-slate-700",
    planning: "bg-yellow-100 text-yellow-700",
    ready: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700"
  };

  const typeLabels = {
    sunday_morning: "Sunday Morning",
    sunday_evening: "Sunday Evening",
    midweek: "Midweek Service",
    special_event: "Special Event",
    holiday: "Holiday Service"
  };

  const daysUntil = moment(plan.service_date).diff(moment(), 'days');
  const isPast = daysUntil < 0;
  const isToday = daysUntil === 0;
  const isUpcoming = daysUntil > 0 && daysUntil <= 7;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-slate-900">{plan.title}</h3>
              <Badge className={statusColors[plan.status]}>
                {plan.status}
              </Badge>
              {plan.published && (
                <Badge className="bg-blue-100 text-blue-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Published
                </Badge>
              )}
              {isToday && (
                <Badge className="bg-red-100 text-red-700">Today</Badge>
              )}
              {isUpcoming && !isPast && (
                <Badge className="bg-orange-100 text-orange-700">Upcoming</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>{moment(plan.service_date).format('MMM DD, YYYY')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{moment(plan.service_date).format('h:mm A')}</span>
              </div>
              {plan.worship_leader && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Music className="w-4 h-4" />
                  <span>{plan.worship_leader}</span>
                </div>
              )}
              {plan.preacher && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4" />
                  <span>{plan.preacher}</span>
                </div>
              )}
            </div>

            {plan.theme && (
              <p className="text-sm text-slate-600 mb-2">
                <span className="font-medium">Theme:</span> {plan.theme}
              </p>
            )}

            {plan.rehearsal_date && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-purple-50 px-3 py-2 rounded-lg inline-flex">
                <Music className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Rehearsal:</span>
                <span>{moment(plan.rehearsal_date).format('MMM DD, h:mm A')}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link to={createPageUrl("ServicePlanDetail") + `?id=${plan.id}`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                View Details
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}