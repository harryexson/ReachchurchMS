import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock, Zap } from 'lucide-react';

export default function SMSWorkflowBuilder({ workflow, onSave, onCancel }) {
    const [formData, setFormData] = useState(workflow || {
        workflow_name: '',
        trigger_type: 'keyword',
        trigger_keyword: '',
        is_active: true,
        sequence_steps: [
            { step_number: 1, delay_minutes: 0, message_template: '' }
        ]
    });

    const addStep = () => {
        setFormData({
            ...formData,
            sequence_steps: [
                ...formData.sequence_steps,
                {
                    step_number: formData.sequence_steps.length + 1,
                    delay_minutes: 60,
                    message_template: ''
                }
            ]
        });
    };

    const removeStep = (index) => {
        const steps = formData.sequence_steps.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            sequence_steps: steps.map((step, i) => ({ ...step, step_number: i + 1 }))
        });
    };

    const updateStep = (index, field, value) => {
        const steps = [...formData.sequence_steps];
        steps[index] = { ...steps[index], [field]: value };
        setFormData({ ...formData, sequence_steps: steps });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {workflow ? 'Edit Workflow' : 'Create Automated Follow-Up Workflow'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>Workflow Name</Label>
                        <Input
                            value={formData.workflow_name}
                            onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                            placeholder="e.g., Welcome Series, Event Follow-Up"
                            required
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label>Trigger Type</Label>
                            <Select
                                value={formData.trigger_type}
                                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="keyword">Keyword</SelectItem>
                                    <SelectItem value="form_submission">Form Submission</SelectItem>
                                    <SelectItem value="subscription">New Subscription</SelectItem>
                                    <SelectItem value="event_registration">Event Registration</SelectItem>
                                    <SelectItem value="donation">After Donation</SelectItem>
                                    <SelectItem value="manual">Manual Trigger</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.trigger_type === 'keyword' && (
                            <div>
                                <Label>Trigger Keyword</Label>
                                <Input
                                    value={formData.trigger_keyword}
                                    onChange={(e) => setFormData({ ...formData, trigger_keyword: e.target.value.toUpperCase() })}
                                    placeholder="WELCOME"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">Message Sequence</h3>
                            <Button type="button" onClick={addStep} size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Step
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {formData.sequence_steps.map((step, index) => (
                                <Card key={index} className="border-2 border-blue-100">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                                    {step.step_number}
                                                </div>
                                                <span className="font-medium text-slate-900">Step {step.step_number}</span>
                                            </div>
                                            {formData.sequence_steps.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeStep(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>

                                        {index > 0 && (
                                            <div>
                                                <Label className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Wait Time (minutes)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={step.delay_minutes}
                                                    onChange={(e) => updateStep(index, 'delay_minutes', parseInt(e.target.value))}
                                                    min="0"
                                                    required
                                                />
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {step.delay_minutes >= 1440 
                                                        ? `${Math.floor(step.delay_minutes / 1440)} day(s)` 
                                                        : step.delay_minutes >= 60 
                                                        ? `${Math.floor(step.delay_minutes / 60)} hour(s)` 
                                                        : `${step.delay_minutes} minute(s)`}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <Label>Message</Label>
                                            <Textarea
                                                value={step.message_template}
                                                onChange={(e) => updateStep(index, 'message_template', e.target.value)}
                                                placeholder="Enter your message..."
                                                rows={3}
                                                required
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                {step.message_template.length} characters
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <Label htmlFor="is_active" className="cursor-pointer">
                            <Zap className="w-4 h-4 inline mr-1" />
                            Activate workflow immediately
                        </Label>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            {workflow ? 'Update Workflow' : 'Create Workflow'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}