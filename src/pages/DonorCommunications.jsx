import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Mail, Send, Users, Filter, Plus, Loader2, 
    MessageSquare, Calendar, Heart, Info, CheckCircle,
    FileText, TrendingUp, AlertCircle
} from "lucide-react";
import DonorSegmentBuilder from "../components/donors/DonorSegmentBuilder";
import MessageTemplateSelector from "../components/donors/MessageTemplateSelector";

export default function DonorCommunicationsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewCampaign, setShowNewCampaign] = useState(false);
    const [isSending, setIsSending] = useState(null);
    const [previewRecipients, setPreviewRecipients] = useState([]);
    const [newCampaign, setNewCampaign] = useState({
        campaign_name: '',
        communication_type: 'ministry_update',
        channel: 'email',
        subject: '',
        message_body: '',
        segment_criteria: {}
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const allCampaigns = await base44.entities.DonorCommunication.list('-created_date');
            setCampaigns(allCampaigns);
        } catch (error) {
            console.error("Failed to load campaigns:", error);
        }
        setIsLoading(false);
    };

    const handlePreviewRecipients = async () => {
        try {
            const allDonations = await base44.entities.Donation.list('-donation_date', 10000);
            let filtered = allDonations;
            const criteria = newCampaign.segment_criteria;

            if (criteria.donation_types?.length > 0) {
                filtered = filtered.filter(d => criteria.donation_types.includes(d.donation_type));
            }

            if (criteria.min_donation_amount) {
                filtered = filtered.filter(d => d.amount >= criteria.min_donation_amount);
            }

            if (criteria.donation_date_from) {
                filtered = filtered.filter(d => d.donation_date >= criteria.donation_date_from);
            }

            if (criteria.donation_date_to) {
                filtered = filtered.filter(d => d.donation_date <= criteria.donation_date_to);
            }

            if (criteria.recurring_donors_only) {
                filtered = filtered.filter(d => d.recurring === true);
            }

            const donorMap = {};
            filtered.forEach(d => {
                const key = d.donor_email.toLowerCase();
                if (!donorMap[key]) {
                    donorMap[key] = {
                        name: d.donor_name,
                        email: d.donor_email,
                        phone: d.donor_phone,
                        count: 0
                    };
                }
                donorMap[key].count++;
            });

            if (criteria.first_time_donors_only) {
                Object.keys(donorMap).forEach(key => {
                    if (donorMap[key].count > 1) delete donorMap[key];
                });
            }

            setPreviewRecipients(Object.values(donorMap));
        } catch (error) {
            console.error("Failed to preview recipients:", error);
            alert("Failed to preview recipients");
        }
    };

    const handleCreateCampaign = async () => {
        if (!newCampaign.campaign_name || !newCampaign.message_body) {
            alert("Please fill in campaign name and message");
            return;
        }

        try {
            await base44.entities.DonorCommunication.create({
                ...newCampaign,
                created_by: (await base44.auth.me()).email,
                status: 'draft'
            });

            alert("Campaign created successfully!");
            setShowNewCampaign(false);
            setNewCampaign({
                campaign_name: '',
                communication_type: 'ministry_update',
                channel: 'email',
                subject: '',
                message_body: '',
                segment_criteria: {}
            });
            setPreviewRecipients([]);
            loadData();
        } catch (error) {
            console.error("Failed to create campaign:", error);
            alert("Failed to create campaign");
        }
    };

    const handleSendCampaign = async (campaignId) => {
        if (!confirm("Send this campaign now? This cannot be undone.")) return;

        setIsSending(campaignId);
        try {
            const response = await base44.functions.invoke('sendDonorCommunication', {
                campaign_id: campaignId
            });

            if (response.data?.success) {
                alert(`Campaign sent! ${response.data.sent} sent, ${response.data.failed} failed.`);
                loadData();
            }
        } catch (error) {
            console.error("Failed to send campaign:", error);
            alert("Failed to send campaign");
        }
        setIsSending(null);
    };

    const statusColors = {
        draft: 'bg-slate-100 text-slate-800',
        scheduled: 'bg-blue-100 text-blue-800',
        sending: 'bg-yellow-100 text-yellow-800',
        sent: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800'
    };

    const typeIcons = {
        event_invitation: Calendar,
        ministry_update: Heart,
        urgent_appeal: AlertCircle,
        thank_you: Heart,
        newsletter: FileText,
        volunteer_request: Users,
        custom: MessageSquare
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Mail className="w-8 h-8 text-blue-600" />
                            Donor Communications
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Send targeted messages to donor segments based on giving history
                        </p>
                    </div>
                    <Button onClick={() => setShowNewCampaign(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" />
                        New Campaign
                    </Button>
                </div>

                {showNewCampaign && (
                    <Card className="shadow-lg border-2 border-blue-200">
                        <CardHeader>
                            <CardTitle>Create New Campaign</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Campaign Name *</Label>
                                    <Input
                                        value={newCampaign.campaign_name}
                                        onChange={(e) => setNewCampaign({...newCampaign, campaign_name: e.target.value})}
                                        placeholder="e.g., Q1 Missions Appeal"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Communication Type</Label>
                                    <Select
                                        value={newCampaign.communication_type}
                                        onValueChange={(value) => setNewCampaign({...newCampaign, communication_type: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="event_invitation">Event Invitation</SelectItem>
                                            <SelectItem value="ministry_update">Ministry Update</SelectItem>
                                            <SelectItem value="urgent_appeal">Urgent Appeal</SelectItem>
                                            <SelectItem value="thank_you">Thank You</SelectItem>
                                            <SelectItem value="newsletter">Newsletter</SelectItem>
                                            <SelectItem value="volunteer_request">Volunteer Request</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Channel</Label>
                                <Select
                                    value={newCampaign.channel}
                                    onValueChange={(value) => setNewCampaign({...newCampaign, channel: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email Only</SelectItem>
                                        <SelectItem value="sms">SMS Only</SelectItem>
                                        <SelectItem value="both">Email + SMS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(newCampaign.channel === 'email' || newCampaign.channel === 'both') && (
                                <div className="space-y-2">
                                    <Label>Email Subject *</Label>
                                    <Input
                                        value={newCampaign.subject}
                                        onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                                        placeholder="Available tags: {donor_name}, {church_name}"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Message *</Label>
                                <Textarea
                                    value={newCampaign.message_body}
                                    onChange={(e) => setNewCampaign({...newCampaign, message_body: e.target.value})}
                                    rows={8}
                                    placeholder="Available tags: {donor_name}, {church_name}, {member_status}, {total_donated}, {donation_count}, {last_donation_date}"
                                />
                                <p className="text-xs text-slate-500">
                                    Use personalization tags to customize messages for each recipient
                                </p>
                            </div>

                            <DonorSegmentBuilder
                                criteria={newCampaign.segment_criteria}
                                onChange={(criteria) => setNewCampaign({...newCampaign, segment_criteria: criteria})}
                            />

                            <div className="flex gap-3 pt-4 border-t">
                                <Button 
                                    onClick={handlePreviewRecipients} 
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Preview Recipients ({previewRecipients.length})
                                </Button>
                                <Button onClick={handleCreateCampaign} className="flex-1 bg-green-600 hover:bg-green-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Campaign
                                </Button>
                                <Button onClick={() => {
                                    setShowNewCampaign(false);
                                    setPreviewRecipients([]);
                                }} variant="outline">
                                    Cancel
                                </Button>
                            </div>

                            {previewRecipients.length > 0 && (
                                <Alert className="bg-blue-50 border-blue-200">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    <AlertDescription>
                                        <p className="font-semibold text-blue-900 mb-2">
                                            {previewRecipients.length} Recipients Found
                                        </p>
                                        <div className="text-sm text-blue-800 max-h-32 overflow-y-auto">
                                            {previewRecipients.slice(0, 10).map((r, i) => (
                                                <div key={i}>• {r.name} ({r.email})</div>
                                            ))}
                                            {previewRecipients.length > 10 && (
                                                <p className="mt-2 font-semibold">...and {previewRecipients.length - 10} more</p>
                                            )}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="campaigns" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
                        <TabsTrigger value="templates">Message Templates</TabsTrigger>
                    </TabsList>

                    <TabsContent value="campaigns">
                        <div className="grid gap-4">
                            {isLoading ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                                        <p className="text-slate-600">Loading campaigns...</p>
                                    </CardContent>
                                </Card>
                            ) : campaigns.length === 0 ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-600 mb-2">No campaigns yet</p>
                                        <p className="text-sm text-slate-500">Create your first donor communication campaign</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                campaigns.map(campaign => {
                                    const Icon = typeIcons[campaign.communication_type] || MessageSquare;
                                    return (
                                        <Card key={campaign.id} className="hover:shadow-lg transition-all">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-4 flex-1">
                                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <Icon className="w-6 h-6 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg mb-1">{campaign.campaign_name}</h3>
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                <Badge className={statusColors[campaign.status]}>
                                                                    {campaign.status}
                                                                </Badge>
                                                                <Badge variant="outline">
                                                                    {campaign.channel}
                                                                </Badge>
                                                                <Badge variant="outline" className="capitalize">
                                                                    {campaign.communication_type.replace(/_/g, ' ')}
                                                                </Badge>
                                                            </div>
                                                            {campaign.status === 'sent' && (
                                                                <div className="flex gap-4 text-sm text-slate-600">
                                                                    <span>✓ {campaign.sent_count} sent</span>
                                                                    <span>✗ {campaign.failed_count} failed</span>
                                                                    <span>Total: {campaign.total_recipients} recipients</span>
                                                                </div>
                                                            )}
                                                            {campaign.sent_date && (
                                                                <p className="text-sm text-slate-500 mt-1">
                                                                    Sent: {new Date(campaign.sent_date).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {campaign.status === 'draft' && (
                                                        <Button
                                                            onClick={() => handleSendCampaign(campaign.id)}
                                                            disabled={isSending === campaign.id}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            {isSending === campaign.id ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    Sending...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="w-4 h-4 mr-2" />
                                                                    Send Now
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="templates">
                        <MessageTemplateSelector
                            onTemplateSelected={(template) => {
                                setNewCampaign({
                                    ...newCampaign,
                                    subject: template.subject || '',
                                    message_body: template.message_body || ''
                                });
                                setShowNewCampaign(true);
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}