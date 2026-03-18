import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function AddTeamMemberModal({ servicePlanId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    service_plan_id: servicePlanId,
    position_name: "vocals",
    custom_position_name: "",
    section: "",
    assigned_member: "",
    assigned_email: "",
    assigned_phone: "",
    notes: "",
    response_status: "pending"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.TeamPosition.create(formData);
      toast.success("Team member added");
      onSuccess();
    } catch (error) {
      toast.error("Failed to add team member");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-900">Add Team Member</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Position *</Label>
            <select
              value={formData.position_name}
              onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <optgroup label="Welcome & Hospitality">
                <option value="visitor_welcome">Visitor Welcome Host</option>
                <option value="greeter">Greeter</option>
                <option value="usher">Usher</option>
                <option value="hospitality">Hospitality</option>
                <option value="parking_team">Parking Team</option>
                <option value="security">Security</option>
              </optgroup>
              <optgroup label="Announcements & Admin">
                <option value="announcer">Announcer</option>
                <option value="emcee">Emcee / MC</option>
              </optgroup>
              <optgroup label="Prayer">
                <option value="prayer_team">Prayer Team</option>
                <option value="intercessor">Intercessor</option>
              </optgroup>
              <optgroup label="Praise & Worship">
                <option value="worship_leader">Worship Leader</option>
                <option value="praise_leader">Praise Leader</option>
                <option value="choir_leader">Choir Leader</option>
                <option value="vocals">Vocals</option>
                <option value="guitar">Guitar</option>
                <option value="bass">Bass</option>
                <option value="drums">Drums</option>
                <option value="keyboard">Keyboard/Piano</option>
              </optgroup>
              <optgroup label="Offering & Giving">
                <option value="offering_coordinator">Offering Coordinator</option>
              </optgroup>
              <optgroup label="Scripture & Teaching">
                <option value="scripture_reader">Scripture Reader</option>
                <option value="testimony_speaker">Testimony Speaker</option>
              </optgroup>
              <optgroup label="Technical">
                <option value="sound_tech">Sound Tech</option>
                <option value="video_tech">Video Tech</option>
                <option value="media_operator">Media Operator</option>
                <option value="lights">Lighting</option>
              </optgroup>
              <optgroup label="Children">
                <option value="kids_ministry">Kids Ministry</option>
              </optgroup>
              <optgroup label="Sacraments">
                <option value="communion_server">Communion Server</option>
              </optgroup>
              <option value="other">Other (Custom)</option>
            </select>
          </div>

          {formData.position_name === 'other' && (
            <div>
              <Label>Custom Role Name *</Label>
              <Input
                value={formData.custom_position_name}
                onChange={(e) => setFormData({ ...formData, custom_position_name: e.target.value })}
                placeholder="e.g., Altar Worker, Sound Engineer"
              />
            </div>
          )}

          <div>
            <Label>Section / Program Segment</Label>
            <Input
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="e.g., Welcome, Praise & Worship, Offering"
            />
          </div>

          <div>
            <Label>Name *</Label>
            <Input
              value={formData.assigned_member}
              onChange={(e) => setFormData({ ...formData, assigned_member: e.target.value })}
              placeholder="Full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.assigned_email}
                onChange={(e) => setFormData({ ...formData, assigned_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.assigned_phone}
                onChange={(e) => setFormData({ ...formData, assigned_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special instructions or requirements"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Adding..." : "Add Team Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}