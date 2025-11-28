import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Monitor, Upload, Image, Video, Radio, Calendar, Megaphone,
    Plus, Trash2, Edit, Send, Eye, Clock, MapPin, CheckCircle,
    Loader2, Play, Pause, FileImage, Presentation, Coffee
} from "lucide-react";

const LOCATIONS = [
    { value: "sanctuary", label: "Sanctuary / Auditorium" },
    { value: "lobby", label: "Lobby" },
    { value: "welcome_center", label: "Welcome Center" },
    { value: "cafe", label: "Café" },
    { value: "bookstore", label: "Bookstore" },
    { value: "kitchen", label: "Kitchen" },
    { value: "patio", label: "Patio" },
    { value: "lounge", label: "Lounge" },
    { value: "porch", label: "Porch" },
    { value: "dining", label: "Dining Area" },
    { value: "sunday_school", label: "Sunday School" },
    { value: "kids_area", label: "Kids Area" },
    { value: "youth_room", label: "Youth Room" },
    { value: "nursery", label: "Nursery" },
    { value: "fellowship_hall", label: "Fellowship Hall" },
    { value: "overflow", label: "Overflow Room" },
    { value: "office", label: "Office" },
    { value: "conference_room", label: "Conference Room" },
    { value: "outdoor", label: "Outdoor Area" }
];

const CONTENT_TYPES = [
    { value: "image", label: "Image/Graphic", icon: Image },
    { value: "slideshow", label: "Slideshow/PowerPoint", icon: Presentation },
    { value: "video", label: "Video", icon: Video },
    { value: "livestream", label: "Livestream Feed", icon: Radio },
    { value: "announcement", label: "Announcement", icon: Megaphone },
    { value: "event", label: "Event Promotion", icon: Calendar },
    { value: "menu", label: "Menu Board", icon: Coffee },
    { value: "welcome", label: "Welcome Message", icon: Monitor },
    { value: "scripture", label: "Scripture/Quote", icon: FileImage },
    { value: "countdown", label: "Event Countdown", icon: Clock }
];

export default function DisplayContentManager() {
    const [contents, setContents] = useState([]);
    const [displays, setDisplays] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingContent, setEditingContent] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [filterLocation, setFilterLocation] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [pushingContent, setPushingContent] = useState(null);
    const [pushSuccess, setPushSuccess] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [user, contentList, deviceList, eventList] = await Promise.all([
                base44.auth.me(),
                base44.entities.DisplayContent.list("-created_date"),
                base44.entities.ConnectedDevice.filter({ device_type: "display" }),
                base44.entities.Event.filter({ status: "planned" }, "-start_datetime", 20)
            ]);
            setCurrentUser(user);
            setContents(contentList);
            setDisplays(deviceList);
            setEvents(eventList);
        } catch (err) {
            console.error("Error loading data:", err);
        }
        setIsLoading(false);
    };

    const handleSaveContent = async (contentData) => {
        try {
            if (editingContent) {
                await base44.entities.DisplayContent.update(editingContent.id, contentData);
            } else {
                await base44.entities.DisplayContent.create({
                    ...contentData,
                    created_by: currentUser?.email
                });
            }
            loadData();
            setShowForm(false);
            setEditingContent(null);
        } catch (err) {
            console.error("Error saving content:", err);
        }
    };

    const handleDeleteContent = async (id) => {
        if (!confirm("Delete this content?")) return;
        try {
            await base44.entities.DisplayContent.delete(id);
            loadData();
        } catch (err) {
            console.error("Error deleting content:", err);
        }
    };

    const handlePushToDisplays = async (content) => {
        setPushingContent(content.id);
        try {
            // Update all displays in assigned locations
            const targetDisplays = displays.filter(d => 
                content.assigned_locations?.includes(d.assigned_location)
            );

            for (const display of targetDisplays) {
                await base44.entities.ConnectedDevice.update(display.id, {
                    settings: {
                        ...display.settings,
                        current_content_id: content.id,
                        last_content_push: new Date().toISOString()
                    }
                });
            }

            setPushSuccess(`Pushed to ${targetDisplays.length} display(s)`);
            setTimeout(() => setPushSuccess(null), 3000);
            loadData();
        } catch (err) {
            console.error("Error pushing content:", err);
        }
        setPushingContent(null);
    };

    const handleToggleActive = async (content) => {
        try {
            await base44.entities.DisplayContent.update(content.id, {
                is_active: !content.is_active
            });
            loadData();
        } catch (err) {
            console.error("Error toggling content:", err);
        }
    };

    const filteredContents = contents.filter(c => {
        const matchesLocation = filterLocation === "all" || 
            c.assigned_locations?.includes(filterLocation);
        const matchesType = filterType === "all" || c.content_type === filterType;
        return matchesLocation && matchesType;
    });

    const getContentIcon = (type) => {
        const contentType = CONTENT_TYPES.find(t => t.value === type);
        return contentType?.icon || Monitor;
    };

    const getDisplayCountByLocation = (locations) => {
        if (!locations?.length) return 0;
        return displays.filter(d => locations.includes(d.assigned_location)).length;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Monitor className="w-8 h-8 text-blue-600" />
                            Display Content Manager
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Manage and push content to TV displays across all locations
                        </p>
                    </div>
                    <Button
                        onClick={() => { setEditingContent(null); setShowForm(true); }}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Content
                    </Button>
                </div>

                {/* Success Alert */}
                {pushSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">{pushSuccess}</AlertDescription>
                    </Alert>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total Content</p>
                                    <p className="text-2xl font-bold">{contents.length}</p>
                                </div>
                                <FileImage className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Active</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {contents.filter(c => c.is_active).length}
                                    </p>
                                </div>
                                <Play className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Connected Displays</p>
                                    <p className="text-2xl font-bold text-blue-600">{displays.length}</p>
                                </div>
                                <Monitor className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Locations</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {new Set(displays.map(d => d.assigned_location)).size}
                                    </p>
                                </div>
                                <MapPin className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4 flex-wrap">
                            <Select value={filterLocation} onValueChange={setFilterLocation}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter by location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {LOCATIONS.map(loc => (
                                        <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {CONTENT_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Grid */}
                {filteredContents.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Monitor className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-600 mb-4">No content found</p>
                            <Button onClick={() => setShowForm(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Content
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContents.map(content => {
                            const Icon = getContentIcon(content.content_type);
                            const displayCount = getDisplayCountByLocation(content.assigned_locations);
                            
                            return (
                                <Card key={content.id} className={`hover:shadow-lg transition-all ${!content.is_active ? 'opacity-60' : ''}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    <Icon className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{content.title}</CardTitle>
                                                    <Badge variant="outline" className="text-xs mt-1">
                                                        {CONTENT_TYPES.find(t => t.value === content.content_type)?.label}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={content.is_active}
                                                onCheckedChange={() => handleToggleActive(content)}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Preview */}
                                        {content.media_urls?.[0] && (
                                            <div className="h-32 bg-slate-100 rounded-lg overflow-hidden">
                                                <img 
                                                    src={content.media_urls[0]} 
                                                    alt={content.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        
                                        {content.announcement_text && (
                                            <p className="text-sm text-slate-600 line-clamp-2">
                                                {content.announcement_text}
                                            </p>
                                        )}

                                        {/* Locations */}
                                        <div>
                                            <p className="text-xs text-slate-500 mb-2">Assigned Locations:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {content.assigned_locations?.slice(0, 3).map(loc => (
                                                    <Badge key={loc} variant="outline" className="text-xs">
                                                        {LOCATIONS.find(l => l.value === loc)?.label || loc}
                                                    </Badge>
                                                ))}
                                                {content.assigned_locations?.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{content.assigned_locations.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Display Count */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">
                                                <Monitor className="w-4 h-4 inline mr-1" />
                                                {displayCount} display{displayCount !== 1 ? 's' : ''}
                                            </span>
                                            {content.display_duration && (
                                                <span className="text-slate-500">
                                                    <Clock className="w-4 h-4 inline mr-1" />
                                                    {content.display_duration}s
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2 border-t">
                                            <Button
                                                size="sm"
                                                onClick={() => handlePushToDisplays(content)}
                                                disabled={pushingContent === content.id || displayCount === 0}
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                                {pushingContent === content.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4 mr-1" />
                                                        Push to Displays
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => { setEditingContent(content); setShowForm(true); }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteContent(content.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Content Form Dialog */}
                <ContentFormDialog
                    isOpen={showForm}
                    onClose={() => { setShowForm(false); setEditingContent(null); }}
                    onSave={handleSaveContent}
                    content={editingContent}
                    events={events}
                />
            </div>
        </div>
    );
}

function ContentFormDialog({ isOpen, onClose, onSave, content, events }) {
    const [formData, setFormData] = useState({
        title: "",
        content_type: "image",
        media_urls: [],
        livestream_url: "",
        announcement_text: "",
        event_id: "",
        event_title: "",
        assigned_locations: [],
        display_duration: 10,
        priority: 1,
        is_active: true,
        background_color: "#1e293b",
        text_color: "#ffffff",
        font_size: "large",
        transition_effect: "fade"
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (content) {
            setFormData({
                title: content.title || "",
                content_type: content.content_type || "image",
                media_urls: content.media_urls || [],
                livestream_url: content.livestream_url || "",
                announcement_text: content.announcement_text || "",
                event_id: content.event_id || "",
                event_title: content.event_title || "",
                assigned_locations: content.assigned_locations || [],
                display_duration: content.display_duration || 10,
                priority: content.priority || 1,
                is_active: content.is_active !== false,
                background_color: content.background_color || "#1e293b",
                text_color: content.text_color || "#ffffff",
                font_size: content.font_size || "large",
                transition_effect: content.transition_effect || "fade"
            });
        } else {
            setFormData({
                title: "",
                content_type: "image",
                media_urls: [],
                livestream_url: "",
                announcement_text: "",
                event_id: "",
                event_title: "",
                assigned_locations: [],
                display_duration: 10,
                priority: 1,
                is_active: true,
                background_color: "#1e293b",
                text_color: "#ffffff",
                font_size: "large",
                transition_effect: "fade"
            });
        }
    }, [content, isOpen]);

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files?.length) return;

        setUploading(true);
        const urls = [...formData.media_urls];
        
        for (const file of files) {
            try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                urls.push(file_url);
            } catch (err) {
                console.error("Upload error:", err);
            }
        }
        
        setFormData({ ...formData, media_urls: urls });
        setUploading(false);
    };

    const removeMedia = (index) => {
        const urls = formData.media_urls.filter((_, i) => i !== index);
        setFormData({ ...formData, media_urls: urls });
    };

    const toggleLocation = (location) => {
        const locations = formData.assigned_locations.includes(location)
            ? formData.assigned_locations.filter(l => l !== location)
            : [...formData.assigned_locations, location];
        setFormData({ ...formData, assigned_locations: locations });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {content ? "Edit Content" : "Add New Content"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Content title"
                                required
                            />
                        </div>

                        <div>
                            <Label>Content Type *</Label>
                            <Select
                                value={formData.content_type}
                                onValueChange={(value) => setFormData({...formData, content_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONTENT_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Display Duration (seconds)</Label>
                            <Input
                                type="number"
                                value={formData.display_duration}
                                onChange={(e) => setFormData({...formData, display_duration: parseInt(e.target.value) || 10})}
                                min={1}
                            />
                        </div>
                    </div>

                    {/* Media Upload for image/slideshow/video */}
                    {["image", "slideshow", "video"].includes(formData.content_type) && (
                        <div>
                            <Label>Upload Media</Label>
                            <div className="border-2 border-dashed rounded-lg p-4">
                                <input
                                    type="file"
                                    accept={formData.content_type === "video" ? "video/*" : "image/*,.pptx,.ppt,.pdf"}
                                    multiple={formData.content_type === "slideshow"}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="media-upload"
                                />
                                <label htmlFor="media-upload" className="cursor-pointer block text-center">
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-600">Click to upload files</p>
                                        </>
                                    )}
                                </label>
                                {formData.media_urls.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {formData.media_urls.map((url, idx) => (
                                            <div key={idx} className="relative">
                                                <img src={url} alt="" className="w-20 h-20 object-cover rounded" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedia(idx)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Livestream URL */}
                    {formData.content_type === "livestream" && (
                        <div>
                            <Label>Livestream URL</Label>
                            <Input
                                value={formData.livestream_url}
                                onChange={(e) => setFormData({...formData, livestream_url: e.target.value})}
                                placeholder="https://youtube.com/live/... or embed URL"
                            />
                        </div>
                    )}

                    {/* Announcement/Scripture Text */}
                    {["announcement", "welcome", "scripture"].includes(formData.content_type) && (
                        <div>
                            <Label>Display Text</Label>
                            <Textarea
                                value={formData.announcement_text}
                                onChange={(e) => setFormData({...formData, announcement_text: e.target.value})}
                                rows={4}
                                placeholder="Enter text to display..."
                            />
                            <div className="grid grid-cols-3 gap-4 mt-3">
                                <div>
                                    <Label className="text-xs">Background</Label>
                                    <Input
                                        type="color"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Text Color</Label>
                                    <Input
                                        type="color"
                                        value={formData.text_color}
                                        onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Font Size</Label>
                                    <Select
                                        value={formData.font_size}
                                        onValueChange={(value) => setFormData({...formData, font_size: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                            <SelectItem value="xlarge">Extra Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Event Selection */}
                    {["event", "countdown"].includes(formData.content_type) && (
                        <div>
                            <Label>Select Event</Label>
                            <Select
                                value={formData.event_id}
                                onValueChange={(value) => {
                                    const event = events.find(e => e.id === value);
                                    setFormData({
                                        ...formData, 
                                        event_id: value,
                                        event_title: event?.title || ""
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an event..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {events.map(event => (
                                        <SelectItem key={event.id} value={event.id}>
                                            {event.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Location Assignment */}
                    <div>
                        <Label>Assign to Locations *</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                            {LOCATIONS.map(loc => (
                                <div key={loc.value} className="flex items-center gap-2">
                                    <Checkbox
                                        id={loc.value}
                                        checked={formData.assigned_locations.includes(loc.value)}
                                        onCheckedChange={() => toggleLocation(loc.value)}
                                    />
                                    <label htmlFor={loc.value} className="text-sm cursor-pointer">
                                        {loc.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Priority</Label>
                            <Select
                                value={String(formData.priority)}
                                onValueChange={(value) => setFormData({...formData, priority: parseInt(value)})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Low</SelectItem>
                                    <SelectItem value="2">Normal</SelectItem>
                                    <SelectItem value="3">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Transition Effect</Label>
                            <Select
                                value={formData.transition_effect}
                                onValueChange={(value) => setFormData({...formData, transition_effect: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fade">Fade</SelectItem>
                                    <SelectItem value="slide">Slide</SelectItem>
                                    <SelectItem value="zoom">Zoom</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            {content ? "Update" : "Create"} Content
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}