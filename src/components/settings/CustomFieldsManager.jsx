import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Settings } from "lucide-react";

export default function CustomFieldsManager() {
    const [fields, setFields] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [formData, setFormData] = useState({
        field_name: "",
        field_label: "",
        field_type: "text",
        field_options: [],
        is_required: false,
        is_active: true,
        display_order: 0
    });

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        try {
            const fieldList = await base44.entities.CustomFieldDefinition.list("display_order");
            setFields(fieldList);
        } catch (error) {
            console.error("Error loading fields:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedField) {
                await base44.entities.CustomFieldDefinition.update(selectedField.id, formData);
            } else {
                await base44.entities.CustomFieldDefinition.create(formData);
            }
            await loadFields();
            setIsFormOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving field:", error);
        }
    };

    const handleEdit = (field) => {
        setSelectedField(field);
        setFormData({
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type,
            field_options: field.field_options || [],
            is_required: field.is_required,
            is_active: field.is_active,
            display_order: field.display_order
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (fieldId) => {
        if (confirm("Are you sure you want to delete this custom field?")) {
            await base44.entities.CustomFieldDefinition.delete(fieldId);
            await loadFields();
        }
    };

    const resetForm = () => {
        setSelectedField(null);
        setFormData({
            field_name: "",
            field_label: "",
            field_type: "text",
            field_options: [],
            is_required: false,
            is_active: true,
            display_order: 0
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Custom Member Fields
                    </CardTitle>
                    <Button onClick={() => setIsFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {fields.map(field => (
                        <div key={field.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Badge variant={field.is_active ? "default" : "outline"}>
                                    {field.field_type}
                                </Badge>
                                <div>
                                    <p className="font-medium">{field.field_label}</p>
                                    <p className="text-xs text-slate-500">{field.field_name}</p>
                                </div>
                                {field.is_required && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(field)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => handleDelete(field.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <p>No custom fields defined yet.</p>
                            <p className="text-sm">Click "Add Field" to create your first custom field.</p>
                        </div>
                    )}
                </div>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedField ? "Edit Custom Field" : "Add Custom Field"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <Label>Field Name (internal)</Label>
                                    <Input
                                        value={formData.field_name}
                                        onChange={(e) => setFormData({...formData, field_name: e.target.value})}
                                        placeholder="e.g., baptism_date"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Field Label (display)</Label>
                                    <Input
                                        value={formData.field_label}
                                        onChange={(e) => setFormData({...formData, field_label: e.target.value})}
                                        placeholder="e.g., Baptism Date"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Field Type</Label>
                                    <Select
                                        value={String(formData.field_type)}
                                        onValueChange={(value) => setFormData({...formData, field_type: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="boolean">Yes/No</SelectItem>
                                            <SelectItem value="select">Dropdown</SelectItem>
                                            <SelectItem value="multiselect">Multi-Select</SelectItem>
                                            <SelectItem value="textarea">Text Area</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(formData.field_type === "select" || formData.field_type === "multiselect") && (
                                    <div>
                                        <Label>Options (comma-separated)</Label>
                                        <Input
                                            value={formData.field_options.join(", ")}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                field_options: e.target.value.split(',').map(o => o.trim())
                                            })}
                                            placeholder="e.g., Option 1, Option 2, Option 3"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <Label>Required Field</Label>
                                    <Switch
                                        checked={formData.is_required}
                                        onCheckedChange={(checked) => setFormData({...formData, is_required: checked})}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Active</Label>
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {selectedField ? "Update" : "Create"} Field
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}