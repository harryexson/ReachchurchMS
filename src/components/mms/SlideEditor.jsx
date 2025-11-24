import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, Link as LinkIcon, Video, Loader2 } from "lucide-react";
import VideoOptionsModal from "./VideoOptionsModal";

export default function SlideEditor({ slide, onChange, slideNumber, totalSlides }) {
    const [isUploading, setIsUploading] = React.useState(false);
    const [showVideoOptions, setShowVideoOptions] = React.useState(false);

    const handleFileUpload = async (e, mediaType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert(`File too large. Maximum size: ${mediaType === 'video' ? '50MB' : '5MB'}`);
            return;
        }

        setIsUploading(true);
        try {
            const { UploadFile } = await import("@/integrations/Core");
            const result = await UploadFile({ file });
            onChange({ 
                media_url: result.file_url,
                media_type: mediaType
            });
        } catch (error) {
            console.error("Failed to upload file:", error);
            alert("Failed to upload file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleVideoSelected = (videoData) => {
        onChange(videoData);
    };

    const quickLinks = [
        { value: `${window.location.origin}/public/member-registration`, label: "Member Registration" },
        { value: `${window.location.origin}/public/visitor-card`, label: "Visitor Connect Card" },
        { value: `${window.location.origin}/public/giving`, label: "Online Giving" }
    ];

    return (
        <>
            <Card className="border-2 border-blue-200">
                <CardHeader>
                    <CardTitle>Edit Slide {slideNumber || slide.slide_number}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Slide Type */}
                    <div className="space-y-2">
                        <Label>Slide Type</Label>
                        <Select 
                            value={slide.slide_type}
                            onValueChange={(value) => onChange({ slide_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="image_text">Image + Text</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="text_only">Text Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input 
                            value={slide.title || ""}
                            onChange={(e) => onChange({ title: e.target.value })}
                            placeholder="Slide title"
                        />
                    </div>

                    {/* Body Text */}
                    <div className="space-y-2">
                        <Label>Body Text</Label>
                        <Textarea 
                            value={slide.body_text || ""}
                            onChange={(e) => onChange({ body_text: e.target.value })}
                            placeholder="Main content for this slide"
                            rows={4}
                        />
                    </div>

                    {/* Media Upload */}
                    {slide.slide_type !== 'text_only' && (
                        <div className="space-y-2">
                            <Label>
                                {slide.slide_type === 'video' ? 'Add Video' : 
                                 slide.slide_type === 'audio' ? 'Upload Audio' : 'Upload Image'}
                            </Label>
                            
                            {/* Video Options - 3 buttons */}
                            {slide.slide_type === 'video' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowVideoOptions(true)}
                                        className="h-24 flex-col gap-2"
                                    >
                                        <Upload className="w-8 h-8 text-blue-600" />
                                        <span className="text-sm font-semibold">Upload Video</span>
                                        <span className="text-xs text-slate-500">Pre-recorded</span>
                                    </Button>
                                    
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowVideoOptions(true)}
                                        className="h-24 flex-col gap-2"
                                    >
                                        <LinkIcon className="w-8 h-8 text-green-600" />
                                        <span className="text-sm font-semibold">Add Link</span>
                                        <span className="text-xs text-slate-500">YouTube, Vimeo</span>
                                    </Button>
                                    
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowVideoOptions(true)}
                                        className="h-24 flex-col gap-2"
                                    >
                                        <Video className="w-8 h-8 text-red-600" />
                                        <span className="text-sm font-semibold">Record Now</span>
                                        <span className="text-xs text-slate-500">HD/4K Recording</span>
                                    </Button>
                                </div>
                            )}

                            {/* Audio/Image Upload */}
                            {slide.slide_type !== 'video' && (
                                <div className="flex gap-3">
                                    <input 
                                        type="file"
                                        id={`media-upload-${slideNumber || slide.slide_number}`}
                                        className="hidden"
                                        accept={
                                            slide.slide_type === 'image_text' ? 'image/*' :
                                            slide.slide_type === 'audio' ? 'audio/*' : '*'
                                        }
                                        onChange={(e) => handleFileUpload(e, 
                                            slide.slide_type === 'image_text' ? 'image' : 'audio'
                                        )}
                                    />
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        onClick={() => document.getElementById(`media-upload-${slideNumber || slide.slide_number}`).click()}
                                        disabled={isUploading}
                                        className="flex-1"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {isUploading ? "Uploading..." : `Upload ${slide.slide_type === 'audio' ? 'Audio (max 5MB)' : 'Image (max 5MB)'}`}
                                    </Button>
                                </div>
                            )}

                            {/* Media Preview */}
                            {slide.media_url && (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800 mb-2">✓ Media added successfully</p>
                                    <div className="mt-2">
                                        {slide.media_type === 'image' && (
                                            <img src={slide.media_url} alt="Preview" className="w-full max-h-48 object-cover rounded" />
                                        )}
                                        {slide.media_type === 'video' && (
                                            <video src={slide.media_url} controls className="w-full max-h-48 rounded" />
                                        )}
                                        {slide.media_type === 'audio' && (
                                            <audio src={slide.media_url} controls className="w-full" />
                                        )}
                                    </div>
                                    <Button 
                                        type="button"
                                        variant="ghost" 
                                        size="sm" 
                                        className="mt-2 text-red-600 hover:text-red-700"
                                        onClick={() => onChange({ media_url: "", media_type: "none" })}
                                    >
                                        Remove Media
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Background Color</Label>
                            <div className="flex gap-2">
                                <input 
                                    type="color"
                                    value={slide.background_color || "#ffffff"}
                                    onChange={(e) => onChange({ background_color: e.target.value })}
                                    className="w-12 h-10 rounded border"
                                />
                                <Input 
                                    value={slide.background_color || "#ffffff"}
                                    onChange={(e) => onChange({ background_color: e.target.value })}
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Text Color</Label>
                            <div className="flex gap-2">
                                <input 
                                    type="color"
                                    value={slide.text_color || "#000000"}
                                    onChange={(e) => onChange({ text_color: e.target.value })}
                                    className="w-12 h-10 rounded border"
                                />
                                <Input 
                                    value={slide.text_color || "#000000"}
                                    onChange={(e) => onChange({ text_color: e.target.value })}
                                    placeholder="#000000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Call-to-Action Section */}
                    <div className="border-t pt-6 space-y-4">
                        <h3 className="font-semibold text-slate-900">Call-to-Action Button (Optional)</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Button Text</Label>
                                <Input
                                    value={slide.cta_text || ""}
                                    onChange={(e) => onChange({ cta_text: e.target.value })}
                                    placeholder="Register Now"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Button Type</Label>
                                <Select 
                                    value={slide.cta_type || "custom"} 
                                    onValueChange={(value) => onChange({ cta_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="register">Register</SelectItem>
                                        <SelectItem value="give">Give/Donate</SelectItem>
                                        <SelectItem value="rsvp">RSVP</SelectItem>
                                        <SelectItem value="learn_more">Learn More</SelectItem>
                                        <SelectItem value="share">Share</SelectItem>
                                        <SelectItem value="respond">Respond</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Quick Link Options</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {quickLinks.map((link) => (
                                    <Button
                                        key={link.value}
                                        type="button"
                                        variant={slide.cta_url === link.value ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onChange({ cta_url: link.value })}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Custom Link URL</Label>
                            <Input
                                value={slide.cta_url || ""}
                                onChange={(e) => onChange({ cta_url: e.target.value })}
                                placeholder="https://example.com/register"
                                type="url"
                            />
                            <p className="text-xs text-slate-500">
                                The link where users will be directed when they click the CTA button
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Video Options Modal */}
            <VideoOptionsModal
                isOpen={showVideoOptions}
                onClose={() => setShowVideoOptions(false)}
                onVideoSelected={handleVideoSelected}
            />
        </>
    );
}