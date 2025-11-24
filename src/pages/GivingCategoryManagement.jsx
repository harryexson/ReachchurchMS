import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Target, Calendar } from "lucide-react";

export default function GivingCategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        category_name: '',
        category_code: '',
        description: '',
        category_type: 'general',
        linked_event_id: '',
        goal_amount: '',
        start_date: '',
        end_date: '',
        display_order: 100,
        show_on_public_page: true,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [cats, evts] = await Promise.all([
                base44.entities.GivingCategory.list(),
                base44.entities.Event.list()
            ]);
            setCategories(cats.sort((a, b) => a.display_order - b.display_order));
            setEvents(evts);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const dataToSave = {
            ...formData,
            category_code: formData.category_code.toLowerCase().replace(/\s+/g, '_'),
            goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) : null,
            display_order: parseInt(formData.display_order) || 100
        };

        try {
            if (editingCategory) {
                await base44.entities.GivingCategory.update(editingCategory.id, dataToSave);
            } else {
                await base44.entities.GivingCategory.create(dataToSave);
            }
            
            setShowForm(false);
            setEditingCategory(null);
            setFormData({
                category_name: '',
                category_code: '',
                description: '',
                category_type: 'general',
                linked_event_id: '',
                goal_amount: '',
                start_date: '',
                end_date: '',
                display_order: 100,
                show_on_public_page: true,
                is_active: true
            });
            loadData();
        } catch (error) {
            console.error("Failed to save category:", error);
            alert("Failed to save category");
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            category_name: category.category_name,
            category_code: category.category_code,
            description: category.description || '',
            category_type: category.category_type,
            linked_event_id: category.linked_event_id || '',
            goal_amount: category.goal_amount || '',
            start_date: category.start_date || '',
            end_date: category.end_date || '',
            display_order: category.display_order,
            show_on_public_page: category.show_on_public_page,
            is_active: category.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (categoryId) => {
        if (!confirm("Delete this category? This cannot be undone.")) return;

        try {
            await base44.entities.GivingCategory.delete(categoryId);
            loadData();
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete category");
        }
    };

    const typeColors = {
        general: 'bg-blue-100 text-blue-800',
        event_specific: 'bg-purple-100 text-purple-800',
        campaign: 'bg-green-100 text-green-800',
        project: 'bg-orange-100 text-orange-800',
        emergency: 'bg-red-100 text-red-800'
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Giving Categories</h1>
                        <p className="text-slate-600 mt-1">
                            Manage donation categories for events, campaigns, and special needs
                        </p>
                    </div>
                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Category
                    </Button>
                </div>

                {showForm && (
                    <Card className="shadow-lg border-2 border-blue-200">
                        <CardHeader>
                            <CardTitle>
                                {editingCategory ? 'Edit Category' : 'New Giving Category'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category Name *</Label>
                                        <Input
                                            value={formData.category_name}
                                            onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                                            placeholder="e.g., Missions Trip 2025"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category Code *</Label>
                                        <Input
                                            value={formData.category_code}
                                            onChange={(e) => setFormData({...formData, category_code: e.target.value})}
                                            placeholder="e.g., missions_trip_2025"
                                            required
                                        />
                                        <p className="text-xs text-slate-500">Lowercase, use underscores</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category Type</Label>
                                        <Select value={formData.category_type} onValueChange={(v) => setFormData({...formData, category_type: v})}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General</SelectItem>
                                                <SelectItem value="event_specific">Event Specific</SelectItem>
                                                <SelectItem value="campaign">Campaign</SelectItem>
                                                <SelectItem value="project">Project</SelectItem>
                                                <SelectItem value="emergency">Emergency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.category_type === 'event_specific' && (
                                        <div className="space-y-2">
                                            <Label>Linked Event</Label>
                                            <Select value={formData.linked_event_id} onValueChange={(v) => setFormData({...formData, linked_event_id: v})}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select event" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {events.map(e => (
                                                        <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Goal Amount ($)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.goal_amount}
                                            onChange={(e) => setFormData({...formData, goal_amount: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Display Order</Label>
                                        <Input
                                            type="number"
                                            value={formData.display_order}
                                            onChange={(e) => setFormData({...formData, display_order: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-3 pt-6">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="show_public"
                                                checked={formData.show_on_public_page}
                                                onChange={(e) => setFormData({...formData, show_on_public_page: e.target.checked})}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="show_public" className="cursor-pointer">Show on public giving page</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                        {editingCategory ? 'Update Category' : 'Create Category'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setShowForm(false);
                                        setEditingCategory(null);
                                    }}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4">
                    {isLoading ? (
                        <Card><CardContent className="p-12 text-center">
                            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                        </CardContent></Card>
                    ) : categories.length === 0 ? (
                        <Card><CardContent className="p-12 text-center">
                            <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-600">No categories yet</p>
                        </CardContent></Card>
                    ) : (
                        categories.map(cat => (
                            <Card key={cat.id} className="shadow-lg hover:shadow-xl transition-all">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900">{cat.category_name}</h3>
                                                <Badge className={typeColors[cat.category_type]}>
                                                    {cat.category_type.replace('_', ' ')}
                                                </Badge>
                                                {!cat.is_active && <Badge variant="outline">Inactive</Badge>}
                                                {cat.is_default && <Badge className="bg-slate-800 text-white">Default</Badge>}
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{cat.description}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                                <span className="font-mono bg-slate-100 px-2 py-1 rounded">{cat.category_code}</span>
                                                {cat.goal_amount && (
                                                    <span className="flex items-center gap-1">
                                                        <Target className="w-4 h-4" />
                                                        Goal: ${cat.goal_amount.toLocaleString()}
                                                    </span>
                                                )}
                                                {cat.start_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {cat.start_date} {cat.end_date && `→ ${cat.end_date}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleEdit(cat)} variant="outline" size="sm">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            {!cat.is_default && (
                                                <Button onClick={() => handleDelete(cat.id)} variant="outline" size="sm" className="text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}