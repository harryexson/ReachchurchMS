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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, MessageSquare, Users, TrendingUp, Play, Pause } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VisitorSMSWorkflows() {
    const [workflows, setWorkflows] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [formData, setFormData] = useState({
        workflow_name: "",
        description: "",
        trigger_type: "visitor_added",
        trigger_status: "",
        trigger_delay_days: 0,
        is_active: true,
        sms_sequence: [
            { step_number: 1, delay_hours: 0, message_template: "Hi {name}! Thank you for visiting us on {visit_date}. We're so glad you joined us! Reply STOP to opt out." }
        ]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [workflowData, executionData] = await Promise.all([
                base44.entities.VisitorSMSWorkflow.list(),
                base44.entities.VisitorSMSExecution.list()
            ]);
            setWorkflows(workflowData);
            setExecutions(executionData);
        } catch (error) {
            console.error('Error loading workflows:', error);
        }
        setIsLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingWorkflow) {
                await base44.entities.VisitorSMSWorkflow.update(editingWorkflow.id, formData);
            } else {
                await base44.entities.VisitorSMSWorkflow.create(formData);
            }
            setShowDialog(false);
            setEditingWorkflow(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving workflow:', error);
            alert('Failed to save workflow');
        }
    };

    const handleEdit = (workflow) => {
        setEditingWorkflow(workflow);
        setFormData({
            workflow_name: workflow.workflow_name,
            description: workflow.description || "",
            trigger_type: workflow.trigger_type,
            trigger_status: workflow.trigger_status || "",
            trigger_delay_days: workflow.trigger_delay_days || 0,
            is_active: workflow.is_active,
            sms_sequence: workflow.sms_sequence || []
        });
        setShowDialog(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this workflow? This will not affect already running sequences.')) return;
        try {
            await base44.entities.VisitorSMSWorkflow.delete(id);
            loadData();
        } catch (error) {
            console.error('Error deleting workflow:', error);
        }
    };

    const toggleActive = async (workflow) => {
        try {
            await base44.entities.VisitorSMSWorkflow.update(workflow.id, {
                is_active: !workflow.is_active
            });
            loadData();
        } catch (error) {
            console.error('Error toggling workflow:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            workflow_name: "",
            description: "",
            trigger_type: "visitor_added",
            trigger_status: "",
            trigger_delay_days: 0,
            is_active: true,
            sms_sequence: [
                { step_number: 1, delay_hours: 0, message_template: "Hi {name}! Thank you for visiting us on {visit_date}. We're so glad you joined us! Reply STOP to opt out." }
            ]
        });
    };

    const addStep = () => {
        setFormData(prev => ({
            ...prev,
            sms_sequence: [
                ...prev.sms_sequence,
                { 
                    step_number: prev.sms_sequence.length + 1, 
                    delay_hours: 24, 
                    message_template: "" 
                }
            ]
        }));
    };

    const removeStep = (index) => {
        setFormData(prev => ({
            ...prev,
            sms_sequence: prev.sms_sequence.filter((_, i) => i !== index)
        }));
    };

    const updateStep = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            sms_sequence: prev.sms_sequence.map((step, i) => 
                i === index ? { ...step, [field]: value } : step
            )
        }));
    };

    const getTriggerLabel = (type) => {
        const labels = {
            visitor_added: "New Visitor Added",
            first_contact: "After First Contact",
            second_visit: "Second Visit",
            status_change: "Status Changes",
            days_after_visit: "Days After Visit"
        };
        return labels[type] || type;
    };

    if (isLoading) {
        return <div className="p-6 text-center">Loading workflows...</div>;
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Visitor SMS Workflows</h1>
                        <p className="text-slate-600 mt-1">Automated SMS follow-up sequences for visitors</p>
                    </div>
                    <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Workflow
                    </Button>
                </div>

                <Alert>
                    <MessageSquare className="w-4 h-4" />
                    <AlertDescription>
                        Workflows automatically send SMS messages to visitors based on triggers. Use variables: {"{name}"}, {"{visit_date}"}, {"{church_name}"}
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold">{workflows.length}</p>
                                    <p className="text-sm text-slate-600">Total Workflows</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold">{executions.filter(e => e.status === 'active').length}</p>
                                    <p className="text-sm text-slate-600">Active Sequences</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-purple-600" />
                                <div>
                                    <p className="text-2xl font-bold">
                                        {workflows.reduce((sum, w) => sum + (w.total_triggered || 0), 0)}
                                    </p>
                                    <p className="text-sm text-slate-600">Total Triggered</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4">
                    {workflows.map((workflow) => (
                        <Card key={workflow.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {workflow.workflow_name}
                                            {workflow.is_active ? (
                                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                                            ) : (
                                                <Badge variant="outline">Paused</Badge>
                                            )}
                                        </CardTitle>
                                        <p className="text-sm text-slate-600 mt-1">{workflow.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => toggleActive(workflow)}>
                                            {workflow.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(workflow)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(workflow.id)}>
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex gap-6 text-sm">
                                        <div>
                                            <span className="text-slate-600">Trigger:</span>
                                            <span className="ml-2 font-medium">{getTriggerLabel(workflow.trigger_type)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Steps:</span>
                                            <span className="ml-2 font-medium">{workflow.sms_sequence?.length || 0}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Triggered:</span>
                                            <span className="ml-2 font-medium">{workflow.total_triggered || 0} times</span>
                                        </div>
                                    </div>
                                    
                                    {workflow.sms_sequence && workflow.sms_sequence.length > 0 && (
                                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                            <p className="text-xs font-semibold text-slate-700">Message Sequence:</p>
                                            {workflow.sms_sequence.map((step, idx) => (
                                                <div key={idx} className="text-xs text-slate-600">
                                                    <span className="font-medium">Step {step.step_number}:</span>
                                                    {step.delay_hours > 0 && <span className="text-blue-600 ml-2">(+{step.delay_hours}h)</span>}
                                                    <p className="mt-1 bg-white p-2 rounded">{step.message_template}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {workflows.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-600">No SMS workflows created yet</p>
                                <Button className="mt-4" onClick={() => { resetForm(); setShowDialog(true); }}>
                                    Create Your First Workflow
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingWorkflow ? "Edit Workflow" : "Create SMS Workflow"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Workflow Name</Label>
                                    <Input
                                        value={formData.workflow_name}
                                        onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                                        placeholder="e.g., First-Time Visitor Welcome"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Trigger Type</Label>
                                    <Select
                                        value={formData.trigger_type}
                                        onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="visitor_added">New Visitor Added</SelectItem>
                                            <SelectItem value="first_contact">After First Contact</SelectItem>
                                            <SelectItem value="second_visit">Second Visit</SelectItem>
                                            <SelectItem value="status_change">Status Changes</SelectItem>
                                            <SelectItem value="days_after_visit">Days After Visit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the purpose of this workflow"
                                    rows={2}
                                />
                            </div>

                            {formData.trigger_type === 'days_after_visit' && (
                                <div className="space-y-2">
                                    <Label>Delay Days</Label>
                                    <Input
                                        type="number"
                                        value={formData.trigger_delay_days}
                                        onChange={(e) => setFormData({ ...formData, trigger_delay_days: parseInt(e.target.value) })}
                                        min="0"
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>SMS Message Sequence</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addStep}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Step
                                    </Button>
                                </div>

                                {formData.sms_sequence.map((step, index) => (
                                    <Card key={index} className="p-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-sm font-semibold">Step {index + 1}</Label>
                                                {index > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeStep(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                )}
                                            </div>

                                            {index > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Delay (hours after previous step)</Label>
                                                    <Input
                                                        type="number"
                                                        value={step.delay_hours}
                                                        onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value))}
                                                        min="0"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="text-xs">Message Template</Label>
                                                <Textarea
                                                    value={step.message_template}
                                                    onChange={(e) => updateStep(index, 'message_template', e.target.value)}
                                                    placeholder="Use {name}, {visit_date}, {church_name}"
                                                    rows={3}
                                                    required
                                                />
                                                <p className="text-xs text-slate-500">
                                                    Available variables: {"{name}"}, {"{visit_date}"}, {"{church_name}"}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label>Activate workflow immediately</Label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingWorkflow ? "Update Workflow" : "Create Workflow"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}