import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Send, Plus, Calendar, BarChart3, TrendingUp, 
    Users, MessageSquare, Loader2, Target, Edit, Trash2
} from "lucide-react";

export default function SMSCampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    
    const [formData, setFormData] = useState({
        campaign_name: '',
        keyword: '',
        message: '',
        target_groups: [],
        schedule_type: 'immediate',
        scheduled_date: '',
        recurring_pattern: 'none',
        status: 'draft'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [campaignsData, analyticsData, keywordsData, subscribers] = await Promise.all([
                base44.entities.SMSCampaign.list('-created_date'),
                base44.entities.SMSAnalytics.list('-date', 30),
                base44.entities.TextKeyword.list(),
                base44.entities.TextSubscriber.filter({ status: 'active' })
            ]);

            setCampaigns(campaignsData);
            setAnalytics(analyticsData);
            setKeywords(keywordsData);

            // Extract unique groups
            const uniqueGroups = [...new Set(subscribers.flatMap(s => s.groups || []))];
            setGroups(uniqueGroups);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCampaign) {
                await base44.entities.SMSCampaign.update(editingCampaign.id, formData);
            } else {
                await base44.entities.SMSCampaign.create(formData);
            }
            
            setShowForm(false);
            setEditingCampaign(null);
            setFormData({
                campaign_name: '',
                keyword: '',
                message: '',
                target_groups: [],
                schedule_type: 'immediate',
                scheduled_date: '',
                recurring_pattern: 'none',
                status: 'draft'
            });
            loadData();
        } catch (error) {
            alert('Failed to save campaign: ' + error.message);
        }
    };

    const sendCampaign = async (campaignId) => {
        if (!confirm('Send this campaign now?')) return;
        
        setSending(true);
        try {
            await base44.functions.invoke('sendScheduledCampaign', { campaign_id: campaignId });
            alert('Campaign sent successfully!');
            loadData();
        } catch (error) {
            alert('Failed to send campaign: ' + error.message);
        }
        setSending(false);
    };

    const deleteCampaign = async (id) => {
        if (!confirm('Delete this campaign?')) return;
        try {
            await base44.entities.SMSCampaign.delete(id);
            loadData();
        } catch (error) {
            alert('Failed to delete: ' + error.message);
        }
    };

    const editCampaign = (campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            campaign_name: campaign.campaign_name,
            keyword: campaign.keyword || '',
            message: campaign.message,
            target_groups: campaign.target_groups || [],
            schedule_type: campaign.schedule_type || 'immediate',
            scheduled_date: campaign.scheduled_date || '',
            recurring_pattern: campaign.recurring_pattern || 'none',
            status: campaign.status
        });
        setShowForm(true);
    };

    // Calculate analytics
    const totalMessagesSent = analytics.reduce((sum, a) => sum + (a.messages_sent || 0), 0);
    const totalMessagesReceived = analytics.reduce((sum, a) => sum + (a.messages_received || 0), 0);
    const totalNewSubscribers = analytics.reduce((sum, a) => sum + (a.new_subscribers || 0), 0);
    const totalOptOuts = analytics.reduce((sum, a) => sum + (a.opt_outs || 0), 0);

    // Keyword usage stats
    const keywordUsage = keywords.map(k => ({
        keyword: k.keyword,
        count: k.usage_count || 0
    })).sort((a, b) => b.count - a.count);

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">SMS Campaigns</h1>
                        <p className="text-slate-600 mt-1">Create, schedule, and track SMS campaigns</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </div>

                {/* Analytics Overview */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Messages Sent</p>
                                    <p className="text-2xl font-bold text-slate-900">{totalMessagesSent}</p>
                                </div>
                                <Send className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Messages Received</p>
                                    <p className="text-2xl font-bold text-slate-900">{totalMessagesReceived}</p>
                                </div>
                                <MessageSquare className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">New Subscribers</p>
                                    <p className="text-2xl font-bold text-slate-900">{totalNewSubscribers}</p>
                                </div>
                                <Users className="w-8 h-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Campaigns</p>
                                    <p className="text-2xl font-bold text-slate-900">{campaigns.length}</p>
                                </div>
                                <Target className="w-8 h-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Campaign Form */}
                {showForm && (
                    <Card className="border-2 border-blue-200">
                        <CardHeader>
                            <CardTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Campaign Name</label>
                                    <Input
                                        value={formData.campaign_name}
                                        onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Keyword (Optional)</label>
                                    <Select value={formData.keyword} onValueChange={(value) => setFormData({...formData, keyword: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select keyword" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>None</SelectItem>
                                            {keywords.map(k => (
                                                <SelectItem key={k.id} value={k.keyword}>{k.keyword}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Message</label>
                                    <Textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        rows={4}
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">{formData.message.length} characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Target Groups</label>
                                    <Select 
                                        value={formData.target_groups[0] || ''} 
                                        onValueChange={(value) => setFormData({...formData, target_groups: value ? [value] : []})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All subscribers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>All Subscribers</SelectItem>
                                            {groups.map(g => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <Button type="button" variant="outline" onClick={() => {
                                        setShowForm(false);
                                        setEditingCampaign(null);
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                        {editingCampaign ? 'Update' : 'Create'} Campaign
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs */}
                <Tabs defaultValue="campaigns" className="w-full">
                    <TabsList>
                        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="keywords">Keyword Performance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="campaigns" className="space-y-4">
                        {campaigns.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    No campaigns yet. Create your first campaign to get started!
                                </AlertDescription>
                            </Alert>
                        ) : (
                            campaigns.map(campaign => (
                                <Card key={campaign.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-lg">{campaign.campaign_name}</h3>
                                                    <Badge variant={
                                                        campaign.status === 'sent' ? 'default' :
                                                        campaign.status === 'scheduled' ? 'secondary' :
                                                        campaign.status === 'in_progress' ? 'secondary' :
                                                        'outline'
                                                    }>
                                                        {campaign.status}
                                                    </Badge>
                                                    {campaign.keyword && (
                                                        <Badge variant="outline">#{campaign.keyword}</Badge>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 mb-3">{campaign.message}</p>
                                                <div className="flex gap-4 text-sm text-slate-500">
                                                    <span>📊 Sent: {campaign.messages_sent || 0}</span>
                                                    <span>❌ Failed: {campaign.messages_failed || 0}</span>
                                                    <span>👥 Recipients: {campaign.total_recipients || 0}</span>
                                                    {campaign.sent_date && (
                                                        <span>📅 {new Date(campaign.sent_date).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {campaign.status === 'draft' && (
                                                    <>
                                                        <Button size="sm" variant="outline" onClick={() => editCampaign(campaign)}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => sendCampaign(campaign.id)}
                                                            disabled={sending}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Send className="w-4 h-4 mr-1" />
                                                            Send
                                                        </Button>
                                                    </>
                                                )}
                                                <Button size="sm" variant="outline" onClick={() => deleteCampaign(campaign.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="analytics">
                        <Card>
                            <CardHeader>
                                <CardTitle>30-Day Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-blue-600 font-semibold mb-1">Engagement Rate</p>
                                            <p className="text-3xl font-bold text-blue-900">
                                                {totalMessagesSent > 0 ? ((totalMessagesReceived / totalMessagesSent) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-green-600 font-semibold mb-1">Subscriber Growth</p>
                                            <p className="text-3xl font-bold text-green-900">
                                                +{totalNewSubscribers}
                                            </p>
                                        </div>
                                    </div>

                                    {analytics.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Daily Activity</h4>
                                            {analytics.slice(0, 10).map((day, idx) => (
                                                <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded">
                                                    <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                                                    <div className="flex gap-4 text-sm">
                                                        <span className="text-blue-600">📤 {day.messages_sent || 0}</span>
                                                        <span className="text-green-600">📥 {day.messages_received || 0}</span>
                                                        <span className="text-purple-600">👥 +{day.new_subscribers || 0}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="keywords">
                        <Card>
                            <CardHeader>
                                <CardTitle>Keyword Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {keywordUsage.length === 0 ? (
                                        <p className="text-slate-500">No keyword data yet</p>
                                    ) : (
                                        keywordUsage.map((kw, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-blue-600">#{kw.keyword}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-600">{kw.count} uses</span>
                                                    <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className="bg-blue-600 h-full" 
                                                            style={{ width: `${Math.min((kw.count / Math.max(...keywordUsage.map(k => k.count))) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}