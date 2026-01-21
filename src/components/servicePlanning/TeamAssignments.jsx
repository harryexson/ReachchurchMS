import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, CheckCircle, XCircle, Mail, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import AddTeamMemberModal from "./AddTeamMemberModal";

export default function TeamAssignments({ servicePlanId, servicePlan, teamPositions }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (positionId) => base44.entities.TeamPosition.delete(positionId),
    onSuccess: () => {
      toast.success("Team member removed");
      queryClient.invalidateQueries(['teamPositions', servicePlanId]);
    }
  });

  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const recipients = teamPositions.filter(p => p.assigned_email).map(p => p.assigned_email);
      
      for (const email of recipients) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Reminder: ${servicePlan.title}`,
          body: `
            <h2>Service Reminder</h2>
            <p>This is a reminder about your upcoming service assignment:</p>
            <p><strong>${servicePlan.title}</strong></p>
            <p>Date: ${new Date(servicePlan.service_date).toLocaleDateString()}</p>
            <p>Time: ${new Date(servicePlan.service_date).toLocaleTimeString()}</p>
            ${servicePlan.rehearsal_date ? `<p>Rehearsal: ${new Date(servicePlan.rehearsal_date).toLocaleString()}</p>` : ''}
          `
        });
      }

      await base44.entities.ServicePlan.update(servicePlanId, {
        reminders_sent: true
      });

      toast.success(`Reminders sent to ${recipients.length} team members`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['servicePlan', servicePlanId]);
    }
  });

  const positionLabels = {
    worship_leader: "Worship Leader",
    vocals: "Vocals",
    guitar: "Guitar",
    bass: "Bass",
    drums: "Drums",
    keyboard: "Keyboard/Piano",
    sound_tech: "Sound Tech",
    video_tech: "Video Tech",
    lights: "Lighting",
    greeter: "Greeter",
    usher: "Usher",
    communion_server: "Communion Server",
    prayer_team: "Prayer Team",
    kids_ministry: "Kids Ministry",
    parking_team: "Parking Team"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Team Assignments</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => sendRemindersMutation.mutate()}
            disabled={sendRemindersMutation.isLoading || teamPositions.length === 0}
            variant="outline"
          >
            <Send className="w-5 h-5 mr-2" />
            Send Reminders
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Add Team Member
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {teamPositions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">No team members assigned yet</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Add First Team Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {teamPositions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {position.confirmed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">
                          {positionLabels[position.position_name] || position.position_name}
                        </h4>
                        {position.confirmed && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            Confirmed
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {position.assigned_member ? (
                          <>
                            <span className="font-medium">{position.assigned_member}</span>
                            {position.assigned_email && (
                              <span className="ml-2">• {position.assigned_email}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">Not assigned</span>
                        )}
                      </div>
                      {position.notes && (
                        <p className="text-sm text-slate-500 mt-1">{position.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteMutation.mutate(position.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <AddTeamMemberModal
          servicePlanId={servicePlanId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries(['teamPositions', servicePlanId]);
          }}
        />
      )}
    </div>
  );
}