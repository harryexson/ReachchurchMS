import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Music, Users, Clock, Filter, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";
import ServicePlanCard from "@/components/servicePlanning/ServicePlanCard";
import CreateServiceModal from "@/components/servicePlanning/CreateServiceModal";

export default function ServicePlanning() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("upcoming"); // upcoming, past, all

  const { data: servicePlans = [], isLoading, refetch } = useQuery({
    queryKey: ['servicePlans', viewMode],
    queryFn: async () => {
      const plans = await base44.entities.ServicePlan.list('-service_date');
      const now = new Date();
      
      if (viewMode === 'upcoming') {
        return plans.filter(p => new Date(p.service_date) >= now);
      } else if (viewMode === 'past') {
        return plans.filter(p => new Date(p.service_date) < now);
      }
      return plans;
    },
  });

  const filteredPlans = servicePlans.filter(plan => {
    if (filterType === 'all') return true;
    return plan.service_type === filterType;
  });

  const upcomingCount = servicePlans.filter(p => new Date(p.service_date) >= new Date()).length;
  const draftCount = servicePlans.filter(p => p.status === 'draft').length;

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Service Planning</h1>
            <p className="text-slate-600">Plan worship services, assign teams, and coordinate service flow</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Create Service Plan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Upcoming Services</p>
                  <p className="text-2xl font-bold text-slate-900">{upcomingCount}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Draft Plans</p>
                  <p className="text-2xl font-bold text-slate-900">{draftCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Link to={createPageUrl("ServiceTemplates")}>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Templates</p>
                    <p className="text-lg font-semibold text-blue-600 group-hover:text-blue-700">Manage →</p>
                  </div>
                  <Music className="w-8 h-8 text-purple-500" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Link to={createPageUrl("TeamScheduling")}>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Team Scheduling</p>
                    <p className="text-lg font-semibold text-blue-600 group-hover:text-blue-700">View →</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setViewMode('upcoming')}
              size="sm"
            >
              Upcoming
            </Button>
            <Button
              variant={viewMode === 'past' ? 'default' : 'outline'}
              onClick={() => setViewMode('past')}
              size="sm"
            >
              Past
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
              size="sm"
            >
              All
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-300"></div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="sunday_morning">Sunday Morning</option>
            <option value="sunday_evening">Sunday Evening</option>
            <option value="midweek">Midweek</option>
            <option value="special_event">Special Event</option>
            <option value="holiday">Holiday</option>
          </select>
        </div>

        {/* Service Plans List */}
        <div className="space-y-4">
          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No service plans yet</h3>
                <p className="text-slate-600 mb-4">Create your first service plan to get started</p>
                <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Service Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPlans.map(plan => (
              <ServicePlanCard key={plan.id} plan={plan} onUpdate={refetch} />
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateServiceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}