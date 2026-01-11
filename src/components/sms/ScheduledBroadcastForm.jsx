import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Target } from 'lucide-react';

export default function ScheduledBroadcastForm({ onSave, onCancel }) {
    const [formData, setFormData] = useState({
        campaign_name: '',
        message_content: '',
        scheduled_date: '',
        segment_type: 'all',
        target_groups: [],
        target_keywords: []
    });
    const [groups, setGroups] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [estimatedRecipients, setEstimatedRecipients] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        calculateEstimatedRecipients();
    }, [formData.segment_type, formData.target_groups, formData.target_keywords]);

    const loadData = async () => {
        try {
            const [groupsData, keywordsData] = await Promise.all([
                base44.entities.ContactGroup.list(),
                base44.entities.TextKeyword.list()
            ]);
            setGroups(groupsData);
            setKeywords(keywordsData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const calculateEstimatedRecipients = async () => {
        try {
            let subscribers = await base44.entities.TextSubscriber.filter({ status: 'active' });
            
            if (formData.segment_type === 'groups' && formData.target_groups.length > 0) {
                subscribers = subscribers.filter(sub => 
                    formData.target_groups.some(groupId => sub.groups?.includes(groupId))
                );
            } else if (formData.segment_type === 'keywords' && formData.target_keywords.length > 0) {
                subscribers = subscribers.filter(sub => 
                    formData.target_keywords.includes(sub.subscribed_keyword)
                );
            }
            
            setEstimatedRecipients(subscribers.length);
        } catch (error) {
            console.error('Error calculating recipients:', error);
        }
    };

    const toggleGroup = (groupId) => {
        setFormData(prev => ({
            ...prev,
            target_groups: prev.target_groups.includes(groupId)
                ? prev.target_groups.filter(id => id !== groupId)
                : [...prev.target_groups, groupId]
        }));
    };

    const toggleKeyword = (keyword) => {
        setFormData(prev => ({
            ...prev,
            target_keywords: prev.target_keywords.includes(keyword)
                ? prev.target_keywords.filter(k => k !== keyword)
                : [...prev.target_keywords, keyword]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            total_recipients: estimatedRecipients
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Schedule SMS Broadcast
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>Campaign Name</Label>
                        <Input
                            value={formData.campaign_name}
                            onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                            placeholder="e.g., Sunday Service Reminder"
                            required
                        />
                    </div>

                    <div>
                        <Label>Message</Label>
                        <Textarea
                            value={formData.message_content}
                            onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                            placeholder="Your message here..."
                            rows={4}
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {formData.message_content.length} characters
                        </p>
                    </div>

                    <div>
                        <Label>Scheduled Date & Time</Label>
                        <Input
                            type="datetime-local"
                            value={formData.scheduled_date}
                            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                            min={new Date().toISOString().slice(0, 16)}
                            required
                        />
                    </div>

                    <div className="border-t pt-6">
                        <Label className="flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4" />
                            Audience Segmentation
                        </Label>
                        
                        <Select
                            value={formData.segment_type}
                            onValueChange={(value) => setFormData({ ...formData, segment_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Active Subscribers</SelectItem>
                                <SelectItem value="groups">Specific Groups</SelectItem>
                                <SelectItem value="keywords">By Keywords</SelectItem>
                            </SelectContent>
                        </Select>

                        {formData.segment_type === 'groups' && (
                            <div className="mt-4">
                                <Label className="mb-2">Select Groups</Label>
                                <div className="grid md:grid-cols-2 gap-2">
                                    {groups.map(group => (
                                        <button
                                            key={group.id}
                                            type="button"
                                            onClick={() => toggleGroup(group.id)}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                formData.target_groups.includes(group.id)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="font-medium">{group.group_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {group.member_count || 0} members
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData.segment_type === 'keywords' && (
                            <div className="mt-4">
                                <Label className="mb-2">Select Keywords</Label>
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map(kw => (
                                        <Badge
                                            key={kw.id}
                                            variant={formData.target_keywords.includes(kw.keyword) ? 'default' : 'outline'}
                                            className="cursor-pointer"
                                            onClick={() => toggleKeyword(kw.keyword)}
                                        >
                                            {kw.keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="font-semibold text-blue-900">Estimated Recipients</p>
                            <p className="text-2xl font-bold text-blue-600">{estimatedRecipients}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Schedule Broadcast
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}