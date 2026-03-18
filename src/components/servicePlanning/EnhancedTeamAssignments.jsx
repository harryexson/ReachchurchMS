import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, CheckCircle, XCircle, Mail, Trash2, Send, RefreshCw, AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import AddTeamMemberModal from "./AddTeamMemberModal";
import { notifyServiceRoleAssignment } from "@/functions/notifyServiceRoleAssignment";

const positionLabels = {
  worship_leader: "Worship Leader", vocals: "Vocals", guitar: "Guitar",
  bass: "Bass", drums: "Drums", keyboard: "Keyboard/Piano",
  sound_tech: "Sound Tech", video_tech: "Video Tech", lights: "Lighting",
  greeter: "Greeter", usher: "Usher", communion_server: "Communion Server",
  prayer_team: "Prayer Team", kids_ministry: "Kids Ministry",
  parking_team: "Parking Team", announcer: "Announcer",
  offering_coordinator: "Offering Coordinator", visitor_welcome: "Visitor Welcome Host",
  praise_leader: "Praise Leader", scripture_reader: "Scripture Reader",
  testimony_speaker: "Testimony Speaker", intercessor: "Intercessor",
  media_operator: "Media Operator", hospitality: "Hospitality",
  security: "Security", emcee: "Emcee", choir_leader: "Choir Leader", other: "Other"
};

const statusConfig = {
  pending: { label: "Pending Response", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
  accepted: { label: "Accepted ✅", color: "bg-green-100 text-green-800", icon: "✅" },
  declined: { label: "Declined ❌", color: "bg-red-100 text-red-800", icon: "❌" },
  reassign_requested: { label: "Swap Requested 🔄", color: "bg-orange-100 text-orange-800", icon: "🔄" },
};

function ReassignModal({ position, posLabel, onClose, onSuccess, servicePlanId }) {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const queryClient = useQueryClient();

  const handleReassign = async () => {
    if (!newName) { toast.error("Please enter a name"); return; }
    await base44.entities.TeamPosition.update(position.id, {
      assigned_member: newName,
      assigned_email: newEmail,
      response_status: "pending",
      confirmed: false,
      notification_sent: false,
      decline_reason: "",
      reassign_requested_to: "",
      reassign_reason: "",
    });
    toast.success(`Role reassigned to ${newName}`);
    queryClient.invalidateQueries(['teamPositions', servicePlanId]);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">Reassign: {posLabel}</h3>
        <div className="space-y-3">
          <div>
            <Label>New Assignee Name *</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <Label>Email (for notification)</Label>
            <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleReassign} className="flex-1 bg-blue-600 hover:bg-blue-700">Reassign</Button>
        </div>
      </div>
    </div>
  );
}

export default function EnhancedTeamAssignments({ servicePlanId, servicePlan, teamPositions }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [reassignPosition, setReassignPosition] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (positionId) => base44.entities.TeamPosition.delete(positionId),
    onSuccess: () => {
      toast.success("Team member removed");
      queryClient.invalidateQueries(['teamPositions', servicePlanId]);
    }
  });

  const sendAllNotifications = async () => {
    const unnotified = teamPositions.filter(p => p.assigned_email && !p.notification_sent);
    if (!unnotified.length) { toast.info("All assigned members have been notified"); return; }
    
    let count = 0;
    for (const pos of unnotified) {
      setSendingId(pos.id);
      try {
        await notifyServiceRoleAssignment({ position_id: pos.id, action: 'send_notification' });
        count++;
      } catch (e) {
        toast.error(`Failed to notify ${pos.assigned_member}`);
      }
    }
    setSendingId(null);
    queryClient.invalidateQueries(['teamPositions', servicePlanId]);
    toast.success(`Notifications sent to ${count} team member(s)`);
  };

  const sendSingleNotification = async (position) => {
    setSendingId(position.id);
    try {
      await notifyServiceRoleAssignment({ position_id: position.id, action: 'send_notification' });
      queryClient.invalidateQueries(['teamPositions', servicePlanId]);
      toast.success(`Notification sent to ${position.assigned_member}`);
    } catch (e) {
      toast.error("Failed to send notification: " + e.message);
    }
    setSendingId(null);
  };

  const handleApproveReassign = async (position) => {
    await base44.entities.TeamPosition.update(position.id, {
      assigned_member: position.reassign_requested_to,
      assigned_email: position.reassign_requested_to_email,
      response_status: "pending",
      confirmed: false,
      notification_sent: false,
      reassign_approved: true,
    });
    queryClient.invalidateQueries(['teamPositions', servicePlanId]);
    toast.success("Reassignment approved! Don't forget to notify the new person.");
  };

  const pendingCount = teamPositions.filter(p => p.response_status === 'pending' && p.assigned_member).length;
  const acceptedCount = teamPositions.filter(p => p.response_status === 'accepted').length;
  const declinedCount = teamPositions.filter(p => p.response_status === 'declined').length;
  const reassignCount = teamPositions.filter(p => p.response_status === 'reassign_requested').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Team Assignments</h2>
        <div className="flex gap-3">
          <Button
            onClick={sendAllNotifications}
            disabled={!!sendingId}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Send className="w-4 h-4 mr-2" />
            Notify All Unnotified
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      {teamPositions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            <p className="text-xs text-yellow-600">Awaiting Response</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{acceptedCount}</p>
            <p className="text-xs text-green-600">Accepted</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{declinedCount}</p>
            <p className="text-xs text-red-600">Declined</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{reassignCount}</p>
            <p className="text-xs text-orange-600">Swap Requested</p>
          </div>
        </div>
      )}

      {/* Declined / Swap alerts */}
      {(declinedCount > 0 || reassignCount > 0) && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800">Action Required</span>
          </div>
          {declinedCount > 0 && <p className="text-sm text-amber-700">{declinedCount} role(s) declined – please reassign.</p>}
          {reassignCount > 0 && <p className="text-sm text-amber-700">{reassignCount} role swap(s) requested – please review below.</p>}
        </div>
      )}

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
              {teamPositions.map((position) => {
                const posLabel = position.custom_position_name || positionLabels[position.position_name] || position.position_name;
                const status = statusConfig[position.response_status] || statusConfig.pending;
                const isSwapRequested = position.response_status === 'reassign_requested';
                const isDeclined = position.response_status === 'declined';

                return (
                  <div
                    key={position.id}
                    className={`p-4 bg-white border-2 rounded-xl transition-all ${
                      isDeclined ? 'border-red-300 bg-red-50' :
                      isSwapRequested ? 'border-orange-300 bg-orange-50' :
                      'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-slate-900">{posLabel}</h4>
                          {position.section && (
                            <Badge variant="outline" className="text-xs">{position.section}</Badge>
                          )}
                          <Badge className={status.color + " text-xs"}>{status.label}</Badge>
                          {position.notification_sent && (
                            <span className="text-xs text-slate-500">📧 Notified</span>
                          )}
                        </div>

                        <div className="text-sm text-slate-600">
                          {position.assigned_member ? (
                            <span className="font-medium">{position.assigned_member}</span>
                          ) : (
                            <span className="text-slate-400 italic">Not assigned</span>
                          )}
                          {position.assigned_email && (
                            <span className="ml-2 text-slate-400">• {position.assigned_email}</span>
                          )}
                        </div>

                        {position.notes && (
                          <p className="text-xs text-slate-500 mt-1 bg-slate-50 px-2 py-1 rounded">{position.notes}</p>
                        )}

                        {isDeclined && position.decline_reason && (
                          <p className="text-sm text-red-700 mt-2 bg-red-100 px-3 py-2 rounded-lg">
                            <strong>Decline reason:</strong> {position.decline_reason}
                          </p>
                        )}

                        {isSwapRequested && (
                          <div className="mt-2 bg-orange-100 px-3 py-2 rounded-lg">
                            <p className="text-sm text-orange-800 font-medium">🔄 Swap requested{position.reassign_requested_to ? ` → ${position.reassign_requested_to}` : ''}</p>
                            {position.reassign_reason && <p className="text-xs text-orange-700 mt-1">Reason: {position.reassign_reason}</p>}
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" onClick={() => handleApproveReassign(position)} className="bg-green-600 hover:bg-green-700 text-xs">
                                ✅ Approve Swap
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setReassignPosition(position)} className="text-xs">
                                Reassign Differently
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        {position.assigned_email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendSingleNotification(position)}
                            disabled={sendingId === position.id}
                            title="Send/Resend notification"
                            className="text-blue-600"
                          >
                            {sendingId === position.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {(isDeclined || isSwapRequested) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReassignPosition(position)}
                            title="Reassign role"
                            className="text-orange-600"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteMutation.mutate(position.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {reassignPosition && (
        <ReassignModal
          position={reassignPosition}
          posLabel={reassignPosition.custom_position_name || positionLabels[reassignPosition.position_name] || reassignPosition.position_name}
          servicePlanId={servicePlanId}
          onClose={() => setReassignPosition(null)}
          onSuccess={() => setReassignPosition(null)}
        />
      )}
    </div>
  );
}