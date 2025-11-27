import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function WebinarModal({ isOpen, onClose, onSuccess, webinar }) {
    const [formData, setFormData] = useState(webinar || {
        title: "",
        description: "",
        presenter: "",
        presenter_title: "",
        scheduled_date: "",
        scheduled_time: "",
        duration_minutes: 60,
        meeting_url: "",
        max_attendees: 100,
        status: "upcoming",
        tags: [],
        is_featured: false
    });
    const [tagInput, setTagInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (webinar?.id) {
                await base44.entities.Webinar.update(webinar.id, formData);
            } else {
                await base44.entities.Webinar.create(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save webinar");
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{webinar ? "Edit Webinar" : "Create New Webinar"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Title *</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                        />
                    </div>

                    <div>
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Presenter Name</Label>
                            <Input
                                value={formData.presenter}
                                onChange={(e) => setFormData(prev => ({ ...prev, presenter: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label>Presenter Title</Label>
                            <Input
                                value={formData.presenter_title}
                                onChange={(e) => setFormData(prev => ({ ...prev, presenter_title: e.target.value }))}
                                placeholder="e.g., Product Manager"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Date *</Label>
                            <Input
                                type="date"
                                value={formData.scheduled_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <Label>Time *</Label>
                            <Input
                                value={formData.scheduled_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                                placeholder="e.g., 2:00 PM EST"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Duration (minutes)</Label>
                            <Input
                                type="number"
                                value={formData.duration_minutes}
                                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                            />
                        </div>
                        <div>
                            <Label>Max Attendees</Label>
                            <Input
                                type="number"
                                value={formData.max_attendees}
                                onChange={(e) => setFormData(prev => ({ ...prev, max_attendees: parseInt(e.target.value) || 100 }))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Meeting URL</Label>
                        <Input
                            value={formData.meeting_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
                            placeholder="Zoom/Teams/Meet URL"
                        />
                    </div>

                    {webinar && (
                        <div>
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="live">Live Now</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div>
                        <Label>Tags</Label>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Add tag"
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                            />
                            <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags?.map(tag => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full cursor-pointer hover:bg-red-100 hover:text-red-800"
                                    onClick={() => handleRemoveTag(tag)}
                                >
                                    {tag} ×
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={formData.is_featured}
                            onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_featured: val }))}
                        />
                        <Label>Featured Webinar</Label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (webinar ? "Update" : "Create")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}