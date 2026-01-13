import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Brain, Plus, Edit, Trash2, Loader2, CheckCircle } from "lucide-react";

export default function SMSAutoResponderPage() {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingResponse, setEditingResponse] = useState(null);
    
    const [formData, setFormData] = useState({
        info_type: 'general',
        question_keywords: [],
        response_text: '',
        is_active: true,
        priority: 0
    });

    const [newKeyword, setNewKeyword] = useState('');

    const infoTypes = [
        { value: 'service_times', label: 'Service Times' },
        { value: 'location', label: 'Location' },
        { value: 'contact', label: 'Contact Info' },
        { value: 'pastor', label: 'Pastor Info' },
        { value: 'ministries', label: 'Ministries' },
        { value: 'events', label: 'Events' },
        { value: 'giving', label: 'Giving' },
        { value: 'general', label: 'General' }
    ];

    useEffect(() => {
        loadResponses();
    }, []);

    const loadResponses = async () => {
        setLoading(true);
        try {
            const data = await base44.entities.ChurchInfo.list();
            setResponses(data);
        } catch (error) {
            console.error('Failed to load responses:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingResponse) {
                await base44.entities.ChurchInfo.update(editingResponse.id, formData);
            } else {
                await base44.entities.ChurchInfo.create(formData);
            }
            
            setShowForm(false);
            setEditingResponse(null);
            setFormData({
                info_type: 'general',
                question_keywords: [],
                response_text: '',
                is_active: true,
                priority: 0
            });
            loadResponses();
        } catch (error) {
            alert('Failed to save: ' + error.message);
        }
    };

    const addKeyword = () => {
        if (newKeyword.trim()) {
            setFormData({
                ...formData,
                question_keywords: [...formData.question_keywords, newKeyword.trim().toLowerCase()]
            });
            setNewKeyword('');
        }
    };

    const removeKeyword = (keyword) => {
        setFormData({
            ...formData,
            question_keywords: formData.question_keywords.filter(k => k !== keyword)
        });
    };

    const editResponse = (response) => {
        setEditingResponse(response);
        setFormData({
            info_type: response.info_type,
            question_keywords: response.question_keywords || [],
            response_text: response.response_text,
            is_active: response.is_active,
            priority: response.priority || 0
        });
        setShowForm(true);
    };

    const deleteResponse = async (id) => {
        if (!confirm('Delete this auto-response?')) return;
        try {
            await base44.entities.ChurchInfo.delete(id);
            loadResponses();
        } catch (error) {
            alert('Failed to delete: ' + error.message);
        }
    };

    const toggleActive = async (response) => {
        try {
            await base44.entities.ChurchInfo.update(response.id, {
                is_active: !response.is_active
            });
            loadResponses();
        } catch (error) {
            alert('Failed to update: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">AI Auto-Responder</h1>
                        <p className="text-slate-600 mt-1">Configure automatic responses for common questions</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Response
                    </Button>
                </div>

                <Alert className="border-purple-200 bg-purple-50">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <AlertDescription className="text-purple-900">
                        <strong>How it works:</strong> When someone texts a question, the AI analyzes the message for keywords and automatically sends the matching response. All responses are TCPA compliant.
                    </AlertDescription>
                </Alert>

                {/* Form */}
                {showForm && (
                    <Card className="border-2 border-purple-200">
                        <CardHeader>
                            <CardTitle>{editingResponse ? 'Edit Response' : 'Create Auto-Response'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Response Type</label>
                                    <Select value={formData.info_type} onValueChange={(value) => setFormData({...formData, info_type: value})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {infoTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Detection Keywords</label>
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            placeholder="e.g., 'service', 'time', 'when'"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                        />
                                        <Button type="button" onClick={addKeyword} variant="outline">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.question_keywords.map((keyword, idx) => (
                                            <Badge key={idx} variant="outline" className="gap-2">
                                                {keyword}
                                                <button type="button" onClick={() => removeKeyword(keyword)} className="text-red-600">×</button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Add words that appear in questions this should answer</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Response Text</label>
                                    <Textarea
                                        value={formData.response_text}
                                        onChange={(e) => setFormData({...formData, response_text: e.target.value})}
                                        rows={4}
                                        required
                                        placeholder="The automatic response message..."
                                    />
                                    <p className="text-xs text-slate-500 mt-1">TCPA disclaimer will be added automatically</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={formData.is_active}
                                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                                        />
                                        <label className="text-sm">Active</label>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm">Priority:</label>
                                        <Input
                                            type="number"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                                            className="w-20"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <Button type="button" variant="outline" onClick={() => {
                                        setShowForm(false);
                                        setEditingResponse(null);
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                        {editingResponse ? 'Update' : 'Create'} Response
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Responses List */}
                <div className="space-y-4">
                    {responses.length === 0 ? (
                        <Alert>
                            <AlertDescription>
                                No auto-responses configured yet. Create your first one to get started!
                            </AlertDescription>
                        </Alert>
                    ) : (
                        responses.map(response => (
                            <Card key={response.id} className={!response.is_active ? 'opacity-50' : ''}>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge className="bg-purple-100 text-purple-800">
                                                    {infoTypes.find(t => t.value === response.info_type)?.label || response.info_type}
                                                </Badge>
                                                {response.is_active && (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                )}
                                                {response.priority > 0 && (
                                                    <Badge variant="outline">Priority: {response.priority}</Badge>
                                                )}
                                            </div>
                                            
                                            <div className="mb-3">
                                                <p className="text-sm text-slate-600 font-semibold mb-1">Triggers on:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(response.question_keywords || []).map((keyword, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {keyword}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <p className="text-slate-700 bg-slate-50 p-3 rounded">{response.response_text}</p>
                                        </div>
                                        
                                        <div className="flex gap-2 ml-4">
                                            <Switch
                                                checked={response.is_active}
                                                onCheckedChange={() => toggleActive(response)}
                                            />
                                            <Button size="sm" variant="outline" onClick={() => editResponse(response)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => deleteResponse(response.id)}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
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