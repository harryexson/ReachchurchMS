import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function CreateServiceModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    service_date: "",
    service_type: "sunday_morning",
    theme: "",
    total_duration_minutes: 90
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.ServicePlan.create(formData);
      toast.success("Service plan created successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create service plan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-900">Create Service Plan</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Service Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Sunday Morning Worship"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Service Type *</Label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="sunday_morning">Sunday Morning</option>
                <option value="sunday_evening">Sunday Evening</option>
                <option value="midweek">Midweek Service</option>
                <option value="special_event">Special Event</option>
                <option value="holiday">Holiday Service</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Theme / Sermon Series</Label>
            <Input
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="e.g., Faith in Action"
            />
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.total_duration_minutes}
              onChange={(e) => setFormData({ ...formData, total_duration_minutes: parseInt(e.target.value) })}
              min="30"
              max="180"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Creating..." : "Create Service Plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}