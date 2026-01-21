import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TemplateModal({ editingTemplate, onClose, onSuccess }) {
  const [formData, setFormData] = useState(editingTemplate || {
    template_name: "",
    service_type: "sunday_morning",
    default_duration_minutes: 90,
    template_items: [],
    is_default: false
  });
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setFormData({
      ...formData,
      template_items: [
        ...formData.template_items,
        { item_type: "song", title: "", duration_minutes: 5, order_index: formData.template_items.length + 1 }
      ]
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.template_items];
    items[index][field] = value;
    setFormData({ ...formData, template_items: items });
  };

  const removeItem = (index) => {
    const items = formData.template_items.filter((_, i) => i !== index);
    setFormData({ ...formData, template_items: items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingTemplate) {
        await base44.entities.ServiceTemplate.update(editingTemplate.id, formData);
        toast.success("Template updated");
      } else {
        await base44.entities.ServiceTemplate.create(formData);
        toast.success("Template created");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingTemplate ? "Edit Template" : "Create Template"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                placeholder="e.g., Standard Sunday Service"
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
            <Label>Default Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.default_duration_minutes}
              onChange={(e) => setFormData({ ...formData, default_duration_minutes: parseInt(e.target.value) })}
              min="30"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_default" className="cursor-pointer">
              Set as default template for this service type
            </Label>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Template Items</Label>
              <Button type="button" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.template_items.map((item, index) => (
                <div key={index} className="flex gap-2 p-3 bg-slate-50 rounded-lg">
                  <select
                    value={item.item_type}
                    onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="song">Song</option>
                    <option value="prayer">Prayer</option>
                    <option value="sermon">Sermon</option>
                    <option value="offering">Offering</option>
                    <option value="announcement">Announcement</option>
                    <option value="scripture_reading">Scripture</option>
                  </select>
                  <Input
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder="Title"
                    className="flex-1"
                    size="sm"
                  />
                  <Input
                    type="number"
                    value={item.duration_minutes}
                    onChange={(e) => updateItem(index, 'duration_minutes', parseInt(e.target.value))}
                    placeholder="Min"
                    className="w-20"
                    size="sm"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Saving..." : (editingTemplate ? "Update Template" : "Create Template")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}