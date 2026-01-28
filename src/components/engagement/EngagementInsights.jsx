import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    TrendingUp, TrendingDown, AlertCircle, Target, 
    RefreshCw, Sparkles, Calendar, DollarSign, Heart, Users 
} from "lucide-react";
import { toast } from "sonner";

export default function EngagementInsights({ memberId, memberName }) {
    const queryClient = useQueryClient();

    const { data: engagement, isLoading } = useQuery({
        queryKey: ['memberEngagement', memberId],
        queryFn: async () => {
            const results = await base44.entities.MemberEngagement.filter({ member_id: memberId });
            return results[0] || null;
        },
        enabled: !!memberId
    });

    const recalculateMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('calculateMemberEngagement', {
                member_id: memberId
            });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['memberEngagement', memberId]);
            toast.success('Engagement scores updated');
        }
    });

    const generateAIMessageMutation = useMutation({
        mutationFn: async () => {
            return await base44.functions.invoke('generateAIFollowUpMessage', {
                contact_id: memberId,
                contact_type: 'member',
                workflow_context: 'Member engagement check-in',
                step_purpose: 'Re-engage member based on current activity'
            });
        },
        onSuccess: (data) => {
            toast.success('AI message generated - check below!');
        }
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                </CardContent>
            </Card>
        );
    }

    if (!engagement) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Engagement Insights</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <Target className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="text-slate-600">No engagement data yet</p>
                    <Button 
                        onClick={() => recalculateMutation.mutate()}
                        disabled={recalculateMutation.isLoading}
                        className="bg-blue-600"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Calculate Engagement
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const levelColors = {
        high: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
        medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
        low: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
        at_risk: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };

    const levelColor = levelColors[engagement.engagement_level] || levelColors.medium;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Engagement Insights</CardTitle>
                            <p className="text-sm text-slate-500 mt-1">
                                Last updated: {new Date(engagement.last_calculated).toLocaleDateString()}
                            </p>
                        </div>
                        <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => recalculateMutation.mutate()}
                            disabled={recalculateMutation.isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 ${recalculateMutation.isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Overall Score */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">Overall Engagement</span>
                            <Badge className={`${levelColor.bg} ${levelColor.text}`}>
                                {engagement.engagement_level.replace('_', ' ').toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Progress value={engagement.engagement_score} className="flex-1" />
                            <span className="text-2xl font-bold text-slate-900">
                                {engagement.engagement_score}
                            </span>
                        </div>
                    </div>

                    {/* Detailed Scores */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                            <div className="text-2xl font-bold text-blue-900">{engagement.attendance_score}</div>
                            <div className="text-xs text-blue-600">Attendance</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
                            <div className="text-2xl font-bold text-green-900">{engagement.giving_score}</div>
                            <div className="text-xs text-green-600">Giving</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <Heart className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                            <div className="text-2xl font-bold text-purple-900">{engagement.involvement_score}</div>
                            <div className="text-xs text-purple-600">Involvement</div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between p-2 bg-slate-50 rounded">
                            <span className="text-slate-600">Services (90 days)</span>
                            <span className="font-semibold">{engagement.services_attended_90days}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-50 rounded">
                            <span className="text-slate-600">Donations (90 days)</span>
                            <span className="font-semibold">{engagement.donations_90days}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-50 rounded">
                            <span className="text-slate-600">Attendance Streak</span>
                            <span className="font-semibold">{engagement.attendance_streak} weeks</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-50 rounded">
                            <span className="text-slate-600">Last Attended</span>
                            <span className="font-semibold">
                                {engagement.last_attendance_date 
                                    ? new Date(engagement.last_attendance_date).toLocaleDateString()
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* AI Recommendations */}
                    {engagement.recommended_actions && engagement.recommended_actions.length > 0 && (
                        <div className={`border-2 ${levelColor.border} rounded-lg p-4 ${levelColor.bg}`}>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                AI-Suggested Actions
                            </h4>
                            <ul className="space-y-2">
                                {engagement.recommended_actions.map((action, i) => (
                                    <li key={i} className="flex gap-2 text-sm">
                                        <span>•</span>
                                        <span>{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Generate AI Message */}
                    <Button 
                        onClick={() => generateAIMessageMutation.mutate()}
                        disabled={generateAIMessageMutation.isLoading}
                        variant="outline"
                        className="w-full"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {generateAIMessageMutation.isLoading ? 'Generating...' : 'Generate AI Follow-Up Message'}
                    </Button>

                    {generateAIMessageMutation.data && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                            <div>
                                <Label className="text-xs text-blue-600">Generated Subject:</Label>
                                <p className="font-semibold text-blue-900">{generateAIMessageMutation.data.subject}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-blue-600">Generated Message:</Label>
                                <p className="text-sm text-blue-900 whitespace-pre-wrap">{generateAIMessageMutation.data.message_body}</p>
                            </div>
                            <Button 
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(generateAIMessageMutation.data.message_body);
                                    toast.success('Message copied to clipboard');
                                }}
                                variant="outline"
                            >
                                Copy Message
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}