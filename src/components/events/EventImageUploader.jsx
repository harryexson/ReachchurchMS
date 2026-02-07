import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";

export default function EventImageUploader({ images = [], onImagesChange }) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const uploadedUrls = [];
            
            for (const file of files) {
                const result = await base44.integrations.Core.UploadFile({ file });
                if (result && result.file_url) {
                    uploadedUrls.push(result.file_url);
                }
            }
            
            if (uploadedUrls.length > 0) {
                onImagesChange([...images, ...uploadedUrls]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload images: ' + (error.message || 'Please try again'));
        } finally {
            setUploading(false);
            // Reset the input
            e.target.value = '';
        }
    };

    const removeImage = (index) => {
        const updated = images.filter((_, i) => i !== index);
        onImagesChange(updated);
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Promotional Images/Flyers</Label>
                <p className="text-xs text-slate-500 mb-2">
                    Upload flyers, posters, or promotional images for this event
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((url, index) => (
                    <Card key={index} className="relative group">
                        <CardContent className="p-2">
                            <img 
                                src={url} 
                                alt={`Promotional ${index + 1}`} 
                                className="w-full h-32 object-cover rounded"
                            />
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                <Card className="border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
                    <CardContent className="p-2 h-full flex items-center justify-center">
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <span className="text-xs text-slate-500">Upload Images</span>
                                </>
                            )}
                        </label>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}