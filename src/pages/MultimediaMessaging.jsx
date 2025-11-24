
import React, { useState, useEffect } from "react";
import { MMSCampaign } from "@/entities/MMSCampaign";
import { MMSSlide } from "@/entities/MMSSlide";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Image, Video, Mail, MessageSquare, Eye, TrendingUp, Sparkles, Copy, ExternalLink, Link as LinkIcon, QrCode, Edit, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import QRCodeGenerator from "../components/links/QRCodeGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import FeatureGate from "../components/subscription/FeatureGate";
import { useSubscription } from "../components/subscription/useSubscription";

export default function MultimediaMessagingPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const { canUseMMS, getMMSRemaining, hasFeature, loading: subscriptionLoading } = useSubscription();

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setIsLoading(true);
        const campaignList = await MMSCampaign.list("-created_date");
        setCampaigns(campaignList);
        setIsLoading(false);
    };

    const copyLink = (link, e) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(link);
        alert("✅ Link copied to clipboard!");
    };

    const openShareDialog = (campaign, e) => {
        if (e) e.stopPropagation();
        setSelectedCampaign(campaign);
        setShareDialogOpen(true);
    };

    const handleEdit = (campaign, e) => {
        if (e) e.stopPropagation();
        navigate(createPageUrl('EditMMSCampaign') + `?id=${campaign.id}`);
    };

    const stats = {
        totalCampaigns: campaigns.length,
        sentCampaigns: campaigns.filter(c => c.status === 'sent').length,
        totalRecipients: campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0),
        avgOpenRate: campaigns.length > 0 
            ? Math.round((campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0) / campaigns.reduce((sum, c) => sum + (c.total_recipients || 1), 0)) * 100)
            : 0
    };

    const statusColors = {
        draft: "bg-gray-100 text-gray-800",
        scheduled: "bg-blue-100 text-blue-800",
        sent: "bg-green-100 text-green-800",
        archived: "bg-slate-100 text-slate-800"
    };

    const typeColors = {
        announcement: "bg-blue-100 text-blue-800",
        event_promo: "bg-purple-100 text-purple-800",
        giving_appeal: "bg-green-100 text-green-800",
        ministry_update: "bg-indigo-100 text-indigo-800",
        holiday_greeting: "bg-pink-100 text-pink-800",
        custom: "bg-slate-100 text-slate-800"
    };

    return (
        <FeatureGate 
            feature="mms_enabled"
            featureName="Multimedia Messaging"
            requiredPlan="Growth"
        >
            <div className="p-6 bg-gradient-to-br from-slate-50 to-purple-50/30 min-h-screen">
                {/* Header with Premium Badge */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">Multimedia Messaging</h1>
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                <Sparkles className="w-3 h-3 mr-1" />
                                PREMIUM
                            </Badge>
                        </div>
                        <p className="text-slate-600">Create stunning multimedia campaigns with slides, images, videos & CTAs</p>
                        {!subscriptionLoading && (
                            <div className="mt-2">
                                <Badge className="bg-purple-100 text-purple-800">
                                    {getMMSRemaining() === 999999 ? '∞ Unlimited Campaigns' : `${getMMSRemaining()} campaigns remaining this month`}
                                </Badge>
                            </div>
                        )}
                    </div>
                    <Button 
                        onClick={() => navigate(createPageUrl('CreateMMSCampaign'))}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Campaign
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Campaigns</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.totalCampaigns}</p>
                                </div>
                                <Image className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Sent Campaigns</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.sentCampaigns}</p>
                                </div>
                                <MessageSquare className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Reach</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.totalRecipients}</p>
                                </div>
                                <Eye className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Avg Open Rate</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.avgOpenRate}%</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Campaigns Tabs */}
                <Tabs defaultValue="all" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all">All Campaigns</TabsTrigger>
                        <TabsTrigger value="drafts">Drafts</TabsTrigger>
                        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                        <TabsTrigger value="sent">Sent</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>All Campaigns ({campaigns.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {campaigns.map(campaign => (
                                        <div 
                                            key={campaign.id} 
                                            className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors duration-200"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-slate-900">{campaign.title}</h3>
                                                <div className="flex gap-2 flex-wrap">
                                                    <Badge className={typeColors[campaign.campaign_type] || 'bg-gray-100 text-gray-800'}>
                                                        {campaign.campaign_type?.replace('_', ' ')}
                                                    </Badge>
                                                    <Badge className={statusColors[campaign.status]}>
                                                        {campaign.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1 text-sm text-slate-600 mb-3">
                                                {campaign.created_date && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>Created {format(new Date(campaign.created_date), 'MMM d, yyyy')}</span>
                                                    </div>
                                                )}
                                                {campaign.sent_date && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>Sent {format(new Date(campaign.sent_date), 'MMM d, yyyy • h:mm a')}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    {campaign.delivery_method?.includes('sms_mms') && (
                                                        <MessageSquare className="w-4 h-4" />
                                                    )}
                                                    {campaign.delivery_method?.includes('email') && (
                                                        <Mail className="w-4 h-4" />
                                                    )}
                                                    {campaign.delivery_method?.includes('in_app') && (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                    <span>{campaign.delivery_method?.join(', ')}</span>
                                                </div>
                                                {(campaign.total_recipients > 0 || campaign.opened_count > 0) && (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        <span>
                                                            {campaign.total_recipients > 0 && `${campaign.total_recipients} recipients`}
                                                            {campaign.opened_count > 0 && ` • ${campaign.opened_count} views`}
                                                            {campaign.click_through_count > 0 && ` • ${campaign.click_through_count} clicks`}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* ALWAYS show link section */}
                                                <div className="bg-purple-50 p-3 rounded-lg mt-2 border border-purple-200">
                                                    <div className="flex items-start gap-2">
                                                        <LinkIcon className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-purple-900 mb-1">Shareable Link:</p>
                                                            {campaign.public_link ? (
                                                                <a 
                                                                    href={campaign.public_link} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-purple-700 hover:text-purple-800 hover:underline font-mono text-xs break-all"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {campaign.public_link}
                                                                </a>
                                                            ) : (
                                                                <p className="text-purple-600 text-xs italic">Link will be generated when campaign is saved</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button variant="outline" size="sm" onClick={(e) => handleEdit(campaign, e)}>
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Edit
                                                </Button>
                                                
                                                {campaign.public_link && (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={(e) => copyLink(campaign.public_link, e)}
                                                            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                                        >
                                                            <Copy className="w-4 h-4 mr-1" />
                                                            Copy Link
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(campaign.public_link, '_blank');
                                                            }}
                                                        >
                                                            <ExternalLink className="w-4 h-4 mr-1" />
                                                            Preview
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={(e) => openShareDialog(campaign, e)}
                                                            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                                        >
                                                            <QrCode className="w-4 h-4 mr-1" />
                                                            QR Code
                                                        </Button>
                                                    </>
                                                )}
                                            </div>

                                            {campaign.description && (
                                                <p className="text-sm text-slate-700 mt-2">{campaign.description}</p>
                                            )}
                                        </div>
                                    ))}
                                    {campaigns.length === 0 && (
                                        <div className="text-center py-12 text-slate-500">
                                            <Video className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                            <p className="text-lg mb-2">No campaigns yet</p>
                                            <p className="text-sm mb-4">Create your first multimedia campaign to engage your community</p>
                                            <Button 
                                                onClick={() => navigate(createPageUrl('CreateMMSCampaign'))}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create First Campaign
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Other tabs with filtered content */}
                    {['drafts', 'scheduled', 'sent'].map(status => (
                        <TabsContent key={status} value={status}>
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="capitalize">{status} Campaigns</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {campaigns.filter(c => c.status === status.replace('drafts', 'draft')).map(campaign => (
                                            <div 
                                                key={campaign.id} 
                                                className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors duration-200"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-slate-900">{campaign.title}</h3>
                                                    <div className="flex gap-2">
                                                        <Badge className={typeColors[campaign.campaign_type] || 'bg-gray-100 text-gray-800'}>
                                                            {campaign.campaign_type?.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1 text-sm text-slate-600 mb-3">
                                                    {campaign.created_date && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Created {format(new Date(campaign.created_date), 'MMM d, yyyy')}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        {campaign.delivery_method?.includes('sms_mms') && <MessageSquare className="w-4 h-4" />}
                                                        {campaign.delivery_method?.includes('email') && <Mail className="w-4 h-4" />}
                                                        {campaign.delivery_method?.includes('in_app') && <Eye className="w-4 h-4" />}
                                                        <span>{campaign.delivery_method?.join(', ')}</span>
                                                    </div>
                                                    
                                                    {/* ALWAYS show link section */}
                                                    <div className="bg-purple-50 p-3 rounded-lg mt-2 border border-purple-200">
                                                        <div className="flex items-start gap-2">
                                                            <LinkIcon className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-purple-900 mb-1">Shareable Link:</p>
                                                                {campaign.public_link ? (
                                                                    <a 
                                                                        href={campaign.public_link} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="text-purple-700 hover:text-purple-800 hover:underline font-mono text-xs break-all"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        {campaign.public_link}
                                                                    </a>
                                                                ) : (
                                                                    <p className="text-purple-600 text-xs italic">Link will be generated when campaign is saved</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button variant="outline" size="sm" onClick={(e) => handleEdit(campaign, e)}>
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    
                                                    {campaign.public_link && (
                                                        <>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={(e) => copyLink(campaign.public_link, e)}
                                                                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                                            >
                                                                <Copy className="w-4 h-4 mr-1" />
                                                                Copy Link
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(campaign.public_link, '_blank');
                                                                }}
                                                            >
                                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                                Preview
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={(e) => openShareDialog(campaign, e)}
                                                                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                                            >
                                                                <QrCode className="w-4 h-4 mr-1" />
                                                                QR Code
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>

                                                {campaign.description && (
                                                    <p className="text-sm text-slate-700 mt-2">{campaign.description}</p>
                                                )}
                                            </div>
                                        ))}
                                        {campaigns.filter(c => c.status === status.replace('drafts', 'draft')).length === 0 && (
                                            <div className="text-center py-8 text-slate-500">
                                                <p>No {status} campaigns</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* QR Code Share Dialog */}
            {selectedCampaign && (
                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Share Campaign: {selectedCampaign.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Shareable Link</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={selectedCampaign.public_link} 
                                        readOnly 
                                        className="font-mono text-sm"
                                    />
                                    <Button onClick={(e) => copyLink(selectedCampaign.public_link, e)}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(selectedCampaign.public_link, '_blank');
                                        }}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Preview
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Anyone with this link can view the campaign and interact with call-to-action buttons
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <QRCodeGenerator
                                        url={selectedCampaign.public_link}
                                        label="Campaign QR Code"
                                        filename={`mms-${selectedCampaign.title.replace(/\s+/g, '-').toLowerCase()}`}
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        📱 Scan with phone to view and interact
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-slate-900">Sharing Ideas:</h4>
                                    <ul className="text-sm text-slate-600 space-y-2">
                                        <li>📱 <strong>SMS:</strong> Text link to members</li>
                                        <li>📧 <strong>Email:</strong> Include in newsletters</li>
                                        <li>🌐 <strong>Website:</strong> Embed on your site</li>
                                        <li>📄 <strong>Print QR:</strong> On bulletins/posters</li>
                                        <li>📺 <strong>Screens:</strong> Display during services</li>
                                        <li>💬 <strong>Social:</strong> Share on Facebook/Instagram</li>
                                        <li>🎯 <strong>CTAs:</strong> Viewers can register, donate, RSVP</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2">📊 Campaign Analytics</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-blue-600">Views</p>
                                        <p className="text-2xl font-bold text-blue-900">{selectedCampaign.opened_count || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-600">CTA Clicks</p>
                                        <p className="text-2xl font-bold text-blue-900">{selectedCampaign.click_through_count || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-600">Recipients</p>
                                        <p className="text-2xl font-bold text-blue-900">{selectedCampaign.total_recipients || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </FeatureGate>
    );
}
