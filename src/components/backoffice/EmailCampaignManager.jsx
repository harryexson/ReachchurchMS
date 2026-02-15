import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Plus, Send, BarChart3, Eye, MousePointer, Calendar, PlayCircle, PauseCircle } from 'lucide-react';

export default function EmailCampaignManager() {
    const [templates, setTemplates] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [templateForm, setTemplateForm] = useState({
        name: '',
        subject: '',
        body_html: '',
        body_text: '',
        category: 'promotional',
        variables: [],
        is_active: true
    });

    const [campaignForm, setCampaignForm] = useState({
        name: '',
        template_id: '',
        trigger_type: 'manual',
        target_audience: 'all_subscribers',
        target_tier: '',
        schedule_date: '',
        status: 'draft'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            const [templatesData, campaignsData] = await Promise.all([
                base44.entities.EmailTemplate.list('-created_date'),
                base44.entities.EmailCampaign.list('-created_date')
            ]);
            
            setTemplates(templatesData);
            setCampaigns(campaignsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        try {
            await base44.entities.EmailTemplate.create({
                ...templateForm,
                created_by: currentUser.email
            });
            
            await loadData();
            setShowTemplateModal(false);
            alert('Template created successfully!');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template');
        }
    };

    const handleSaveCampaign = async () => {
        try {
            await base44.entities.EmailCampaign.create({
                ...campaignForm,
                created_by: currentUser.email
            });
            
            await loadData();
            setShowCampaignModal(false);
            alert('Campaign created successfully!');
        } catch (error) {
            console.error('Error saving campaign:', error);
            alert('Failed to save campaign');
        }
    };

    const handleSendCampaign = async (campaign) => {
        if (!confirm('Are you sure you want to send this campaign?')) return;
        
        try {
            await base44.functions.invoke('sendEmailCampaign', {
                campaign_id: campaign.id
            });
            
            await loadData();
            alert('Campaign is being sent!');
        } catch (error) {
            console.error('Error sending campaign:', error);
            alert('Failed to send campaign');
        }
    };

    const getCampaignStats = (campaign) => {
        const openRate = campaign.emails_sent > 0 
            ? ((campaign.unique_opens / campaign.emails_sent) * 100).toFixed(1)
            : 0;
        const clickRate = campaign.emails_sent > 0 
            ? ((campaign.unique_clicks / campaign.emails_sent) * 100).toFixed(1)
            : 0;
        
        return { openRate, clickRate };
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="campaigns">
                <TabsList>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Send className="w-5 h-5" />
                                Email Campaigns ({campaigns.length})
                            </CardTitle>
                            <Button onClick={() => {
                                setCampaignForm({
                                    name: '',
                                    template_id: '',
                                    trigger_type: 'manual',
                                    target_audience: 'all_subscribers',
                                    target_tier: '',
                                    schedule_date: '',
                                    status: 'draft'
                                });
                                setShowCampaignModal(true);
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Campaign
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {campaigns.map(campaign => {
                                    const stats = getCampaignStats(campaign);
                                    return (
                                        <Card key={campaign.id} className="border-2">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{campaign.name}</h3>
                                                        <p className="text-sm text-slate-600">
                                                            {campaign.trigger_type.replace('_', ' ')} • {campaign.target_audience.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                    <Badge variant={
                                                        campaign.status === 'sent' ? 'default' :
                                                        campaign.status === 'sending' ? 'secondary' :
                                                        campaign.status === 'scheduled' ? 'outline' : 'secondary'
                                                    }>
                                                        {campaign.status}
                                                    </Badge>
                                                </div>

                                                {campaign.status === 'sent' && (
                                                    <div className="grid grid-cols-4 gap-4 mb-3">
                                                        <div className="text-center p-2 bg-blue-50 rounded">
                                                            <Mail className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                                                            <p className="text-2xl font-bold">{campaign.emails_sent}</p>
                                                            <p className="text-xs text-slate-600">Sent</p>
                                                        </div>
                                                        <div className="text-center p-2 bg-green-50 rounded">
                                                            <Eye className="w-4 h-4 mx-auto mb-1 text-green-600" />
                                                            <p className="text-2xl font-bold">{stats.openRate}%</p>
                                                            <p className="text-xs text-slate-600">Open Rate</p>
                                                        </div>
                                                        <div className="text-center p-2 bg-purple-50 rounded">
                                                            <MousePointer className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                                                            <p className="text-2xl font-bold">{stats.clickRate}%</p>
                                                            <p className="text-xs text-slate-600">Click Rate</p>
                                                        </div>
                                                        <div className="text-center p-2 bg-red-50 rounded">
                                                            <Mail className="w-4 h-4 mx-auto mb-1 text-red-600" />
                                                            <p className="text-2xl font-bold">{campaign.emails_failed}</p>
                                                            <p className="text-xs text-slate-600">Failed</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    {campaign.status === 'draft' && (
                                                        <Button size="sm" onClick={() => handleSendCampaign(campaign)}>
                                                            <Send className="w-3 h-3 mr-1" />
                                                            Send Now
                                                        </Button>
                                                    )}
                                                    {campaign.status === 'scheduled' && (
                                                        <Badge variant="outline">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {new Date(campaign.schedule_date).toLocaleString()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                                {campaigns.length === 0 && (
                                    <p className="text-center text-slate-500 py-8">No campaigns yet. Create one to get started!</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="templates">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                Email Templates ({templates.length})
                            </CardTitle>
                            <Button onClick={() => {
                                setTemplateForm({
                                    name: '',
                                    subject: '',
                                    body_html: '',
                                    body_text: '',
                                    category: 'promotional',
                                    variables: [],
                                    is_active: true
                                });
                                setShowTemplateModal(true);
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Template
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {templates.map(template => (
                                    <Card key={template.id} className="border-2">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold">{template.name}</h3>
                                                <Badge variant={template.is_active ? "default" : "secondary"}>
                                                    {template.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{template.subject}</p>
                                            <Badge variant="outline" className="capitalize">
                                                {template.category.replace('_', ' ')}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Template Modal */}
            <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create Email Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                            <Label>Template Name *</Label>
                            <Input
                                value={templateForm.name}
                                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                                placeholder="Trial Expiry Reminder"
                            />
                        </div>
                        <div>
                            <Label>Category *</Label>
                            <Select
                                value={templateForm.category}
                                onValueChange={(value) => setTemplateForm({...templateForm, category: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trial_expiry">Trial Expiry</SelectItem>
                                    <SelectItem value="plan_upgrade">Plan Upgrade</SelectItem>
                                    <SelectItem value="onboarding">Onboarding</SelectItem>
                                    <SelectItem value="engagement">Engagement</SelectItem>
                                    <SelectItem value="promotional">Promotional</SelectItem>
                                    <SelectItem value="transactional">Transactional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Subject Line *</Label>
                            <Input
                                value={templateForm.subject}
                                onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                                placeholder="Your trial expires in 3 days - {{church_name}}"
                            />
                            <p className="text-xs text-slate-500 mt-1">Use {`{{variable_name}}`} for personalization</p>
                        </div>
                        <div>
                            <Label>HTML Body *</Label>
                            <Textarea
                                value={templateForm.body_html}
                                onChange={(e) => setTemplateForm({...templateForm, body_html: e.target.value})}
                                placeholder="<p>Hi {{church_name}},</p><p>Your trial expires on {{trial_end_date}}...</p>"
                                rows={8}
                            />
                        </div>
                        <div>
                            <Label>Plain Text Body</Label>
                            <Textarea
                                value={templateForm.body_text}
                                onChange={(e) => setTemplateForm({...templateForm, body_text: e.target.value})}
                                placeholder="Plain text version for email clients that don't support HTML"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveTemplate}>Create Template</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Campaign Modal */}
            <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Email Campaign</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Campaign Name *</Label>
                            <Input
                                value={campaignForm.name}
                                onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                                placeholder="Q1 2026 Trial Conversion"
                            />
                        </div>
                        <div>
                            <Label>Email Template *</Label>
                            <Select
                                value={campaignForm.template_id}
                                onValueChange={(value) => setCampaignForm({...campaignForm, template_id: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.filter(t => t.is_active).map(template => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Trigger Type *</Label>
                            <Select
                                value={campaignForm.trigger_type}
                                onValueChange={(value) => setCampaignForm({...campaignForm, trigger_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manual Send</SelectItem>
                                    <SelectItem value="trial_expiring">Trial Expiring (3 days before)</SelectItem>
                                    <SelectItem value="trial_expired">Trial Expired</SelectItem>
                                    <SelectItem value="plan_upgrade_eligible">Plan Upgrade Eligible</SelectItem>
                                    <SelectItem value="inactive_user">Inactive User</SelectItem>
                                    <SelectItem value="scheduled">Scheduled Date</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Target Audience *</Label>
                            <Select
                                value={campaignForm.target_audience}
                                onValueChange={(value) => setCampaignForm({...campaignForm, target_audience: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_subscribers">All Subscribers</SelectItem>
                                    <SelectItem value="trial_users">Trial Users</SelectItem>
                                    <SelectItem value="active_subscribers">Active Subscribers</SelectItem>
                                    <SelectItem value="specific_tier">Specific Tier</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {campaignForm.target_audience === 'specific_tier' && (
                            <div>
                                <Label>Subscription Tier</Label>
                                <Select
                                    value={campaignForm.target_tier}
                                    onValueChange={(value) => setCampaignForm({...campaignForm, target_tier: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="starter">Starter</SelectItem>
                                        <SelectItem value="growth">Growth</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {campaignForm.trigger_type === 'scheduled' && (
                            <div>
                                <Label>Schedule Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={campaignForm.schedule_date}
                                    onChange={(e) => setCampaignForm({...campaignForm, schedule_date: e.target.value})}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCampaignModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveCampaign}>Create Campaign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}