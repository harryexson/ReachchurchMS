import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link as LinkIcon, Upload, Video, Loader2 } from "lucide-react";
import VideoRecorder from "./VideoRecorder";

export default function VideoOptionsModal({ isOpen, onClose, onVideoSelected }) {
    const [activeTab, setActiveTab] = useState("upload");
    const [videoUrl, setVideoUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const handleUrlSubmit = () => {
        if (!videoUrl) {
            alert("Please enter a video URL");
            return;
        }

        // Validate URL
        try {
            new URL(videoUrl);
            onVideoSelected({
                media_url: videoUrl,
                media_type: 'video'
            });
            onClose();
        } catch (error) {
            alert("Please enter a valid URL (e.g., https://youtube.com/watch?v=...)");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            alert("Please select a video file");
            return;
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("Video file too large. Maximum size: 50MB");
            return;
        }

        setIsUploading(true);
        try {
            const { UploadFile } = await import("@/integrations/Core");
            const result = await UploadFile({ file });
            
            onVideoSelected({
                media_url: result.file_url,
                media_type: 'video'
            });
            onClose();
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload video. Please try again.");
        }
        setIsUploading(false);
    };

    const handleRecordedVideo = (videoData) => {
        onVideoSelected(videoData);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Video to Slide</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload
                        </TabsTrigger>
                        <TabsTrigger value="link" className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Link
                        </TabsTrigger>
                        <TabsTrigger value="record" className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Record Now
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4 pt-4">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="font-semibold text-lg mb-2">Upload Pre-recorded Video</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Select a video file from your device (max 50MB)
                            </p>
                            <input
                                type="file"
                                id="video-upload"
                                accept="video/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button
                                onClick={() => document.getElementById('video-upload').click()}
                                disabled={isUploading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Choose Video File
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-slate-500 mt-3">
                                Supported formats: MP4, WebM, MOV, AVI
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-4 pt-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="video-url">Video URL</Label>
                                <Input
                                    id="video-url"
                                    type="url"
                                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    className="mt-2"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Paste a link from YouTube, Vimeo, or any direct video URL
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Supported Platforms:</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• YouTube (e.g., https://youtube.com/watch?v=...)</li>
                                    <li>• Vimeo (e.g., https://vimeo.com/123456789)</li>
                                    <li>• Direct video links (e.g., https://example.com/video.mp4)</li>
                                    <li>• Facebook Video</li>
                                </ul>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button onClick={handleUrlSubmit} className="bg-blue-600 hover:bg-blue-700">
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    Add Video Link
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="record" className="pt-4">
                        <VideoRecorder
                            onVideoReady={handleRecordedVideo}
                            onCancel={onClose}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}