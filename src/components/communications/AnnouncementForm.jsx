import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const initialAnnouncementState = {
    title: "",
    message: "",
    category: "general",
    target_audience: "all_members",
    publish_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    priority: "medium",
    status: "draft"
};

export default function AnnouncementForm({ isOpen, setIsOpen, onSubmit, announcement }) {
    const [formData, setFormData] = useState(initialAnnouncementState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (announcement) {
            setFormData({
                title: announcement.title || "",
                message: announcement.message || "",
                category: announcement.category || "general",
                target_audience: announcement.target_audience || "all_members",
                publish_date: announcement.publish_date || new Date().toISOString().split('T')[0],
                expiry_date: announcement.expiry_date || "",
                priority: announcement.priority || "medium",
                status: announcement.status || "draft"
            });
        } else {
            setFormData(initialAnnouncementState);
        }
    }, [announcement, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onSubmit(formData);
        setIsLoading(false);
    };

    const handleSaveAndPublish = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onSubmit({ ...formData, status: "published" });
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{announcement ? "Edit Announcement" : "Create New Announcement"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={String(formData.category)} onValueChange={(value) => handleSelectChange('category', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="ministry">Ministry</SelectItem>
                                    <SelectItem value="prayer_request">Prayer Request</SelectItem>
                                    <SelectItem value="celebration">Celebration</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={String(formData.priority)} onValueChange={(value) => handleSelectChange('priority', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target_audience">Target Audience</Label>
                            <Select value={String(formData.target_audience)} onValueChange={(value) => handleSelectChange('target_audience', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_members">All Members</SelectItem>
                                    <SelectItem value="members_only">Members Only</SelectItem>
                                    <SelectItem value="visitors">Visitors</SelectItem>
                                    <SelectItem value="volunteers">Volunteers</SelectItem>
                                    <SelectItem value="specific_ministry">Specific Ministry</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={String(formData.status)} onValueChange={(value) => handleSelectChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="publish_date">Publish Date</Label>
                            <Input id="publish_date" name="publish_date" type="date" value={formData.publish_date} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                            <Input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={5} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="outline" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Draft"}
                        </Button>
                        <Button type="button" onClick={handleSaveAndPublish} disabled={isLoading}>
                            {isLoading ? "Publishing..." : "Save & Publish"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}