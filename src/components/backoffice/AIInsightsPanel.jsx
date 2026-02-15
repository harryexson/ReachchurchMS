import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, TrendingUp, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';

export default function AIInsightsPanel({ subscription }) {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (subscription) {
            loadInsights();
        }
    }, [subscription]);

    const loadInsights = async () => {
        if (!subscription) return;
        
        setLoading(true);
        try {
            const data = await base44.entities.CRMInsight.filter({
                subscription_id: subscription.id,
                is_active: true
            });
            setInsights(data);
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInsights = async () => {
        setGenerating(true);
        try {
            await base44.functions.invoke('generateCRMInsights', {
                subscription_id: subscription.id
            });
            await loadInsights();
            alert('AI insights generated successfully!');
        } catch (error) {
            console.error('Error generating insights:', error);
            alert('Failed to generate insights');
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkActioned = async (insightId) => {
        try {
            const user = await base44.auth.me();
            await base44.entities.CRMInsight.update(insightId, {
                actioned: true,
                actioned_date: new Date().toISOString(),
                actioned_by: user.email
            });
            await loadInsights();
        } catch (error) {
            console.error('Error marking as actioned:', error);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-slate-500';
        }
    };

    const churnInsights = insights.filter(i => i.insight_type === 'churn_risk');
    const upsellInsights = insights.filter(i => i.insight_type === 'upsell_opportunity');

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-slate-600">Loading AI insights...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Insights
                </CardTitle>
                <Button 
                    size="sm" 
                    onClick={handleGenerateInsights}
                    disabled={generating}
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Brain className="w-4 h-4 mr-2" />
                            Generate Insights
                        </>
                    )}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Churn Risk */}
                {churnInsights.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            Churn Risk Analysis
                        </h3>
                        {churnInsights.map(insight => (
                            <div key={insight.id} className="p-3 border rounded-lg bg-slate-50">
                                <div className="flex items-start justify-between mb-2">
                                    <Badge className={getRiskColor(insight.risk_level)}>
                                        {insight.risk_level.toUpperCase()} RISK
                                    </Badge>
                                    <span className="text-xs text-slate-500">
                                        {insight.confidence_score}% confidence
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 mb-2">{insight.reasoning}</p>
                                <div className="bg-blue-50 p-2 rounded text-sm mb-2">
                                    <strong className="text-blue-900">Recommended Action:</strong>
                                    <p className="text-blue-800">{insight.suggested_action}</p>
                                </div>
                                {!insight.actioned && (
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleMarkActioned(insight.id)}
                                    >
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Mark as Actioned
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Upsell Opportunities */}
                {upsellInsights.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            Upsell Opportunities
                        </h3>
                        {upsellInsights.map(insight => (
                            <div key={insight.id} className="p-3 border rounded-lg bg-green-50">
                                <div className="flex items-start justify-between mb-2">
                                    <Badge className="bg-green-600">
                                        Upgrade to {insight.suggested_tier}
                                    </Badge>
                                    {insight.estimated_value > 0 && (
                                        <span className="text-sm font-bold text-green-700 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            +${insight.estimated_value}/mo
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-700 mb-2">{insight.recommendation}</p>
                                <p className="text-xs text-slate-600 italic mb-2">{insight.reasoning}</p>
                                {!insight.actioned && (
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleMarkActioned(insight.id)}
                                    >
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Mark as Actioned
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {insights.length === 0 && (
                    <div className="text-center py-8">
                        <Brain className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 text-sm">No AI insights yet</p>
                        <p className="text-slate-400 text-xs">Click "Generate Insights" to analyze this customer</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}