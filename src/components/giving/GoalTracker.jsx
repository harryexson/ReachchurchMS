import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function GoalTracker({ donations }) {
    const [goal, setGoal] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        donation_goal_title: '',
        donation_goal_description: '',
        donation_goal_monthly: 0,
        show_goal_on_public_page: true
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadGoal();
    }, []);

    const loadGoal = async () => {
        try {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0 && settings[0].donation_goal_monthly) {
                setGoal(settings[0]);
                setFormData({
                    donation_goal_title: settings[0].donation_goal_title || '',
                    donation_goal_description: settings[0].donation_goal_description || '',
                    donation_goal_monthly: settings[0].donation_goal_monthly || 0,
                    show_goal_on_public_page: settings[0].show_goal_on_public_page ?? true
                });
            }
        } catch (error) {
            console.error('Error loading goal:', error);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                await base44.entities.ChurchSettings.update(settings[0].id, formData);
            } else {
                await base44.entities.ChurchSettings.create(formData);
            }
            toast.success('Giving goal updated successfully!');
            await loadGoal();
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving goal:', error);
            toast.error('Failed to update giving goal');
        }
        setIsLoading(false);
    };

    // Calculate current month's progress
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyDonations = donations.filter(d => {
        const donationDate = new Date(d.donation_date);
        return donationDate.getMonth() === currentMonth && 
               donationDate.getFullYear() === currentYear;
    });
    const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const percentage = goal?.donation_goal_monthly > 0 
        ? Math.min((monthlyTotal / goal.donation_goal_monthly) * 100, 100) 
        : 0;

    if (!goal && !isEditing) {
        return (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="pt-6 text-center">
                    <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Set Your Giving Goal
                    </h3>
                    <p className="text-slate-600 mb-4">
                        Track progress toward your monthly giving target
                    </p>
                    <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Target className="w-4 h-4 mr-2" />
                        Set Goal
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (isEditing) {
        return (
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {goal ? 'Edit Giving Goal' : 'Set Giving Goal'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div>
                        <Label htmlFor="goal_title">Goal Title</Label>
                        <Input
                            id="goal_title"
                            value={formData.donation_goal_title}
                            onChange={(e) => setFormData({...formData, donation_goal_title: e.target.value})}
                            placeholder="e.g., Monthly Operations, Building Fund"
                        />
                    </div>
                    <div>
                        <Label htmlFor="goal_desc">Description</Label>
                        <Textarea
                            id="goal_desc"
                            value={formData.donation_goal_description}
                            onChange={(e) => setFormData({...formData, donation_goal_description: e.target.value})}
                            placeholder="What is this goal for?"
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="goal_amount">Monthly Goal Amount ($)</Label>
                        <Input
                            id="goal_amount"
                            type="number"
                            value={formData.donation_goal_monthly}
                            onChange={(e) => setFormData({...formData, donation_goal_monthly: parseFloat(e.target.value) || 0})}
                            placeholder="5000"
                            min="0"
                            step="100"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="show_public"
                            checked={formData.show_goal_on_public_page}
                            onChange={(e) => setFormData({...formData, show_goal_on_public_page: e.target.checked})}
                            className="w-4 h-4"
                        />
                        <Label htmlFor="show_public">Show on public giving page</Label>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Goal
                        </Button>
                        <Button 
                            onClick={() => setIsEditing(false)}
                            variant="outline"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <CardHeader className="border-b border-white/50 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Target className="w-6 h-6 text-green-600" />
                        {goal.donation_goal_title || 'Monthly Giving Goal'}
                    </CardTitle>
                    <Button 
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        variant="ghost"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {goal.donation_goal_description && (
                    <p className="text-slate-700 mb-6">{goal.donation_goal_description}</p>
                )}
                
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Current Progress</p>
                            <p className="text-4xl font-bold text-green-600">
                                ${monthlyTotal.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-600 mb-1">Goal</p>
                            <p className="text-2xl font-bold text-slate-900">
                                ${goal.donation_goal_monthly.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">
                                {monthlyDonations.length} donations this month
                            </span>
                            <span className="font-semibold text-green-600">
                                {percentage.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={percentage} className="h-4" />
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Start of month</span>
                            <span>${(goal.donation_goal_monthly - monthlyTotal).toLocaleString()} remaining</span>
                        </div>
                    </div>

                    {percentage >= 100 && (
                        <div className="bg-green-100 border border-green-200 rounded-lg p-4 text-center">
                            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="font-semibold text-green-900">Goal Achieved! 🎉</p>
                            <p className="text-sm text-green-700">Thank you for your generosity!</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}