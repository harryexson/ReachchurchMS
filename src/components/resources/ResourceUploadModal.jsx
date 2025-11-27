import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2, Link as LinkIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

const categories = [
    { value: "templates", label: "Templates" },
    { value: "guides", label: "Guides & eBooks" },
    { value: "videos", label: "Video Tutorials" },
    { value: "graphics", label: "Graphics & Media" },
    { value: "training", label: "Training Materials" },
    { value: "forms", label: "Forms & Documents" },
    { value: "other", label: "Other" }
];

const fileTypes = [
    { value: "pdf", label: "PDF" },
    { value: "doc", label: "Word Document" },
    { value: "xlsx", label: "Excel/Spreadsheet" },
    { value: "zip", label: "ZIP Archive" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "canva", label: "Canva Template" },
    { value: "link", label: "External Link" }
];

export default function ResourceUploadModal({ isOpen, onClose, onSuccess, resource }) {
    const [formData, setFormData] = useState(resource || {
        title: "",
        description: "",
        category: "",
        file_type: "",
        file_url: "",
        tags: [],
        is_featured: false,
        is_public: true,
        duration: ""
    });
    const [tagInput, setTagInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData(prev => ({ ...prev, file_url }));
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file");
        }
        setIsUploading(false);
    };

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
            if (resource?.id) {
                await base44.entities.Resource.update(resource.id, formData);
            } else {
                await base44.entities.Resource.create(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save resource");
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{resource ? "Edit Resource" : "Upload New Resource"}</DialogTitle>
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
                            <Label>Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>File Type *</Label>
                            <Select
                                value={formData.file_type}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, file_type: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fileTypes.map(ft => (
                                        <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.file_type === "link" || formData.file_type === "canva" ? (
                        <div>
                            <Label>URL</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <Input
                                    value={formData.file_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                                    placeholder="https://..."
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Label>Upload File</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                                {formData.file_url ? (
                                    <div className="text-sm text-green-600">
                                        ✓ File uploaded
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            onClick={() => setFormData(prev => ({ ...prev, file_url: "" }))}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        {isUploading ? (
                                            <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-600" />
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                                                <p className="text-sm text-slate-600">Click to upload</p>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    {formData.file_type === "video" && (
                        <div>
                            <Label>Duration</Label>
                            <Input
                                value={formData.duration}
                                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                                placeholder="e.g., 15:00"
                            />
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
                            {formData.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full cursor-pointer hover:bg-red-100 hover:text-red-800"
                                    onClick={() => handleRemoveTag(tag)}
                                >
                                    {tag} ×
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.is_featured}
                                onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_featured: val }))}
                            />
                            <Label>Featured</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.is_public}
                                onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_public: val }))}
                            />
                            <Label>Public</Label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (resource ? "Update" : "Upload")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}