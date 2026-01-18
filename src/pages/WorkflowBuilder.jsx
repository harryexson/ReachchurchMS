import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Trash2, Mail, MessageSquare, Bell, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const TRIGGER_TYPES = [
  { value: "member_created", label: "New Member Joins", icon: Users, description: "Triggers when a new member is added" },
  { value: "visitor_created", label: "New Visitor", icon: Users, description: "Triggers when a visitor fills out a form" },
  { value: "donation_received", label: "Donation Received", icon: CheckCircle, description: "Triggers when a donation is made" },
  { value: "event_created", label: "Event Created", icon: Clock, description: "Triggers when a new event is scheduled" },
  { value: "visitor_days_since", label: "Visitor Follow-up", icon: Clock, description: "Triggers X days after visitor's first visit" },
  { value: "member_birthday", label: "Member Birthday", icon: Users, description: "Triggers on member's birthday" },
  { value: "volunteer_assigned", label: "Volunteer Assigned", icon: Users, description: "Triggers when volunteer is assigned to an event" }
];

const ACTION_TYPES = [
  { value: "send_email", label: "Send Email", icon: Mail, needsTemplate: true },
  { value: "send_sms", label: "Send SMS", icon: MessageSquare, needsTemplate: true },
  { value: "send_notification", label: "In-App Notification", icon: Bell, needsTemplate: true },
  { value: "assign_to_group", label: "Add to Group", icon: Users, needsConfig: true }
];

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "",
    trigger_config: {},
    actions: [],
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [workflowsData, executionsData] = await Promise.all([
      base44.entities.Workflow.list('-created_date'),
      base44.entities.WorkflowExecution.list('-execution_date', 50)
    ]);
    setWorkflows(workflowsData);
    setExecutions(executionsData);
    setLoading(false);
  };

  const handleCreateNew = () => {
    setFormData({
      name: "",
      description: "",
      trigger_type: "",
      trigger_config: {},
      actions: [],
      is_active: true
    });
    setEditingWorkflow(null);
    setIsCreating(true);
  };

  const handleEdit = (workflow) => {
    setFormData({
      name: workflow.name,
      description: workflow.description,
      trigger_type: workflow.trigger_type,
      trigger_config: workflow.trigger_config || {},
      actions: workflow.actions || [],
      is_active: workflow.is_active
    });
    setEditingWorkflow(workflow);
    setIsCreating(true);
  };

  const handleAddAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, {
        action_type: "",
        config: {
          subject: "",
          message: "",
          group_id: ""
        }
      }]
    });
  };

  const handleRemoveAction = (index) => {
    const newActions = formData.actions.filter((_, i) => i !== index);
    setFormData({ ...formData, actions: newActions });
  };

  const handleActionChange = (index, field, value) => {
    const newActions = [...formData.actions];
    if (field === "action_type") {
      newActions[index] = { action_type: value, config: {} };
    } else {
      newActions[index].config[field] = value;
    }
    setFormData({ ...formData, actions: newActions });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.trigger_type || formData.actions.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingWorkflow) {
        await base44.entities.Workflow.update(editingWorkflow.id, formData);
        toast.success("Workflow updated!");
      } else {
        await base44.entities.Workflow.create(formData);
        toast.success("Workflow created!");
      }
      setIsCreating(false);
      loadData();
    } catch (error) {
      toast.error("Failed to save workflow: " + error.message);
    }
  };

  const handleToggleActive = async (workflow) => {
    await base44.entities.Workflow.update(workflow.id, {
      is_active: !workflow.is_active
    });
    toast.success(workflow.is_active ? "Workflow paused" : "Workflow activated");
    loadData();
  };

  const handleDelete = async (workflow) => {
    if (confirm(`Delete workflow "${workflow.name}"?`)) {
      await base44.entities.Workflow.delete(workflow.id);
      toast.success("Workflow deleted");
      loadData();
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (isCreating) {
    const selectedTrigger = TRIGGER_TYPES.find(t => t.value === formData.trigger_type);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {editingWorkflow ? "Edit" : "Create"} Workflow
              </h1>
              <p className="text-slate-600">Build automated actions based on triggers</p>
            </div>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Workflow Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Welcome new members"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sends welcome email to new members"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trigger *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>When should this workflow run?</Label>
                <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(trigger => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTrigger && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900"><strong>{selectedTrigger.label}</strong></p>
                  <p className="text-xs text-blue-700 mt-1">{selectedTrigger.description}</p>
                </div>
              )}

              {formData.trigger_type === "visitor_days_since" && (
                <div>
                  <Label>Days After Visit</Label>
                  <Input
                    type="number"
                    value={formData.trigger_config.days_since || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_config: { ...formData.trigger_config, days_since: parseInt(e.target.value) }
                    })}
                    placeholder="3"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Actions * ({formData.actions.length})</span>
                <Button size="sm" onClick={handleAddAction}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Action
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.actions.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No actions yet. Click "Add Action" to get started.</p>
              )}

              {formData.actions.map((action, index) => {
                const actionType = ACTION_TYPES.find(a => a.value === action.action_type);
                return (
                  <div key={index} className="p-4 border rounded-lg bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Action {index + 1}</Label>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveAction(index)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>

                    <Select
                      value={action.action_type}
                      onValueChange={(value) => handleActionChange(index, "action_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map(actionOpt => (
                          <SelectItem key={actionOpt.value} value={actionOpt.value}>
                            {actionOpt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {actionType?.needsTemplate && (
                      <>
                        <div>
                          <Label>Subject / Title</Label>
                          <Input
                            value={action.config.subject || ""}
                            onChange={(e) => handleActionChange(index, "subject", e.target.value)}
                            placeholder="Welcome to our church!"
                          />
                        </div>
                        <div>
                          <Label>Message</Label>
                          <Textarea
                            value={action.config.message || ""}
                            onChange={(e) => handleActionChange(index, "message", e.target.value)}
                            placeholder="Hi {name}, welcome! We're excited to have you join us."
                            rows={4}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Use placeholders: {"{name}"}, {"{email}"}, {"{phone}"}
                          </p>
                        </div>
                      </>
                    )}

                    {action.action_type === "assign_to_group" && (
                      <div>
                        <Label>Group ID</Label>
                        <Input
                          value={action.config.group_id || ""}
                          onChange={(e) => handleActionChange(index, "group_id", e.target.value)}
                          placeholder="Enter group ID"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <Label>Active</Label>
              <p className="text-sm text-slate-600">Enable this workflow to run automatically</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {editingWorkflow ? "Update Workflow" : "Create Workflow"}
            </Button>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Workflow Automation</h1>
            <p className="text-slate-600">Create automated workflows triggered by events</p>
          </div>
          <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Total Workflows</p>
                  <p className="text-3xl font-bold text-slate-900">{workflows.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Active Workflows</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {workflows.filter(w => w.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Executions (30d)</p>
                  <p className="text-3xl font-bold text-slate-900">{executions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            {workflows.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600 mb-4">No workflows yet</p>
                <Button onClick={handleCreateNew}>Create Your First Workflow</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map(workflow => {
                  const trigger = TRIGGER_TYPES.find(t => t.value === workflow.trigger_type);
                  return (
                    <div key={workflow.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{workflow.name}</h3>
                            <Badge className={workflow.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {workflow.is_active ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{workflow.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Trigger: {trigger?.label}</span>
                            <span>Actions: {workflow.actions?.length || 0}</span>
                            <span>Runs: {workflow.execution_count || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(workflow)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(workflow)}
                          >
                            {workflow.is_active ? "Pause" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(workflow)}
                            className="text-red-600"
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No workflow executions yet</p>
            ) : (
              <div className="space-y-2">
                {executions.slice(0, 10).map(exec => (
                  <div key={exec.id} className="p-3 border rounded bg-white text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{exec.workflow_name}</span>
                      <Badge className={
                        exec.status === "success" ? "bg-green-100 text-green-800" :
                        exec.status === "failed" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }>
                        {exec.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(exec.execution_date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}