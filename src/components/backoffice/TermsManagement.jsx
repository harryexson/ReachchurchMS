import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FileText, Plus, Edit, CheckCircle, Clock } from 'lucide-react';

export default function TermsManagement({ onRefresh, currentUser }) {
    const [terms, setTerms] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTerms, setEditingTerms] = useState(null);
    const [formData, setFormData] = useState({
        version: '',
        title: '',
        content: '',
        effective_date: '',
        is_active: false,
        requires_acceptance: true,
        notes: ''
    });

    useEffect(() => {
        loadTerms();
    }, []);

    const loadTerms = async () => {
        const allTerms = await base44.entities.TermsAndConditions.list('-created_date');
        setTerms(allTerms);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const termsData = {
                ...formData,
                created_by: currentUser.email
            };

            if (editingTerms) {
                await base44.entities.TermsAndConditions.update(editingTerms.id, termsData);
            } else {
                await base44.entities.TermsAndConditions.create(termsData);
            }

            setIsModalOpen(false);
            loadTerms();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error saving terms:', error);
            alert('Failed to save terms');
        }
    };

    const handleActivate = async (termsId) => {
        if (!confirm('Activate this version? This will deactivate all other versions.')) return;

        try {
            // Deactivate all other versions
            const allTerms = await base44.entities.TermsAndConditions.list();
            for (const t of allTerms) {
                if (t.id !== termsId && t.is_active) {
                    await base44.entities.TermsAndConditions.update(t.id, { is_active: false });
                }
            }

            // Activate this version
            await base44.entities.TermsAndConditions.update(termsId, { 
                is_active: true,
                approved_by: currentUser.email,
                approval_date: new Date().toISOString()
            });

            loadTerms();
        } catch (error) {
            console.error('Error activating terms:', error);
            alert('Failed to activate terms');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Terms & Conditions Management
                        </CardTitle>
                        <Button onClick={() => {
                            setEditingTerms(null);
                            setFormData({
                                version: '',
                                title: '',
                                content: '',
                                effective_date: '',
                                is_active: false,
                                requires_acceptance: true,
                                notes: ''
                            });
                            setIsModalOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Version
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {terms.map(term => (
                            <Card key={term.id} className="border-2">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold">{term.title}</h3>
                                            <p className="text-sm text-slate-600">Version {term.version}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {term.is_active ? (
                                                <Badge className="bg-green-500">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                                        <div>
                                            <p className="text-slate-600">Effective Date:</p>
                                            <p className="font-semibold">{new Date(term.effective_date).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Acceptances:</p>
                                            <p className="font-semibold">{term.acceptance_count || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600">Created By:</p>
                                            <p className="font-semibold">{term.created_by}</p>
                                        </div>
                                    </div>

                                    {term.notes && (
                                        <div className="bg-slate-50 p-3 rounded mb-4">
                                            <p className="text-sm text-slate-600">{term.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingTerms(term);
                                                setFormData(term);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        {!term.is_active && (
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleActivate(term.id)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Activate
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTerms ? 'Edit Terms & Conditions' : 'Create New Terms & Conditions'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Version *</Label>
                                <Input
                                    value={formData.version}
                                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                                    placeholder="e.g., 1.0, 2.1"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Effective Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.effective_date}
                                    onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g., Terms of Service"
                                required
                            />
                        </div>

                        <div>
                            <Label>Content * (HTML or Markdown)</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                rows={15}
                                placeholder="Enter the full terms and conditions..."
                                required
                            />
                        </div>

                        <div>
                            <Label>Internal Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                rows={3}
                                placeholder="What changed in this version..."
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.requires_acceptance}
                                onCheckedChange={(checked) => setFormData({...formData, requires_acceptance: checked})}
                            />
                            <Label>Requires User Acceptance</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Save Terms
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}