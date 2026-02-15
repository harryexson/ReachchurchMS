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
import { Checkbox } from '@/components/ui/checkbox';
import { Tag, Edit, Plus, Trash2, Copy, CheckCircle2 } from 'lucide-react';

export default function PromoCodeManager() {
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCode, setEditingCode] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);

    const [codeForm, setCodeForm] = useState({
        code: '',
        code_type: 'percentage',
        discount_value: 0,
        trial_extension_days: 14,
        applicable_tiers: [],
        max_uses: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        description: '',
        public_description: '',
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            
            const codes = await base44.entities.PromoCode.list('-created_date');
            setPromoCodes(codes);
        } catch (error) {
            console.error('Error loading promo codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCode = async () => {
        try {
            const dataToSave = {
                ...codeForm,
                code: codeForm.code.toUpperCase().trim(),
                created_by: currentUser.email
            };

            if (editingCode) {
                await base44.entities.PromoCode.update(editingCode.id, dataToSave);
            } else {
                await base44.entities.PromoCode.create(dataToSave);
            }
            
            await loadData();
            setShowModal(false);
            setEditingCode(null);
            alert('Promo code saved successfully!');
        } catch (error) {
            console.error('Error saving promo code:', error);
            alert('Failed to save promo code: ' + error.message);
        }
    };

    const handleDeleteCode = async (codeId) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;
        
        try {
            await base44.entities.PromoCode.delete(codeId);
            await loadData();
            alert('Promo code deleted successfully');
        } catch (error) {
            console.error('Error deleting promo code:', error);
            alert('Failed to delete promo code');
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleTierChange = (tier, checked) => {
        if (checked) {
            setCodeForm({
                ...codeForm,
                applicable_tiers: [...codeForm.applicable_tiers, tier]
            });
        } else {
            setCodeForm({
                ...codeForm,
                applicable_tiers: codeForm.applicable_tiers.filter(t => t !== tier)
            });
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Promo Codes ({promoCodes.length})
                    </CardTitle>
                    <Button onClick={() => {
                        setCodeForm({
                            code: '',
                            code_type: 'percentage',
                            discount_value: 0,
                            trial_extension_days: 14,
                            applicable_tiers: [],
                            max_uses: null,
                            start_date: new Date().toISOString().split('T')[0],
                            end_date: '',
                            description: '',
                            public_description: '',
                            is_active: true
                        });
                        setEditingCode(null);
                        setShowModal(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Promo Code
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {promoCodes.map(code => (
                            <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <code className="font-mono font-bold text-lg bg-slate-100 px-3 py-1 rounded">
                                            {code.code}
                                        </code>
                                        <Badge variant={code.is_active ? "default" : "secondary"}>
                                            {code.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        {code.max_uses && (
                                            <Badge variant="outline">
                                                {code.current_uses || 0}/{code.max_uses} uses
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 mb-1">
                                        <strong>
                                            {code.code_type === 'percentage' 
                                                ? `${code.discount_value}% off` 
                                                : code.code_type === 'fixed_amount'
                                                ? `$${code.discount_value} off`
                                                : `+${code.trial_extension_days} days trial`
                                            }
                                        </strong>
                                        {code.public_description && ` - ${code.public_description}`}
                                    </p>
                                    {code.applicable_tiers?.length > 0 && (
                                        <p className="text-xs text-slate-500">
                                            Applies to: {code.applicable_tiers.join(', ')}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1">
                                        {code.end_date ? `Valid until ${new Date(code.end_date).toLocaleDateString()}` : 'No expiration'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleCopyCode(code.code)}
                                    >
                                        {copiedCode === code.code ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                            setCodeForm(code);
                                            setEditingCode(code);
                                            setShowModal(true);
                                        }}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteCode(code.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {promoCodes.length === 0 && (
                            <p className="text-center text-slate-500 py-8">No promo codes yet. Create one to get started!</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Promo Code Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingCode ? 'Edit' : 'Create'} Promo Code</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                            <Label>Promo Code *</Label>
                            <Input
                                value={codeForm.code}
                                onChange={(e) => setCodeForm({...codeForm, code: e.target.value.toUpperCase()})}
                                placeholder="e.g., LAUNCH2026, NONPROFIT50"
                                className="font-mono"
                            />
                            <p className="text-xs text-slate-500 mt-1">Letters and numbers only, will be converted to uppercase</p>
                        </div>

                        <div>
                            <Label>Discount Type *</Label>
                            <Select
                                value={codeForm.code_type}
                                onValueChange={(value) => setCodeForm({...codeForm, code_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage Off</SelectItem>
                                    <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                                    <SelectItem value="free_trial_extension">Free Trial Extension</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {codeForm.code_type === 'free_trial_extension' ? (
                            <div>
                                <Label>Additional Trial Days</Label>
                                <Input
                                    type="number"
                                    value={codeForm.trial_extension_days}
                                    onChange={(e) => setCodeForm({...codeForm, trial_extension_days: parseInt(e.target.value)})}
                                    placeholder="14"
                                />
                            </div>
                        ) : (
                            <div>
                                <Label>Discount Value</Label>
                                <Input
                                    type="number"
                                    value={codeForm.discount_value}
                                    onChange={(e) => setCodeForm({...codeForm, discount_value: parseFloat(e.target.value)})}
                                    placeholder={codeForm.code_type === 'percentage' ? '10' : '5'}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {codeForm.code_type === 'percentage' ? 'Enter percentage (e.g., 10 for 10% off)' : 'Enter dollar amount (e.g., 5 for $5 off)'}
                                </p>
                            </div>
                        )}

                        <div>
                            <Label className="mb-2 block">Applicable Tiers (leave empty for all)</Label>
                            <div className="space-y-2">
                                {['starter', 'growth', 'premium'].map(tier => (
                                    <div key={tier} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={codeForm.applicable_tiers.includes(tier)}
                                            onCheckedChange={(checked) => handleTierChange(tier, checked)}
                                        />
                                        <Label className="font-normal capitalize">{tier}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Max Uses (leave empty for unlimited)</Label>
                            <Input
                                type="number"
                                value={codeForm.max_uses || ''}
                                onChange={(e) => setCodeForm({...codeForm, max_uses: e.target.value ? parseInt(e.target.value) : null})}
                                placeholder="Unlimited"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date *</Label>
                                <Input
                                    type="date"
                                    value={codeForm.start_date}
                                    onChange={(e) => setCodeForm({...codeForm, start_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>End Date (optional)</Label>
                                <Input
                                    type="date"
                                    value={codeForm.end_date}
                                    onChange={(e) => setCodeForm({...codeForm, end_date: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Public Description</Label>
                            <Input
                                value={codeForm.public_description}
                                onChange={(e) => setCodeForm({...codeForm, public_description: e.target.value})}
                                placeholder="Launch special offer"
                            />
                            <p className="text-xs text-slate-500 mt-1">This will be shown to customers</p>
                        </div>

                        <div>
                            <Label>Internal Notes</Label>
                            <Textarea
                                value={codeForm.description}
                                onChange={(e) => setCodeForm({...codeForm, description: e.target.value})}
                                placeholder="For marketing campaign Q1 2026"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={codeForm.is_active}
                                onCheckedChange={(checked) => setCodeForm({...codeForm, is_active: checked})}
                            />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveCode}>
                            {editingCode ? 'Update' : 'Create'} Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}