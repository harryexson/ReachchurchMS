import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
    Plus, Trash2, Save, ArrowRight, Copy, Target, Zap 
} from "lucide-react";

const MESSAGE_TEMPLATES = {
    first_visit_welcome: {
        subject: "Welcome to {church_name}! So glad you visited 🙏",
        body: `Hi {visitor_name},

Thank you so much for visiting us at {church_name}! We're thrilled you chose to worship with us.

We'd love to get to know you better and help you feel at home. If you have any questions or would like to connect, please don't hesitate to reach out.

Looking forward to seeing you again soon!

Blessings,
The {church_name} Team`
    },
    second_visit_followup: {
        subject: "We hope to see you again at {church_name}!",
        body: `Hi {visitor_name},

It's been about a week since you visited {church_name}, and we wanted to check in with you.

We'd love to have you join us again this Sunday! Service starts at 10:00 AM.

Is there anything we can pray for you about or any questions we can answer?

Hope to see you soon!

Blessings,
The {church_name} Team`
    },
    ministry_interest: {
        subject: "Find Your Place at {church_name}",
        body: `Hi {visitor_name},

We're so glad you've been connecting with {church_name}!

We have many opportunities to get involved and find community:
• Small Groups
• Volunteer Teams
• Ministry Opportunities
• Special Events

Would you like to learn more about any of these? Just reply to this message and let us know what interests you!

We're here to help you find your place.

Blessings,
The {church_name} Team`
    }
};

export default function WorkflowBuilder({ workflow, onSave, onClose }) {
    const [workflowData, setWorkflowData] = useState({
        workflow_name: "",
        description: "",
        trigger_type: "first_visit",
        trigger_delay_days: 0,
        is_active: true,
        notes: ""
    });

    const [steps, setSteps] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [workflow]);

    const loadData = async () => {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (workflow) {
            setWorkflowData(workflow);
            
            const workflowSteps = await base44.entities.VisitorWorkflowStep.filter({
                workflow_id: workflow.id
            });
            setSteps(workflowSteps.sort((a, b) => a.step_number - b.step_number));
        } else {
            setSteps([{
                step_number: 1,
                step_name: "Welcome Message",
                delay_days: 0,
                delay_hours: 0,
                channel: "email",
                subject: MESSAGE_TEMPLATES.first_visit_welcome.subject,
                message_body: MESSAGE_TEMPLATES.first_visit_welcome.body,
                action_type: "send_message"
            }]);
        }
    };

    const handleWorkflowChange = (field, value) => {
        setWorkflowData(prev => ({ ...prev, [field]: value }));
    };

    const handleStepChange = (index, field, value) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const addStep = () => {
        const newStep = {
            step_number: steps.length + 1,
            step_name: `Step ${steps.length + 1}`,
            delay_days: steps.length === 0 ? 0 : 7,
            delay_hours: 0,
            channel: "email",
            subject: "",
            message_body: "",
            action_type: "send_message"
        };
        setSteps([...steps, newStep]);
    };

    const removeStep = (index) => {
        if (steps.length === 1) {
            alert("Workflow must have at least one step");
            return;
        }
        const newSteps = steps.filter((_, i) => i !== index);
        newSteps.forEach((step, i) => {
            step.step_number = i + 1;
        });
        setSteps(newSteps);
    };

    const duplicateStep = (index) => {
        const stepToDuplicate = { ...steps[index] };
        const newStep = {
            ...stepToDuplicate,
            step_number: steps.length + 1,
            step_name: `${stepToDuplicate.step_name} (Copy)`
        };
        setSteps([...steps, newStep]);
    };

    const applyTemplate = (index, templateKey) => {
        const template = MESSAGE_TEMPLATES[templateKey];
        if (template) {
            handleStepChange(index, 'subject', template.subject);
            handleStepChange(index, 'message_body', template.body);
        }
    };

    const insertPlaceholder = (index, placeholder) => {
        const step = steps[index];
        const newBody = step.message_body + ` {${placeholder}}`;
        handleStepChange(index, 'message_body', newBody);
    };

    const handleSave = async () => {
        if (!workflowData.workflow_name) {
            alert("Please enter a workflow name");
            return;
        }

        if (steps.length === 0) {
            alert("Workflow must have at least one step");
            return;
        }

        setIsSaving(true);

        try {
            let workflowId = workflow?.id;

            if (workflow) {
                await base44.entities.VisitorWorkflow.update(workflow.id, {
                    ...workflowData,
                    total_steps: steps.length,
                    last_modified_by: currentUser.email
                });
            } else {
                const newWorkflow = await base44.entities.VisitorWorkflow.create({
                    ...workflowData,
                    total_steps: steps.length,
                    created_by: currentUser.email,
                    last_modified_by: currentUser.email
                });
                workflowId = newWorkflow.id;
            }

            if (workflow) {
                const existingSteps = await base44.entities.VisitorWorkflowStep.filter({
                    workflow_id: workflow.id
                });
                for (const step of existingSteps) {
                    await base44.entities.VisitorWorkflowStep.delete(step.id);
                }
            }

            for (const step of steps) {
                await base44.entities.VisitorWorkflowStep.create({
                    ...step,
                    workflow_id: workflowId
                });
            }

            alert("Workflow saved successfully!");
            onSave();
        } catch (error) {
            console.error("Error saving workflow:", error);
            alert("Failed to save workflow");
        }

        setIsSaving(false);
    };

    const getTotalDelay = (stepIndex) => {
        let total = 0;
        for (let i = 0; i <= stepIndex; i++) {
            total += (steps[i].delay_days || 0) + ((steps[i].delay_hours || 0) / 24);
        }
        return total;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {workflow ? 'Edit Workflow' : 'Create New Workflow'}
                        </h2>
                        <p className="text-sm text-slate-600">Design automated visitor engagement sequences</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Workflow'}
                        </Button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Workflow Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Workflow Name *</Label>
                                    <Input
                                        value={workflowData.workflow_name}
                                        onChange={(e) => handleWorkflowChange('workflow_name', e.target.value)}
                                        placeholder="e.g., First Visit Welcome Series"
                                    />
                                </div>

                                <div>
                                    <Label>Trigger *</Label>
                                    <Select value={workflowData.trigger_type} onValueChange={(v) => handleWorkflowChange('trigger_type', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="first_visit">First Visit</SelectItem>
                                            <SelectItem value="second_visit">Second Visit</SelectItem>
                                            <SelectItem value="third_visit">Third Visit</SelectItem>
                                            <SelectItem value="status_change">Status Change</SelectItem>
                                            <SelectItem value="after_days_since_visit">Days Since Last Visit</SelectItem>
                                            <SelectItem value="manual">Manual Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={workflowData.description}
                                        onChange={(e) => handleWorkflowChange('description', e.target.value)}
                                        placeholder="Describe what this workflow does..."
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <Label>Delay Before Starting (days)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={workflowData.trigger_delay_days}
                                        onChange={(e) => handleWorkflowChange('trigger_delay_days', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={workflowData.is_active}
                                        onCheckedChange={(checked) => handleWorkflowChange('is_active', checked)}
                                    />
                                    <Label>Workflow Active</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5" />
                                    Workflow Steps ({steps.length})
                                </CardTitle>
                                <Button onClick={addStep} size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Step
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {steps.map((step, index) => (
                                <div key={index} className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <Input
                                                    value={step.step_name}
                                                    onChange={(e) => handleStepChange(index, 'step_name', e.target.value)}
                                                    className="font-semibold"
                                                    placeholder="Step name"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Executes {getTotalDelay(index).toFixed(1)} days after enrollment
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => duplicateStep(index)}>
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <Label>Wait Time (Days)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={step.delay_days}
                                                onChange={(e) => handleStepChange(index, 'delay_days', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Additional Hours</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={step.delay_hours}
                                                onChange={(e) => handleStepChange(index, 'delay_hours', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Channel</Label>
                                            <Select value={step.channel} onValueChange={(v) => handleStepChange(index, 'channel', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="email">📧 Email</SelectItem>
                                                    <SelectItem value="sms">📱 SMS</SelectItem>
                                                    <SelectItem value="both">📧📱 Both</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <Label>Use Template</Label>
                                        <Select onValueChange={(v) => applyTemplate(index, v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a template..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first_visit_welcome">First Visit Welcome</SelectItem>
                                                <SelectItem value="second_visit_followup">Second Visit Follow-up</SelectItem>
                                                <SelectItem value="ministry_interest">Ministry Interest Survey</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {(step.channel === 'email' || step.channel === 'both') && (
                                        <div className="mb-4">
                                            <Label>Email Subject</Label>
                                            <Input
                                                value={step.subject}
                                                onChange={(e) => handleStepChange(index, 'subject', e.target.value)}
                                                placeholder="Email subject..."
                                            />
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <Label>Message</Label>
                                        <Textarea
                                            value={step.message_body}
                                            onChange={(e) => handleStepChange(index, 'message_body', e.target.value)}
                                            rows={6}
                                            placeholder="Type your message..."
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder(index, 'visitor_name')}>
                                                + Name
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder(index, 'church_name')}>
                                                + Church
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder(index, 'visit_date')}>
                                                + Visit Date
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder(index, 'total_visits')}>
                                                + Total Visits
                                            </Button>
                                        </div>
                                    </div>

                                    {index < steps.length - 1 && (
                                        <div className="flex items-center justify-center py-2">
                                            <ArrowRight className="w-6 h-6 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}