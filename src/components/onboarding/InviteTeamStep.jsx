import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Trash2, HelpCircle } from "lucide-react";

export default function InviteTeamStep({ onComplete }) {
  const [invites, setInvites] = useState([{ email: "", role: "user" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAddInvite = () => {
    setInvites([...invites, { email: "", role: "user" }]);
  };

  const handleRemoveInvite = (index) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const handleInviteChange = (index, field, value) => {
    const updated = [...invites];
    updated[index][field] = value;
    setInvites(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const validInvites = invites.filter((inv) => inv.email.trim());

      if (validInvites.length === 0) {
        setSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
        return;
      }

      // Invite team members
      for (const invite of validInvites) {
        try {
          await base44.users.inviteUser(invite.email, invite.role);
        } catch (inviteError) {
          console.warn(`Could not invite ${invite.email}:`, inviteError);
          // Continue with other invites
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">👋</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Invitations Sent!</h3>
        <p className="text-slate-600">Your team members will receive invitation emails to join REACH Church Connect.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Invite your team members to collaborate on church management. They'll receive an email invitation to join.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {invites.map((invite, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-slate-700">Team Member {index + 1}</p>
                {invites.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInvite(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-xs font-semibold text-slate-900">Email</Label>
                    <div className="relative group cursor-help">
                      <HelpCircle className="w-3 h-3 text-blue-600" />
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Their work email
                      </div>
                    </div>
                  </div>
                  <Input
                    type="email"
                    placeholder="team@church.com"
                    value={invite.email}
                    onChange={(e) => handleInviteChange(index, "email", e.target.value)}
                    className="h-10"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-xs font-semibold text-slate-900">Role</Label>
                    <div className="relative group cursor-help">
                      <HelpCircle className="w-3 h-3 text-blue-600" />
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Admin or Member
                      </div>
                    </div>
                  </div>
                  <select
                    value={invite.role}
                    onChange={(e) => handleInviteChange(index, "role", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="user">Member (Limited Access)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {invite.role === "admin"
                      ? "Can access all features and manage settings"
                      : "Can view and participate in activities"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleAddInvite}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Team Member
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 h-11"
        >
          {isLoading ? "Sending Invitations..." : "Send Team Invitations"}
        </Button>

        <Button
          type="button"
          onClick={onComplete}
          variant="ghost"
          className="w-full text-slate-600"
        >
          Skip This Step
        </Button>
      </form>

      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-slate-700">
          Start with key leaders like your pastor and communication coordinator. You can always add more people later from the User Management section.
        </p>
      </div>
    </div>
  );
}