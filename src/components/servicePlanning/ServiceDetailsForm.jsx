import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function ServiceDetailsForm({ servicePlan }) {
  const [formData, setFormData] = useState(servicePlan);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () => base44.entities.ServicePlan.update(servicePlan.id, formData),
    onSuccess: () => {
      toast.success("Service plan updated");
      queryClient.invalidateQueries(['servicePlan', servicePlan.id]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Service Type</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Total Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.total_duration_minutes}
                onChange={(e) => setFormData({ ...formData, total_duration_minutes: parseInt(e.target.value) })}
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preacher / Speaker</Label>
              <Input
                value={formData.preacher}
                onChange={(e) => setFormData({ ...formData, preacher: e.target.value })}
                placeholder="Name"
              />
            </div>
            <div>
              <Label>Preacher Email</Label>
              <Input
                type="email"
                value={formData.preacher_email}
                onChange={(e) => setFormData({ ...formData, preacher_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Worship Leader</Label>
              <Input
                value={formData.worship_leader}
                onChange={(e) => setFormData({ ...formData, worship_leader: e.target.value })}
                placeholder="Name"
              />
            </div>
            <div>
              <Label>Worship Leader Email</Label>
              <Input
                type="email"
                value={formData.worship_leader_email}
                onChange={(e) => setFormData({ ...formData, worship_leader_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rehearsal Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.rehearsal_date}
                onChange={(e) => setFormData({ ...formData, rehearsal_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Rehearsal Location</Label>
              <Input
                value={formData.rehearsal_location}
                onChange={(e) => setFormData({ ...formData, rehearsal_location: e.target.value })}
                placeholder="Main Sanctuary, etc."
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="General notes about the service"
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isLoading} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-5 h-5 mr-2" />
              {updateMutation.isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}