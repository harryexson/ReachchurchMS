import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Monitor, Calendar, Palette } from "lucide-react";

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
    { value: "outdoor", label: "Outdoor Area" }
];

const CATEGORIES = [
    { value: "general", label: "General" },
    { value: "urgent", label: "Urgent" },
    { value: "event", label: "Event" },
    { value: "ministry", label: "Ministry" },
    { value: "welcome", label: "Welcome" },
    { value: "scripture", label: "Scripture" },
    { value: "countdown", label: "Countdown" }
];

export default function ScheduledAnnouncementForm({ isOpen, onClose, onSave, announcement }) {
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        category: "general",
        display_locations: [],
        start_datetime: "",
        end_datetime: "",
        background_color: "#1e3a8a",
        text_color: "#ffffff",
        priority: "normal",
        is_active: true
    });

    useEffect(() => {
        if (announcement) {
            setFormData({
                title: announcement.title || "",
                message: announcement.message || "",
                category: announcement.category || "general",
                display_locations: announcement.display_locations || [],
                start_datetime: announcement.start_datetime || "",
                end_datetime: announcement.end_datetime || "",
                background_color: announcement.background_color || "#1e3a8a",
                text_color: announcement.text_color || "#ffffff",
                priority: announcement.priority || "normal",
                is_active: announcement.is_active !== false
            });
        } else {
            setFormData({
                title: "",
                message: "",
                category: "general",
                display_locations: [],
                start_datetime: "",
                end_datetime: "",
                background_color: "#1e3a8a",
                text_color: "#ffffff",
                priority: "normal",
                is_active: true
            });
        }
    }, [announcement, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const toggleLocation = (location) => {
        const locations = formData.display_locations.includes(location)
            ? formData.display_locations.filter(l => l !== location)
            : [...formData.display_locations, location];
        setFormData({ ...formData, display_locations: locations });
    };

    const selectAllLocations = () => {
        setFormData({ ...formData, display_locations: LOCATIONS.map(l => l.value) });
    };

    const clearAllLocations = () => {
        setFormData({ ...formData, display_locations: [] });
    };

    const colorPresets = [
        { bg: "#1e3a8a", text: "#ffffff", label: "Blue" },
        { bg: "#15803d", text: "#ffffff", label: "Green" },
        { bg: "#b91c1c", text: "#ffffff", label: "Red" },
        { bg: "#7c3aed", text: "#ffffff", label: "Purple" },
        { bg: "#ea580c", text: "#ffffff", label: "Orange" },
        { bg: "#0f172a", text: "#ffffff", label: "Dark" },
        { bg: "#ffffff", text: "#1e293b", label: "Light" }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-purple-600" />
                        {announcement ? "Edit Announcement" : "Create Display Announcement"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Announcement title..."
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Message *</Label>
                            <Textarea
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                placeholder="Your announcement message..."
                                rows={4}
                                required
                            />
                        </div>

                        <div>
                            <Label>Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({...formData, category: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({...formData, priority: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Display Locations */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Display Locations</Label>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={selectAllLocations}>
                                    Select All
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={clearAllLocations}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                            {LOCATIONS.map(loc => (
                                <div key={loc.value} className="flex items-center gap-2">
                                    <Checkbox
                                        id={loc.value}
                                        checked={formData.display_locations.includes(loc.value)}
                                        onCheckedChange={() => toggleLocation(loc.value)}
                                    />
                                    <label htmlFor={loc.value} className="text-sm cursor-pointer">
                                        {loc.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Start Date/Time
                            </Label>
                            <Input
                                type="datetime-local"
                                value={formData.start_datetime}
                                onChange={(e) => setFormData({...formData, start_datetime: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> End Date/Time
                            </Label>
                            <Input
                                type="datetime-local"
                                value={formData.end_datetime}
                                onChange={(e) => setFormData({...formData, end_datetime: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Styling */}
                    <div>
                        <Label className="flex items-center gap-2 mb-2">
                            <Palette className="w-4 h-4" /> Appearance
                        </Label>
                        <div className="flex gap-2 mb-3">
                            {colorPresets.map((preset, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setFormData({
                                        ...formData,
                                        background_color: preset.bg,
                                        text_color: preset.text
                                    })}
                                    className={`w-8 h-8 rounded-full border-2 ${
                                        formData.background_color === preset.bg 
                                            ? 'border-blue-500 ring-2 ring-blue-200' 
                                            : 'border-slate-200'
                                    }`}
                                    style={{ backgroundColor: preset.bg }}
                                    title={preset.label}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Background Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                                        className="w-12 h-8 p-1"
                                    />
                                    <Input
                                        value={formData.background_color}
                                        onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs">Text Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formData.text_color}
                                        onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                                        className="w-12 h-8 p-1"
                                    />
                                    <Input
                                        value={formData.text_color}
                                        onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <Label>Preview</Label>
                        <div 
                            className="p-6 rounded-lg text-center mt-2"
                            style={{ 
                                backgroundColor: formData.background_color,
                                color: formData.text_color
                            }}
                        >
                            <h3 className="text-xl font-bold mb-2">{formData.title || "Announcement Title"}</h3>
                            <p>{formData.message || "Your announcement message will appear here..."}</p>
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-medium">Active</p>
                            <p className="text-sm text-slate-500">Show this announcement on displays</p>
                        </div>
                        <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                            {announcement ? "Update" : "Create"} Announcement
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}