import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function getEmbedUrl(url) {
    if (!url) return null;
    try {
        const videoUrl = new URL(url);
        
        // YouTube URLs
        if (videoUrl.hostname.includes('youtube.com')) {
            const videoId = videoUrl.searchParams.get('v');
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
            }
        }
        
        // YouTube short URLs
        if (videoUrl.hostname.includes('youtu.be')) {
            const videoId = videoUrl.pathname.slice(1);
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
            }
        }
        
        // Facebook URLs
        if (videoUrl.hostname.includes('facebook.com') || videoUrl.hostname.includes('fb.watch')) {
            // Facebook videos need special handling
            const encodedUrl = encodeURIComponent(url);
            return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=560`;
        }
        
        // Vimeo URLs
        if (videoUrl.hostname.includes('vimeo.com')) {
            const videoId = videoUrl.pathname.split('/').filter(Boolean).pop();
            if (videoId) {
                return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
            }
        }

        // Direct video file URLs (mp4, webm, etc.)
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return url; // Will be handled by video tag
        }
    } catch (error) {
        console.error("Invalid video URL", error);
        return null;
    }
    return null;
}

export default function SermonPlayerModal({ sermon, isOpen, setIsOpen, onDelete, currentUser }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!sermon) return null;

    const embedUrl = getEmbedUrl(sermon.video_url);
    const isDirectVideo = sermon.video_url && sermon.video_url.match(/\.(mp4|webm|ogg)$/i);

    // Check if user can delete (admin, media team, pastor, leaders)
    const canDelete = currentUser && (
        currentUser.role === 'admin' ||
        currentUser.access_level === 'pastor' ||
        currentUser.access_level === 'leader' ||
        currentUser.permissions?.can_manage_content ||
        sermon.created_by === currentUser.email
    );

    const handleDelete = async () => {
        if (!canDelete) return;
        
        setIsDeleting(true);
        try {
            await base44.entities.Sermon.delete(sermon.id);
            setShowDeleteConfirm(false);
            setIsOpen(false);
            if (onDelete) onDelete(sermon.id);
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete sermon: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl">{sermon.title}</DialogTitle>
                            <DialogDescription className="mt-2">
                                <div className="space-y-1">
                                    <p className="text-base">
                                        <strong>Speaker:</strong> {sermon.speaker}
                                    </p>
                                    <p>
                                        <strong>Date:</strong> {new Date(sermon.sermon_date).toLocaleDateString()}
                                    </p>
                                    {sermon.series && (
                                        <p>
                                            <strong>Series:</strong> {sermon.series}
                                        </p>
                                    )}
                                </div>
                            </DialogDescription>
                        </div>
                        {canDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="ml-4"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="py-4">
                    {embedUrl ? (
                        <AspectRatio ratio={16 / 9}>
                            {isDirectVideo ? (
                                <video
                                    controls
                                    className="w-full h-full rounded-lg"
                                    src={embedUrl}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <iframe
                                    src={embedUrl}
                                    title={sermon.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                    allowFullScreen
                                    className="w-full h-full rounded-lg"
                                ></iframe>
                            )}
                        </AspectRatio>
                    ) : (
                        <Alert className="bg-red-50 border-red-200">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <AlertDescription>
                                <p className="font-semibold text-red-900">Unable to load video</p>
                                <p className="text-sm text-red-700 mt-1">
                                    The video URL may be invalid or the video may not be publicly accessible.
                                </p>
                                <p className="text-xs text-red-600 mt-2 font-mono break-all">
                                    URL: {sermon.video_url}
                                </p>
                                <div className="mt-3">
                                    <p className="text-sm font-semibold text-red-900 mb-1">Supported platforms:</p>
                                    <ul className="text-sm text-red-700 list-disc list-inside">
                                        <li>YouTube (youtube.com, youtu.be)</li>
                                        <li>Facebook (facebook.com/video)</li>
                                        <li>Vimeo (vimeo.com)</li>
                                        <li>Direct video files (.mp4, .webm, .ogg)</li>
                                    </ul>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {sermon.description && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-lg mb-2">Description</h3>
                            <p className="text-slate-700 leading-relaxed">{sermon.description}</p>
                        </div>
                    )}

                    {/* Video URL for troubleshooting */}
                    {currentUser?.role === 'admin' && (
                        <details className="mt-4 p-3 bg-slate-50 rounded border">
                            <summary className="cursor-pointer font-semibold text-sm text-slate-700">
                                🔧 Troubleshooting Info (Admin Only)
                            </summary>
                            <div className="mt-2 space-y-2 text-xs">
                                <p>
                                    <strong>Video URL:</strong>
                                    <br />
                                    <code className="bg-white px-2 py-1 rounded border text-[10px] break-all block mt-1">
                                        {sermon.video_url}
                                    </code>
                                </p>
                                <p>
                                    <strong>Embed URL:</strong>
                                    <br />
                                    <code className="bg-white px-2 py-1 rounded border text-[10px] break-all block mt-1">
                                        {embedUrl || 'NULL - Could not generate embed URL'}
                                    </code>
                                </p>
                                <p>
                                    <strong>Video Type:</strong> {isDirectVideo ? 'Direct Video File' : 'Embedded Platform'}
                                </p>
                            </div>
                        </details>
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Delete Sermon?</h3>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Are you sure you want to delete "{sermon.title}"? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Sermon
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}