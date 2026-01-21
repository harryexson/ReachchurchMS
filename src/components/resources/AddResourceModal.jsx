import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function AddResourceModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    resource_type: "equipment",
    category: "",
    description: "",
    location: "",
    capacity: 1,
    status: "available",
    requires_approval: false,
    contact_person: "",
    contact_email: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.Resource.create(formData);
      toast.success("Resource added successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to add resource");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">Add Resource</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Resource Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Sanctuary, Wireless Mic 1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <select
                value={formData.resource_type}
                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="room">Room</option>
                <option value="equipment">Equipment</option>
                <option value="vehicle">Vehicle</option>
                <option value="instrument">Instrument</option>
                <option value="technology">Technology</option>
              </select>
            </div>

            <div>
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Sound Equipment, Van"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Physical location"
              />
            </div>

            <div>
              <Label>Capacity / Quantity</Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact Person</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Responsible person"
              />
            </div>

            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires_approval"
              checked={formData.requires_approval}
              onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="requires_approval" className="cursor-pointer">
              Requires admin approval for booking
            </Label>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Adding..." : "Add Resource"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}