import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Copy, Edit, Trash2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TemplateModal from "@/components/servicePlanning/TemplateModal";

export default function ServiceTemplates() {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['serviceTemplates'],
    queryFn: () => base44.entities.ServiceTemplate.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceTemplate.delete(id),
    onSuccess: () => {
      toast.success("Template deleted");
      queryClient.invalidateQueries(['serviceTemplates']);
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (templateId) => {
      // Unset all other defaults for this service type
      const template = templates.find(t => t.id === templateId);
      const sameTypeTemplates = templates.filter(t => t.service_type === template.service_type);
      
      for (const t of sameTypeTemplates) {
        if (t.id !== templateId && t.is_default) {
          await base44.entities.ServiceTemplate.update(t.id, { is_default: false });
        }
      }
      
      await base44.entities.ServiceTemplate.update(templateId, { is_default: true });
    },
    onSuccess: () => {
      toast.success("Default template set");
      queryClient.invalidateQueries(['serviceTemplates']);
    }
  });

  const typeLabels = {
    sunday_morning: "Sunday Morning",
    sunday_evening: "Sunday Evening",
    midweek: "Midweek Service",
    special_event: "Special Event",
    holiday: "Holiday Service"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Service Templates</h1>
            <p className="text-slate-600">Create reusable templates for different service types</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{template.template_name}</h3>
                    <p className="text-sm text-slate-600">{typeLabels[template.service_type]}</p>
                  </div>
                  {template.is_default && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-slate-600">
                    Duration: {template.default_duration_minutes} min
                  </p>
                  <p className="text-sm text-slate-600">
                    Items: {template.template_items?.length || 0}
                  </p>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDefaultMutation.mutate(template.id)}
                    disabled={template.is_default}
                  >
                    Set Default
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showModal && (
        <TemplateModal
          editingTemplate={editingTemplate}
          onClose={() => {
            setShowModal(false);
            setEditingTemplate(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingTemplate(null);
            queryClient.invalidateQueries(['serviceTemplates']);
          }}
        />
      )}
    </div>
  );
}