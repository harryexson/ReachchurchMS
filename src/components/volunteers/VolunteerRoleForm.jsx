import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function VolunteerRoleForm({ isOpen, setIsOpen, onSubmit, role }) {
    const [formData, setFormData] = useState({
        role_name: "",
        ministry_area: "hospitality",
        description: "",
        requirements: [],
        skills_needed: [],
        time_commitment: "",
        training_required: false,
        training_materials: "",
        background_check_required: false,
        team_leader: "",
        team_leader_email: "",
        total_volunteers_needed: "",
        is_active: true
    });

    const [newRequirement, setNewRequirement] = useState("");
    const [newSkill, setNewSkill] = useState("");

    useEffect(() => {
        if (role) {
            setFormData({
                role_name: role.role_name || "",
                ministry_area: role.ministry_area || "hospitality",
                description: role.description || "",
                requirements: role.requirements || [],
                skills_needed: role.skills_needed || [],
                time_commitment: role.time_commitment || "",
                training_required: role.training_required || false,
                training_materials: role.training_materials || "",
                background_check_required: role.background_check_required || false,
                team_leader: role.team_leader || "",
                team_leader_email: role.team_leader_email || "",
                total_volunteers_needed: role.total_volunteers_needed || "",
                is_active: role.is_active !== undefined ? role.is_active : true
            });
        } else {
            setFormData({
                role_name: "",
                ministry_area: "hospitality",
                description: "",
                requirements: [],
                skills_needed: [],
                time_commitment: "",
                training_required: false,
                training_materials: "",
                background_check_required: false,
                team_leader: "",
                team_leader_email: "",
                total_volunteers_needed: "",
                is_active: true
            });
        }
    }, [role, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addRequirement = () => {
        if (newRequirement.trim()) {
            setFormData(prev => ({
                ...prev,
                requirements: [...prev.requirements, newRequirement.trim()]
            }));
            setNewRequirement("");
        }
    };

    const removeRequirement = (index) => {
        setFormData(prev => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index)
        }));
    };

    const addSkill = () => {
        if (newSkill.trim()) {
            setFormData(prev => ({
                ...prev,
                skills_needed: [...prev.skills_needed, newSkill.trim()]
            }));
            setNewSkill("");
        }
    };

    const removeSkill = (index) => {
        setFormData(prev => ({
            ...prev,
            skills_needed: prev.skills_needed.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit({
            ...formData,
            total_volunteers_needed: formData.total_volunteers_needed ? parseInt(formData.total_volunteers_needed) : null
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{role ? "Edit Volunteer Role" : "Create Volunteer Role"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="role_name">Role Name</Label>
                            <Input id="role_name" name="role_name" value={formData.role_name} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ministry_area">Ministry Area</Label>
                            <Select value={formData.ministry_area} onValueChange={(value) => handleSelectChange('ministry_area', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select ministry" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="worship_team">Worship Team</SelectItem>
                                    <SelectItem value="children_ministry">Children's Ministry</SelectItem>
                                    <SelectItem value="youth_ministry">Youth Ministry</SelectItem>
                                    <SelectItem value="hospitality">Hospitality</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="media_tech">Media & Tech</SelectItem>
                                    <SelectItem value="prayer_team">Prayer Team</SelectItem>
                                    <SelectItem value="outreach">Outreach</SelectItem>
                                    <SelectItem value="administration">Administration</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="total_volunteers_needed">Volunteers Needed</Label>
                            <Input id="total_volunteers_needed" name="total_volunteers_needed" type="number" min="1" value={formData.total_volunteers_needed} onChange={handleChange} />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label>Requirements</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add requirement (e.g., 18+ years old)"
                                    value={newRequirement}
                                    onChange={(e) => setNewRequirement(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                                />
                                <Button type="button" onClick={addRequirement}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.requirements.map((req, index) => (
                                    <Badge key={index} variant="outline" className="pl-2 pr-1">
                                        {req}
                                        <button type="button" onClick={() => removeRequirement(index)} className="ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label>Skills Needed</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add skill (e.g., Public speaking)"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                />
                                <Button type="button" onClick={addSkill}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.skills_needed.map((skill, index) => (
                                    <Badge key={index} variant="outline" className="pl-2 pr-1 bg-purple-50">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(index)} className="ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time_commitment">Time Commitment</Label>
                            <Input id="time_commitment" name="time_commitment" value={formData.time_commitment} onChange={handleChange} placeholder="e.g., 2 hours/week" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="team_leader">Team Leader</Label>
                            <Input id="team_leader" name="team_leader" value={formData.team_leader} onChange={handleChange} />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="team_leader_email">Team Leader Email</Label>
                            <Input id="team_leader_email" name="team_leader_email" type="email" value={formData.team_leader_email} onChange={handleChange} />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="training_required"
                                    checked={formData.training_required}
                                    onCheckedChange={(checked) => handleSelectChange('training_required', checked)}
                                />
                                <Label htmlFor="training_required">Training Required</Label>
                            </div>

                            {formData.training_required && (
                                <div className="space-y-2">
                                    <Label htmlFor="training_materials">Training Materials/Link</Label>
                                    <Input id="training_materials" name="training_materials" value={formData.training_materials} onChange={handleChange} placeholder="https://..." />
                                </div>
                            )}
                        </div>

                        <div className="col-span-1 md:col-span-2 flex items-center space-x-2">
                            <Checkbox
                                id="background_check_required"
                                checked={formData.background_check_required}
                                onCheckedChange={(checked) => handleSelectChange('background_check_required', checked)}
                            />
                            <Label htmlFor="background_check_required">Background Check Required</Label>
                        </div>

                        <div className="col-span-1 md:col-span-2 flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => handleSelectChange('is_active', checked)}
                            />
                            <Label htmlFor="is_active">Role is Active (accepting volunteers)</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Save Role
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}