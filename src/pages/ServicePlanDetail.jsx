import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Send, Users, Music, Clock, Settings, Copy, Share2, Download, Printer, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import moment from "moment";
import ServiceFlowBuilder from "@/components/servicePlanning/ServiceFlowBuilder";
import EnhancedTeamAssignments from "@/components/servicePlanning/EnhancedTeamAssignments";
import ServiceDetailsForm from "@/components/servicePlanning/ServiceDetailsForm";
import ServicePlanShareModal from "@/components/servicePlanning/ServicePlanShareModal";
import { autoSendFinalServicePlan } from "@/functions/autoSendFinalServicePlan";

export default function ServicePlanDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const servicePlanId = urlParams.get('id');
  const [activeTab, setActiveTab] = useState("flow");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const { data: churchSettings = [] } = useQuery({
    queryKey: ['churchSettingsForPlan'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ChurchSettings.filter({ church_admin_email: user?.email });
    }
  });

  const churchName = churchSettings[0]?.church_name || 'Your Church';

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
      toast.success(`Service plan sent to team members!`);
    },
    onError: () => toast.error("Failed to send service plan")
  });

  const sendFinalProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await autoSendFinalServicePlan({ service_plan_id: servicePlanId });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['servicePlan', servicePlanId]);
      toast.success("Final program sent to all team members!");
    },
    onError: () => toast.error("Failed to send final program")
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      // Create duplicate plan
      const { id, created_date, updated_date, created_by, ...planData } = servicePlan;
      const newPlan = await base44.entities.ServicePlan.create({
        ...planData,
        title: `${servicePlan.title} (Copy)`,
        status: 'draft',
        published: false,
        published_date: null,
        reminders_sent: false,
        auto_notifications_sent: false,
        final_program_sent: false,
        final_program_sent_date: null,
        last_notification_date: null,
        duplicated_from: servicePlanId,
        church_admin_email: user.email
      });

      // Duplicate service items
      const sortedItems = [...serviceItems].sort((a, b) => a.order_index - b.order_index);
      for (const item of sortedItems) {
        const { id: _, created_date: __, updated_date: ___, created_by: ____, ...itemData } = item;
        await base44.entities.ServiceItem.create({ ...itemData, service_plan_id: newPlan.id });
      }

      // Duplicate team positions
      for (const pos of teamPositions) {
        const { id: _, created_date: __, updated_date: ___, created_by: ____, ...posData } = pos;
        await base44.entities.TeamPosition.create({
          ...posData,
          service_plan_id: newPlan.id,
          confirmed: false,
          response_status: 'pending',
          notification_sent: false,
          notification_sent_date: null,
          response_token: null,
          reassign_requested_to: null,
          reassign_reason: null,
          decline_reason: null
        });
      }

      return newPlan;
    },
    onSuccess: (newPlan) => {
      toast.success("Service plan duplicated successfully!");
      navigate(createPageUrl("ServicePlanDetail") + `?id=${newPlan.id}`);
    },
    onError: () => toast.error("Failed to duplicate plan")
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
  const confirmedCount = teamPositions.filter(p => p.response_status === 'accepted').length;
  const declinedCount = teamPositions.filter(p => p.response_status === 'declined').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("ServicePlanning")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-slate-900">{servicePlan.title}</h1>
                {servicePlan.published && (
                  <Badge className="bg-green-100 text-green-700">Published</Badge>
                )}
                {servicePlan.final_program_sent && (
                  <Badge className="bg-blue-100 text-blue-700">Final Sent ✓</Badge>
                )}
              </div>
              <p className="text-slate-600">
                {moment(servicePlan.service_date).format('MMMM DD, YYYY • h:mm A')}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateMutation.mutate()}
              disabled={duplicateMutation.isLoading}
            >
              <Copy className="w-4 h-4 mr-2" />
              {duplicateMutation.isLoading ? "Duplicating..." : "Duplicate"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share / Export
            </Button>

            <Link to={createPageUrl("ServiceNotificationTemplates")}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </Link>

            <Button
              onClick={() => sendFinalProgramMutation.mutate()}
              disabled={sendFinalProgramMutation.isLoading}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
              title="Send final program to all team members now"
            >
              <Bell className="w-4 h-4 mr-2" />
              {sendFinalProgramMutation.isLoading ? "Sending..." : "Send Final Program"}
            </Button>

            <Button
              onClick={() => sendPlanMutation.mutate()}
              disabled={sendPlanMutation.isLoading}
              variant="outline"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendPlanMutation.isLoading ? "Sending..." : "Send Now"}
            </Button>

            {!servicePlan.published && (
              <Button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isLoading}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                {publishMutation.isLoading ? "Publishing..." : "Publish & Notify"}
              </Button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {declinedCount > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-center gap-3">
            <span className="text-red-600 font-semibold">⚠️ {declinedCount} role(s) declined – please reassign in the Team tab.</span>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("team")} className="ml-auto">
              Go to Team →
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <TabsTrigger value="flow">Order of Service</TabsTrigger>
            <TabsTrigger value="team">
              Team Assignments
              {declinedCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{declinedCount}</span>}
            </TabsTrigger>
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
            <EnhancedTeamAssignments
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

      {showShareModal && (
        <ServicePlanShareModal
          plan={servicePlan}
          serviceItems={serviceItems}
          teamPositions={teamPositions}
          churchName={churchName}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}