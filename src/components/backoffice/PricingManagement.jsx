import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Edit, Save, Plus, Crown, TrendingUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function PricingManagement({ onRefresh, currentUser }) {
    const [pricingPlans, setPricingPlans] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        plan_name: 'starter',
        display_name: '',
        monthly_price: 0,
        annual_price: 0,
        annual_discount_percent: 0,
        features: {},
        is_active: true,
        trial_days: 14,
        setup_fee: 0,
        notes: ''
    });

    useEffect(() => {
        loadPricingPlans();
    }, []);

    const loadPricingPlans = async () => {
        const plans = await base44.entities.PricingPlan.list();
        setPricingPlans(plans);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await base44.entities.PricingPlan.update(editingPlan.id, formData);
            } else {
                await base44.entities.PricingPlan.create(formData);
            }
            
            // Log the pricing change
            await base44.entities.AccountAction.create({
                subscription_id: 'SYSTEM',
                church_name: 'Platform',
                action_type: 'note',
                reason: 'Pricing plan updated',
                notes: `${currentUser.full_name} updated ${formData.plan_name} plan pricing`,
                performed_by: currentUser.email,
                performed_by_name: currentUser.full_name,
                performed_by_role: 'super_admin'
            });

            setIsModalOpen(false);
            loadPricingPlans();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error saving pricing plan:', error);
            alert('Failed to save pricing plan');
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData(plan);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Pricing Plan Management
                        </CardTitle>
                        <Button onClick={() => {
                            setEditingPlan(null);
                            setFormData({
                                plan_name: 'starter',
                                display_name: '',
                                monthly_price: 0,
                                annual_price: 0,
                                annual_discount_percent: 0,
                                features: {},
                                is_active: true,
                                trial_days: 14,
                                setup_fee: 0,
                                notes: ''
                            });
                            setIsModalOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Plan
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        {pricingPlans.map(plan => (
                            <Card key={plan.id} className="border-2">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {plan.display_name}
                                                {plan.recommended && (
                                                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                                        <Crown className="w-3 h-3 mr-1" />
                                                        Recommended
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <p className="text-sm text-slate-500 mt-1">{plan.plan_name}</p>
                                        </div>
                                        <Badge variant={plan.is_active ? "default" : "outline"}>
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-3xl font-bold">${plan.monthly_price}</p>
                                        <p className="text-sm text-slate-600">/month</p>
                                    </div>
                                    {plan.annual_price > 0 && (
                                        <div className="bg-green-50 border border-green-200 rounded p-2">
                                            <p className="text-sm font-semibold text-green-800">
                                                ${plan.annual_price}/year
                                            </p>
                                            <p className="text-xs text-green-600">
                                                Save {plan.annual_discount_percent}%
                                            </p>
                                        </div>
                                    )}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Trial Days:</span>
                                            <span className="font-semibold">{plan.trial_days}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Setup Fee:</span>
                                            <span className="font-semibold">${plan.setup_fee}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleEdit(plan)}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Plan
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPlan ? 'Edit Pricing Plan' : 'Create New Pricing Plan'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Plan Name</Label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={formData.plan_name}
                                    onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                                >
                                    <option value="starter">Starter</option>
                                    <option value="growth">Growth</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </div>
                            <div>
                                <Label>Display Name</Label>
                                <Input
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                                    placeholder="e.g., Growth Plan"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>Monthly Price ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.monthly_price}
                                    onChange={(e) => setFormData({...formData, monthly_price: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Annual Price ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.annual_price}
                                    onChange={(e) => setFormData({...formData, annual_price: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <Label>Annual Discount (%)</Label>
                                <Input
                                    type="number"
                                    value={formData.annual_discount_percent}
                                    onChange={(e) => setFormData({...formData, annual_discount_percent: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Trial Days</Label>
                                <Input
                                    type="number"
                                    value={formData.trial_days}
                                    onChange={(e) => setFormData({...formData, trial_days: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <Label>Setup Fee ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.setup_fee}
                                    onChange={(e) => setFormData({...formData, setup_fee: parseFloat(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Internal Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                rows={3}
                                placeholder="Internal notes about this pricing plan..."
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                            />
                            <Label>Plan is Active</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.recommended}
                                onCheckedChange={(checked) => setFormData({...formData, recommended: checked})}
                            />
                            <Label>Mark as Recommended</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                <Save className="w-4 h-4 mr-2" />
                                Save Plan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}