import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Edit, Plus, Trash2, Percent, Tag, Calendar } from 'lucide-react';

export default function SubscriptionPricingManager() {
    const [pricingPlans, setPricingPlans] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [showTrialExtensionModal, setShowTrialExtensionModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const [pricingForm, setPricingForm] = useState({
        plan_name: '',
        monthly_price: 0,
        annual_price: 0,
        description: '',
        features: {},
        is_active: true
    });

    const [discountForm, setDiscountForm] = useState({
        subscription_id: '',
        discount_type: 'percentage',
        discount_value: 0,
        special_monthly_price: 0,
        reason: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
    });

    const [trialForm, setTrialForm] = useState({
        subscription_id: '',
        new_trial_end_date: '',
        reason: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            const [plans, subs, discs] = await Promise.all([
                base44.entities.PricingPlan.list(),
                base44.entities.Subscription.list('-created_date'),
                base44.entities.SubscriptionDiscount.filter({ is_active: true })
            ]);
            
            setPricingPlans(plans);
            setSubscriptions(subs);
            setDiscounts(discs);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePricing = async () => {
        try {
            if (editingPlan) {
                await base44.entities.PricingPlan.update(editingPlan.id, pricingForm);
            } else {
                await base44.entities.PricingPlan.create(pricingForm);
            }
            await loadData();
            setShowPricingModal(false);
            setEditingPlan(null);
            alert('Pricing plan saved successfully!');
        } catch (error) {
            console.error('Error saving pricing:', error);
            alert('Failed to save pricing plan');
        }
    };

    const handleApplyDiscount = async () => {
        try {
            const sub = subscriptions.find(s => s.id === discountForm.subscription_id);
            if (!sub) {
                alert('Subscription not found');
                return;
            }

            await base44.entities.SubscriptionDiscount.create({
                ...discountForm,
                church_name: sub.church_name,
                church_admin_email: sub.church_admin_email,
                applied_by: currentUser.email
            });

            // Update subscription with new pricing if special pricing
            if (discountForm.discount_type === 'special_pricing') {
                await base44.entities.Subscription.update(sub.id, {
                    monthly_price: discountForm.special_monthly_price
                });
            }

            await loadData();
            setShowDiscountModal(false);
            alert('Discount applied successfully!');
        } catch (error) {
            console.error('Error applying discount:', error);
            alert('Failed to apply discount');
        }
    };

    const handleExtendTrial = async () => {
        try {
            const sub = subscriptions.find(s => s.id === trialForm.subscription_id);
            if (!sub) {
                alert('Subscription not found');
                return;
            }

            await base44.entities.Subscription.update(sub.id, {
                trial_end_date: trialForm.new_trial_end_date,
                status: 'trial'
            });

            // Log the extension
            await base44.entities.CustomerInteraction.create({
                church_name: sub.church_name,
                interaction_type: 'email',
                contact_person: sub.church_admin_email,
                contact_email: sub.church_admin_email,
                subject: 'Trial Extension',
                notes: `Trial extended to ${trialForm.new_trial_end_date}. Reason: ${trialForm.reason}`,
                outcome: 'positive',
                team_member: currentUser.email
            });

            await loadData();
            setShowTrialExtensionModal(false);
            alert('Trial period extended successfully!');
        } catch (error) {
            console.error('Error extending trial:', error);
            alert('Failed to extend trial period');
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!confirm('Are you sure you want to delete this pricing plan?')) return;
        
        try {
            await base44.entities.PricingPlan.delete(planId);
            await loadData();
            alert('Pricing plan deleted');
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Failed to delete pricing plan');
        }
    };

    const handleDeleteDiscount = async (discountId) => {
        if (!confirm('Are you sure you want to delete this discount?')) return;
        
        try {
            await base44.entities.SubscriptionDiscount.delete(discountId);
            await loadData();
            alert('Discount deleted successfully');
        } catch (error) {
            console.error('Error deleting discount:', error);
            alert('Failed to delete discount');
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Pricing Plans Management */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Pricing Plans
                    </CardTitle>
                    <Button onClick={() => {
                        setPricingForm({
                            plan_name: '',
                            monthly_price: 0,
                            annual_price: 0,
                            description: '',
                            features: {},
                            is_active: true
                        });
                        setEditingPlan(null);
                        setShowPricingModal(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Plan
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        {pricingPlans.map(plan => (
                            <Card key={plan.id} className="border-2">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg">{plan.plan_name}</h3>
                                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600 mb-2">
                                        ${plan.monthly_price}/mo
                                    </p>
                                    <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => {
                                            setPricingForm(plan);
                                            setEditingPlan(plan);
                                            setShowPricingModal(true);
                                        }}>
                                            <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDeletePlan(plan.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Individual Discounts */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Active Discounts ({discounts.length})
                    </CardTitle>
                    <Button onClick={() => {
                        setDiscountForm({
                            subscription_id: '',
                            discount_type: 'percentage',
                            discount_value: 0,
                            special_monthly_price: 0,
                            reason: '',
                            start_date: new Date().toISOString().split('T')[0],
                            end_date: '',
                            notes: ''
                        });
                        setShowDiscountModal(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Apply Discount
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {discounts.map(disc => (
                            <div key={disc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                    <p className="font-semibold">{disc.church_name}</p>
                                    <p className="text-sm text-slate-600">
                                        {disc.discount_type === 'percentage' 
                                            ? `${disc.discount_value}% off` 
                                            : disc.discount_type === 'fixed_amount'
                                            ? `$${disc.discount_value} off`
                                            : `Special: $${disc.special_monthly_price}/mo`
                                        }
                                        {disc.reason && ` - ${disc.reason}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                        {disc.end_date ? `Until ${new Date(disc.end_date).toLocaleDateString()}` : 'Permanent'}
                                    </Badge>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteDiscount(disc.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Trial Extensions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Extend Trial Period
                    </CardTitle>
                    <Button onClick={() => {
                        setTrialForm({
                            subscription_id: '',
                            new_trial_end_date: '',
                            reason: ''
                        });
                        setShowTrialExtensionModal(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Extend Trial
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600">
                        Extend trial periods for customers on a case-by-case basis
                    </p>
                </CardContent>
            </Card>

            {/* Pricing Modal */}
            <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Edit' : 'Create'} Pricing Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Plan Name</Label>
                            <Input
                                value={pricingForm.plan_name}
                                onChange={(e) => setPricingForm({...pricingForm, plan_name: e.target.value})}
                                placeholder="e.g., Starter, Growth, Premium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Monthly Price ($)</Label>
                                <Input
                                    type="number"
                                    value={pricingForm.monthly_price}
                                    onChange={(e) => setPricingForm({...pricingForm, monthly_price: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <Label>Annual Price ($)</Label>
                                <Input
                                    type="number"
                                    value={pricingForm.annual_price}
                                    onChange={(e) => setPricingForm({...pricingForm, annual_price: parseFloat(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={pricingForm.description}
                                onChange={(e) => setPricingForm({...pricingForm, description: e.target.value})}
                                placeholder="Brief description of this plan"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPricingModal(false)}>Cancel</Button>
                        <Button onClick={handleSavePricing}>Save Plan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Discount Modal */}
            <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply Discount</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Subscription</Label>
                            <Select
                                value={discountForm.subscription_id}
                                onValueChange={(value) => setDiscountForm({...discountForm, subscription_id: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subscription" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subscriptions.map(sub => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                            {sub.church_name} ({sub.church_admin_email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Discount Type</Label>
                            <Select
                                value={discountForm.discount_type}
                                onValueChange={(value) => setDiscountForm({...discountForm, discount_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage Off</SelectItem>
                                    <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                                    <SelectItem value="special_pricing">Special Monthly Price</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {discountForm.discount_type !== 'special_pricing' ? (
                            <div>
                                <Label>Discount Value</Label>
                                <Input
                                    type="number"
                                    value={discountForm.discount_value}
                                    onChange={(e) => setDiscountForm({...discountForm, discount_value: parseFloat(e.target.value)})}
                                    placeholder={discountForm.discount_type === 'percentage' ? '10' : '5'}
                                />
                            </div>
                        ) : (
                            <div>
                                <Label>Special Monthly Price ($)</Label>
                                <Input
                                    type="number"
                                    value={discountForm.special_monthly_price}
                                    onChange={(e) => setDiscountForm({...discountForm, special_monthly_price: parseFloat(e.target.value)})}
                                />
                            </div>
                        )}
                        <div>
                            <Label>Reason</Label>
                            <Input
                                value={discountForm.reason}
                                onChange={(e) => setDiscountForm({...discountForm, reason: e.target.value})}
                                placeholder="e.g., Nonprofit discount, Partnership"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={discountForm.start_date}
                                    onChange={(e) => setDiscountForm({...discountForm, start_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>End Date (optional)</Label>
                                <Input
                                    type="date"
                                    value={discountForm.end_date}
                                    onChange={(e) => setDiscountForm({...discountForm, end_date: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                value={discountForm.notes}
                                onChange={(e) => setDiscountForm({...discountForm, notes: e.target.value})}
                                placeholder="Internal notes"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDiscountModal(false)}>Cancel</Button>
                        <Button onClick={handleApplyDiscount}>Apply Discount</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Trial Extension Modal */}
            <Dialog open={showTrialExtensionModal} onOpenChange={setShowTrialExtensionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Extend Trial Period</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Subscription</Label>
                            <Select
                                value={trialForm.subscription_id}
                                onValueChange={(value) => setTrialForm({...trialForm, subscription_id: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subscription" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subscriptions.filter(s => s.status === 'trial').map(sub => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                            {sub.church_name} (Current: {new Date(sub.trial_end_date).toLocaleDateString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>New Trial End Date</Label>
                            <Input
                                type="date"
                                value={trialForm.new_trial_end_date}
                                onChange={(e) => setTrialForm({...trialForm, new_trial_end_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Reason for Extension</Label>
                            <Textarea
                                value={trialForm.reason}
                                onChange={(e) => setTrialForm({...trialForm, reason: e.target.value})}
                                placeholder="e.g., Requested more time to evaluate features"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTrialExtensionModal(false)}>Cancel</Button>
                        <Button onClick={handleExtendTrial}>Extend Trial</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}