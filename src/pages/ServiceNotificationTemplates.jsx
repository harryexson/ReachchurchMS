import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Mail, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ServiceNotificationTemplates() {
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const queryClient = useQueryClient();

    const { data: templates = [] } = useQuery({
        queryKey: ['notificationTemplates'],
        queryFn: () => base44.entities.ServicePlanNotificationTemplate.list('-created_date')
    });

    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editingTemplate) {
                return base44.entities.ServicePlanNotificationTemplate.update(editingTemplate.id, data);
            }
            return base44.entities.ServicePlanNotificationTemplate.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notificationTemplates']);
            toast.success(editingTemplate ? 'Template updated' : 'Template created');
            setShowModal(false);
            setEditingTemplate(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.ServicePlanNotificationTemplate.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['notificationTemplates']);
            toast.success('Template deleted');
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Notification Templates</h1>
                        <p className="text-slate-600 mt-1">Customize service plan notifications</p>
                    </div>
                    <Button onClick={() => { setEditingTemplate(null); setShowModal(true); }} className="bg-blue-600">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Template
                    </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Available Variables</h3>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
                        <div><code>{'{service_title}'}</code> - Service name</div>
                        <div><code>{'{service_date}'}</code> - Service date/time</div>
                        <div><code>{'{team_role}'}</code> - Recipient's role</div>
                        <div><code>{'{team_member}'}</code> - Recipient's name</div>
                        <div><code>{'{service_theme}'}</code> - Service theme</div>
                        <div><code>{'{rehearsal_date}'}</code> - Rehearsal date/time</div>
                    </div>
                </div>

                <div className="grid gap-6">
                    {templates.map(template => (
                        <Card key={template.id} className="shadow-lg">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{template.template_name}</CardTitle>
                                        <div className="flex gap-2 mt-2">
                                            {template.is_default && <Badge className="bg-green-100 text-green-800">Default</Badge>}
                                            {template.send_email && <Badge variant="outline"><Mail className="w-3 h-3 mr-1" />Email</Badge>}
                                            {template.send_sms && <Badge variant="outline"><MessageSquare className="w-3 h-3 mr-1" />SMS</Badge>}
                                            {template.auto_send_enabled && (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Auto: {template.auto_send_days_before} days before
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => { setEditingTemplate(template); setShowModal(true); }}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="text-red-600"
                                            onClick={() => {
                                                if (confirm(`Delete template "${template.template_name}"?`)) {
                                                    deleteMutation.mutate(template.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {template.send_email && (
                                    <div>
                                        <Label className="text-xs text-slate-500">Email Subject</Label>
                                        <p className="text-sm font-mono bg-slate-50 p-2 rounded">{template.email_subject}</p>
                                    </div>
                                )}
                                {template.send_sms && (
                                    <div>
                                        <Label className="text-xs text-slate-500">SMS Message</Label>
                                        <p className="text-sm font-mono bg-slate-50 p-2 rounded">{template.sms_message}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {showModal && (
                    <TemplateModal
                        isOpen={showModal}
                        onClose={() => { setShowModal(false); setEditingTemplate(null); }}
                        template={editingTemplate}
                        onSave={(data) => saveMutation.mutate(data)}
                    />
                )}
            </div>
        </div>
    );
}

function TemplateModal({ isOpen, onClose, template, onSave }) {
    const [formData, setFormData] = useState(template || {
        template_name: "",
        email_subject: "Service Plan: {service_title}",
        email_body: "",
        sms_message: "Service reminder: {service_title} on {service_date}. Your role: {team_role}.",
        send_email: true,
        send_sms: false,
        auto_send_enabled: false,
        auto_send_days_before: 7,
        is_default: false
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{template ? 'Edit' : 'Create'} Notification Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label>Template Name *</Label>
                        <Input
                            value={formData.template_name}
                            onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                            required
                            placeholder="e.g., Standard Service Plan"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Send Email Notifications</Label>
                            <p className="text-xs text-slate-500">Include email in notifications</p>
                        </div>
                        <Switch
                            checked={formData.send_email}
                            onCheckedChange={(checked) => setFormData({...formData, send_email: checked})}
                        />
                    </div>

                    {formData.send_email && (
                        <>
                            <div>
                                <Label>Email Subject</Label>
                                <Input
                                    value={formData.email_subject}
                                    onChange={(e) => setFormData({...formData, email_subject: e.target.value})}
                                    placeholder="Use variables like {service_title}"
                                />
                            </div>
                            <div>
                                <Label>Email Body (HTML)</Label>
                                <Textarea
                                    value={formData.email_body}
                                    onChange={(e) => setFormData({...formData, email_body: e.target.value})}
                                    rows={8}
                                    placeholder="Leave empty to use default template"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Send SMS Notifications</Label>
                            <p className="text-xs text-slate-500">Requires phone numbers</p>
                        </div>
                        <Switch
                            checked={formData.send_sms}
                            onCheckedChange={(checked) => setFormData({...formData, send_sms: checked})}
                        />
                    </div>

                    {formData.send_sms && (
                        <div>
                            <Label>SMS Message (160 chars recommended)</Label>
                            <Textarea
                                value={formData.sms_message}
                                onChange={(e) => setFormData({...formData, sms_message: e.target.value})}
                                rows={3}
                                maxLength={320}
                            />
                            <p className="text-xs text-slate-500 mt-1">{formData.sms_message.length} characters</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Automatic Sending</Label>
                            <p className="text-xs text-slate-500">Auto-send on schedule</p>
                        </div>
                        <Switch
                            checked={formData.auto_send_enabled}
                            onCheckedChange={(checked) => setFormData({...formData, auto_send_enabled: checked})}
                        />
                    </div>

                    {formData.auto_send_enabled && (
                        <div>
                            <Label>Days Before Service</Label>
                            <Input
                                type="number"
                                value={formData.auto_send_days_before}
                                onChange={(e) => setFormData({...formData, auto_send_days_before: parseInt(e.target.value)})}
                                min={1}
                                max={30}
                            />
                            <p className="text-xs text-slate-500 mt-1">Notifications will be sent {formData.auto_send_days_before} days before the service</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Set as Default Template</Label>
                            <p className="text-xs text-slate-500">Use when no template specified</p>
                        </div>
                        <Switch
                            checked={formData.is_default}
                            onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600">Save Template</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}