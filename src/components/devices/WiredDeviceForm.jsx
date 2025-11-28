import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
    Monitor, Printer, Cable, Usb, Save, X,
    Speaker, Camera, Laptop
} from "lucide-react";

const DEVICE_TYPES = [
    { value: "display", label: "Display / Monitor / TV", icon: Monitor },
    { value: "printer", label: "Printer", icon: Printer },
    { value: "computer", label: "Computer / Laptop", icon: Laptop },
    { value: "audio", label: "Audio Device", icon: Speaker },
    { value: "camera", label: "Camera", icon: Camera },
    { value: "other", label: "Other", icon: Cable }
];

const DEVICE_SUBTYPES = {
    display: [
        { value: "tv", label: "Smart TV" },
        { value: "monitor", label: "Monitor" },
        { value: "projector", label: "Projector" },
        { value: "chromecast", label: "Chromecast" },
        { value: "firetv", label: "Fire TV Stick" },
        { value: "roku", label: "Roku" },
        { value: "other", label: "Other Display" }
    ],
    printer: [
        { value: "receipt", label: "Receipt Printer" },
        { value: "label", label: "Label Printer" },
        { value: "document", label: "Document Printer" },
        { value: "other", label: "Other Printer" }
    ],
    computer: [
        { value: "laptop", label: "Laptop" },
        { value: "desktop", label: "Desktop" },
        { value: "tablet", label: "Tablet" },
        { value: "other", label: "Other" }
    ],
    audio: [
        { value: "speaker", label: "Speaker" },
        { value: "soundbar", label: "Soundbar" },
        { value: "other", label: "Other Audio" }
    ],
    camera: [
        { value: "webcam", label: "Webcam" },
        { value: "ptz_camera", label: "PTZ Camera" },
        { value: "other", label: "Other Camera" }
    ],
    other: [
        { value: "other", label: "Other Device" }
    ]
};

const CONNECTION_TYPES = [
    { value: "hdmi", label: "HDMI Cable", icon: "🔌" },
    { value: "usb", label: "USB Cable", icon: "🔗" },
    { value: "displayport", label: "DisplayPort", icon: "🖥️" },
    { value: "vga", label: "VGA Cable", icon: "📺" },
    { value: "parallel", label: "Parallel / Printer Cable", icon: "🖨️" },
    { value: "serial", label: "Serial / COM Port", icon: "⚡" },
    { value: "ethernet", label: "Ethernet Cable", icon: "🌐" },
    { value: "aux", label: "AUX / 3.5mm", icon: "🎵" },
    { value: "optical", label: "Optical Audio", icon: "💿" },
    { value: "wifi", label: "WiFi", icon: "📶" },
    { value: "bluetooth", label: "Bluetooth", icon: "📡" }
];

const LOCATIONS = [
    { value: "sanctuary", label: "Sanctuary" },
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
    { value: "office", label: "Office" },
    { value: "conference_room", label: "Conference Room" },
    { value: "media_booth", label: "Media / AV Booth" },
    { value: "stage", label: "Stage" },
    { value: "parking_lot", label: "Parking Lot" },
    { value: "outdoor", label: "Outdoor Area" },
    { value: "other", label: "Other" }
];

const PURPOSES = {
    display: [
        { value: "lobby_display", label: "Lobby Display" },
        { value: "sanctuary_display", label: "Sanctuary Display" },
        { value: "welcome_display", label: "Welcome Display" },
        { value: "cafe_display", label: "Café Menu/Display" },
        { value: "kids_display", label: "Kids Area Display" },
        { value: "kitchen_display", label: "Kitchen Display" },
        { value: "announcement_board", label: "Announcement Board" },
        { value: "presentation", label: "Presentation" },
        { value: "livestream", label: "Livestream Monitor" },
        { value: "general", label: "General Use" }
    ],
    printer: [
        { value: "receipt_printer", label: "Receipt Printer" },
        { value: "label_printer", label: "Label Printer" },
        { value: "document_printer", label: "Document Printer" },
        { value: "general", label: "General Printing" }
    ],
    audio: [
        { value: "audio_output", label: "Audio Output" },
        { value: "general", label: "General Audio" }
    ],
    camera: [
        { value: "video_capture", label: "Video Capture" },
        { value: "livestream", label: "Livestream Camera" },
        { value: "general", label: "General Use" }
    ],
    computer: [
        { value: "presentation", label: "Presentation" },
        { value: "livestream", label: "Livestream Control" },
        { value: "general", label: "General Use" }
    ],
    other: [
        { value: "general", label: "General Use" }
    ]
};

export default function WiredDeviceForm({ onSubmit, onCancel, initialData }) {
    const [formData, setFormData] = useState(initialData || {
        device_name: "",
        device_type: "display",
        device_subtype: "",
        connection_type: "hdmi",
        port_number: "",
        assigned_location: "",
        location_notes: "",
        purpose: "general",
        brand: "",
        model: "",
        serial_number: "",
        status: "connected"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            last_seen: new Date().toISOString()
        });
    };

    const selectedType = DEVICE_TYPES.find(t => t.value === formData.device_type);
    const Icon = selectedType?.icon || Cable;

    return (
        <Card className="border-2 border-blue-200">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    {initialData ? "Edit Device" : "Add Wired Device"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Device Name */}
                    <div>
                        <Label>Device Name *</Label>
                        <Input
                            value={formData.device_name}
                            onChange={(e) => setFormData({...formData, device_name: e.target.value})}
                            placeholder="e.g., Lobby TV, Kitchen Printer"
                            required
                        />
                    </div>

                    {/* Device Type & Subtype */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Device Type *</Label>
                            <Select
                                value={formData.device_type}
                                onValueChange={(value) => setFormData({
                                    ...formData, 
                                    device_type: value,
                                    device_subtype: "",
                                    purpose: "general"
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEVICE_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Specific Type</Label>
                            <Select
                                value={formData.device_subtype}
                                onValueChange={(value) => setFormData({...formData, device_subtype: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(DEVICE_SUBTYPES[formData.device_type] || []).map(sub => (
                                        <SelectItem key={sub.value} value={sub.value}>
                                            {sub.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Connection Type & Port */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Connection Type *</Label>
                            <Select
                                value={formData.connection_type}
                                onValueChange={(value) => setFormData({...formData, connection_type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONNECTION_TYPES.map(conn => (
                                        <SelectItem key={conn.value} value={conn.value}>
                                            {conn.icon} {conn.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Port/Slot (Optional)</Label>
                            <Input
                                value={formData.port_number}
                                onChange={(e) => setFormData({...formData, port_number: e.target.value})}
                                placeholder="e.g., HDMI 2, USB 3, COM1"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Assigned Location *</Label>
                            <Select
                                value={formData.assigned_location}
                                onValueChange={(value) => setFormData({...formData, assigned_location: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOCATIONS.map(loc => (
                                        <SelectItem key={loc.value} value={loc.value}>
                                            {loc.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Purpose</Label>
                            <Select
                                value={formData.purpose}
                                onValueChange={(value) => setFormData({...formData, purpose: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(PURPOSES[formData.device_type] || PURPOSES.other).map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Brand & Model */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Brand</Label>
                            <Input
                                value={formData.brand}
                                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                                placeholder="e.g., Samsung, Epson"
                            />
                        </div>
                        <div>
                            <Label>Model</Label>
                            <Input
                                value={formData.model}
                                onChange={(e) => setFormData({...formData, model: e.target.value})}
                                placeholder="e.g., UN55TU8000"
                            />
                        </div>
                        <div>
                            <Label>Serial #</Label>
                            <Input
                                value={formData.serial_number}
                                onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    {/* Location Notes */}
                    <div>
                        <Label>Location Details</Label>
                        <Textarea
                            value={formData.location_notes}
                            onChange={(e) => setFormData({...formData, location_notes: e.target.value})}
                            placeholder="e.g., Mounted on left wall near entrance, connected to AV receiver"
                            rows={2}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            {initialData ? "Update Device" : "Add Device"}
                        </Button>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}