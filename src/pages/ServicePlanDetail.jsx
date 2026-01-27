import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Save, Send, Users, Music, Clock, Edit, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import moment from "moment";
import ServiceFlowBuilder from "@/components/servicePlanning/ServiceFlowBuilder";
import TeamAssignments from "@/components/servicePlanning/TeamAssignments";
import ServiceDetailsForm from "@/components/servicePlanning/ServiceDetailsForm";

export default function ServicePlanDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const servicePlanId = urlParams.get('id');
  const [activeTab, setActiveTab] = useState("flow");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: () => base44.entities.ServicePlanNotificationTemplate.list()
  });

  const { data: servicePlan, isLoading } = useQuery({
    queryKey: ['servicePlan', servicePlanId],
    queryFn: () => base44.entities.ServicePlan.filter({ id: servicePlanId }).then(r => r[0]),
    enabled: !!servicePlanId
  });

  const { data: serviceItems = [] } = useQuery({
    queryKey: ['serviceItems', servicePlanId],
    queryFn: () => base44.entities.ServiceItem.filter({ service_plan_id: servicePlanId }),
    enabled: !!servicePlanId
  });

  const { data: teamPositions = [] } = useQuery({
    queryKey: ['teamPositions', servicePlanId],
    queryFn: () => base44.entities.TeamPosition.filter({ service_plan_id: servicePlanId }),
    enabled: !!servicePlanId
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ServicePlan.update(servicePlanId, {
        published: true,
        published_date: new Date().toISOString(),
        status: 'ready'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['servicePlan', servicePlanId]);
      toast.success("Service plan published! Team will be notified automatically.");
    }
  });

  const sendPlanMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendServicePlan', {
        service_plan_id: servicePlanId,
        template_id: selectedTemplateId
      });
      return response;
    },
    onSuccess: (data) => {
      toast.success(`Service plan sent to ${data.recipients_count} team members!`);
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!servicePlan) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">Service plan not found</p>
            <Link to={createPageUrl("ServicePlanning")}>
              <Button className="mt-4">Back to Service Planning</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDuration = serviceItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
  const confirmedCount = teamPositions.filter(p => p.confirmed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("ServicePlanning")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{servicePlan.title}</h1>
              <p className="text-slate-600">
                {moment(servicePlan.service_date).format('MMMM DD, YYYY • h:mm A')}
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Link to={createPageUrl("ServiceNotificationTemplates")}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </Link>
            {templates.length > 0 && (
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Default</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={() => sendPlanMutation.mutate()}
              disabled={sendPlanMutation.isLoading}
              variant="outline"
            >
              <Send className="w-5 h-5 mr-2" />
              {sendPlanMutation.isLoading ? "Sending..." : "Send Now"}
            </Button>
            {!servicePlan.published && (
              <Button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-5 h-5 mr-2" />
                {publishMutation.isLoading ? "Publishing..." : "Publish & Notify Team"}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Service Items</p>
                  <p className="text-2xl font-bold text-slate-900">{serviceItems.length}</p>
                </div>
                <Music className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Duration</p>
                  <p className="text-2xl font-bold text-slate-900">{totalDuration} min</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Team Members</p>
                  <p className="text-2xl font-bold text-slate-900">{teamPositions.length}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Confirmed</p>
                  <p className="text-2xl font-bold text-slate-900">{confirmedCount}/{teamPositions.length}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flow">Service Flow</TabsTrigger>
            <TabsTrigger value="team">Team Assignments</TabsTrigger>
            <TabsTrigger value="details">Details & Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="mt-6">
            <ServiceFlowBuilder
              servicePlanId={servicePlanId}
              serviceItems={serviceItems}
              totalDuration={servicePlan.total_duration_minutes}
            />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamAssignments
              servicePlanId={servicePlanId}
              servicePlan={servicePlan}
              teamPositions={teamPositions}
            />
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <ServiceDetailsForm servicePlan={servicePlan} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}