import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Baby, Plus, X, Pencil, QrCode, CheckCircle, Upload, Loader2, Users, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const GRADES = ["Infant","Toddler","Preschool","Kindergarten","1st Grade","2nd Grade","3rd Grade","4th Grade","5th Grade","6th Grade"];

const EMPTY_FORM = { child_name: '', child_age: '', child_grade: '', child_allergies: '', birth_date: '', special_notes: '', photo_url: '', authorized_pickups: [] };

export default function MyChildrenManager({ currentUser }) {
    const [children, setChildren] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingChild, setEditingChild] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [newPickup, setNewPickup] = useState({ name: '', relationship: '', phone: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        if (currentUser) loadChildren();
    }, [currentUser]);

    const loadChildren = async () => {
        setIsLoading(true);
        try {
            const data = await base44.entities.ChildProfile.filter({ parent_email: currentUser.email });
            setChildren(data);
        } catch (e) { console.error(e); }
        setIsLoading(false);
    };

    const openAdd = () => {
        setEditingChild(null);
        setFormData(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (child) => {
        setEditingChild(child);
        setFormData({
            child_name: child.child_name || '',
            child_age: child.child_age?.toString() || '',
            child_grade: child.child_grade || '',
            child_allergies: child.child_allergies || '',
            birth_date: child.birth_date || '',
            special_notes: child.special_notes || '',
            photo_url: child.photo_url || '',
            authorized_pickups: child.authorized_pickups || []
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.child_name) return;
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                child_age: formData.child_age ? parseInt(formData.child_age) : null,
                parent_email: currentUser.email,
                parent_name: currentUser.full_name
            };
            if (editingChild) {
                await base44.entities.ChildProfile.update(editingChild.id, payload);
            } else {
                await base44.entities.ChildProfile.create(payload);
            }
            await loadChildren();
            setShowForm(false);
        } catch (e) { console.error(e); }
        setIsSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this child from your profile?")) return;
        await base44.entities.ChildProfile.delete(id);
        await loadChildren();
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, photo_url: file_url });
        } catch (e) { console.error(e); }
        setUploadingPhoto(false);
    };

    const addPickup = () => {
        if (!newPickup.name) return;
        setFormData({ ...formData, authorized_pickups: [...(formData.authorized_pickups || []), { ...newPickup }] });
        setNewPickup({ name: '', relationship: '', phone: '' });
    };

    const removePickup = (i) => {
        const updated = [...formData.authorized_pickups];
        updated.splice(i, 1);
        setFormData({ ...formData, authorized_pickups: updated });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-purple-600" />
                    My Children
                </h3>
                <Button onClick={openAdd} size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-1" /> Add Child
                </Button>
            </div>

            {children.length === 0 ? (
                <Card className="border-2 border-dashed border-purple-200">
                    <CardContent className="py-10 text-center space-y-3">
                        <Baby className="w-12 h-12 text-purple-300 mx-auto" />
                        <p className="text-slate-600">No children added yet</p>
                        <p className="text-sm text-slate-500">Add your children to enable fast check-in at Children's Church</p>
                        <Button onClick={openAdd} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" /> Add My Child
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {children.map(child => (
                        <Card key={child.id} className="shadow border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {child.photo_url
                                            ? <img src={child.photo_url} alt={child.child_name} className="w-full h-full object-cover" />
                                            : <Baby className="w-7 h-7 text-purple-600" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-lg">{child.child_name}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {child.child_age && <Badge variant="secondary">Age {child.child_age}</Badge>}
                                            {child.child_grade && <Badge className="bg-purple-100 text-purple-800">{child.child_grade}</Badge>}
                                        </div>
                                        {child.child_allergies && (
                                            <p className="text-xs text-red-600 font-medium mt-1">⚠️ {child.child_allergies}</p>
                                        )}
                                        {child.authorized_pickups?.length > 0 && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                <Users className="w-3 h-3 inline mr-1" />
                                                {child.authorized_pickups.length} authorized pickup{child.authorized_pickups.length !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(child)} className="text-slate-500">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(child.id)} className="text-red-500">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <Link to={createPageUrl('ParentKidsCheckIn')}>
                                        <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                            <QrCode className="w-4 h-4 mr-2" /> Pre-Check In for Church
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingChild ? 'Edit Child' : 'Add Child'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Photo */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                                {formData.photo_url
                                    ? <img src={formData.photo_url} alt="Child" className="w-full h-full object-cover" />
                                    : uploadingPhoto
                                        ? <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                                        : <Baby className="w-8 h-8 text-purple-400" />
                                }
                            </div>
                            <label className="cursor-pointer">
                                <span className="text-sm text-purple-600 font-medium flex items-center gap-1">
                                    <Upload className="w-4 h-4" /> Upload Photo
                                </span>
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <Label>Child's Full Name *</Label>
                                <Input value={formData.child_name} onChange={e => setFormData({ ...formData, child_name: e.target.value })} placeholder="Child's name" />
                            </div>
                            <div>
                                <Label>Age</Label>
                                <Input type="number" value={formData.child_age} onChange={e => setFormData({ ...formData, child_age: e.target.value })} placeholder="5" />
                            </div>
                            <div>
                                <Label>Grade Level</Label>
                                <Select value={formData.child_grade} onValueChange={v => setFormData({ ...formData, child_grade: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                                    <SelectContent>
                                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label>Date of Birth</Label>
                                <Input type="date" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <Label>Allergies / Medical Conditions</Label>
                                <Input value={formData.child_allergies} onChange={e => setFormData({ ...formData, child_allergies: e.target.value })} placeholder="None or list allergies" />
                            </div>
                            <div className="col-span-2">
                                <Label>Special Notes</Label>
                                <Textarea value={formData.special_notes} onChange={e => setFormData({ ...formData, special_notes: e.target.value })} placeholder="Any special instructions for staff..." className="h-20" />
                            </div>
                        </div>

                        {/* Authorized pickups */}
                        <div>
                            <Label className="font-semibold">Authorized Pickups</Label>
                            <p className="text-xs text-slate-500 mb-2">Who else is authorized to pick up this child?</p>
                            {(formData.authorized_pickups || []).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg mb-2">
                                    <div>
                                        <p className="font-medium text-sm">{p.name}</p>
                                        <p className="text-xs text-slate-500">{p.relationship} {p.phone && `• ${p.phone}`}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removePickup(i)} className="text-red-500 h-7 w-7">
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <Input placeholder="Name" value={newPickup.name} onChange={e => setNewPickup({ ...newPickup, name: e.target.value })} className="text-sm" />
                                <Input placeholder="Relation" value={newPickup.relationship} onChange={e => setNewPickup({ ...newPickup, relationship: e.target.value })} className="text-sm" />
                                <Input placeholder="Phone" value={newPickup.phone} onChange={e => setNewPickup({ ...newPickup, phone: e.target.value })} className="text-sm" />
                            </div>
                            <Button variant="outline" size="sm" onClick={addPickup} className="w-full mt-2 border-purple-300 text-purple-600">
                                <Plus className="w-3 h-3 mr-1" /> Add Authorized Person
                            </Button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving || !formData.child_name} className="flex-1 bg-purple-600 hover:bg-purple-700">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingChild ? 'Save Changes' : 'Add Child'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}