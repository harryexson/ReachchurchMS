import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EventImageUploader({ images = [], onImagesChange }) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState('');

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate files
        const maxSize = 10 * 1024 * 1024; // 10MB
        const invalidFiles = files.filter(file => {
            if (file.size > maxSize) return true;
            if (!file.type.startsWith('image/')) return true;
            return false;
        });

        if (invalidFiles.length > 0) {
            setUploadError('Some files are invalid. Please ensure all files are images under 10MB.');
            return;
        }

        setUploading(true);
        setUploadError(null);
        setUploadProgress('');
        
        try {
            const uploadedUrls = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
                
                const result = await base44.integrations.Core.UploadFile({ file });
                
                if (result && result.file_url) {
                    uploadedUrls.push(result.file_url);
                } else {
                    console.error('Upload failed for file:', file.name, 'Result:', result);
                }
            }
            
            if (uploadedUrls.length > 0) {
                onImagesChange([...images, ...uploadedUrls]);
                setUploadProgress(`Successfully uploaded ${uploadedUrls.length} image(s)`);
                setTimeout(() => setUploadProgress(''), 3000);
            } else {
                setUploadError('Failed to upload any images. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error.message || 'Failed to upload images. Please try again.');
        } finally {
            setUploading(false);
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
                    Upload flyers, posters, or promotional images for this event (max 10MB per image)
                </p>
            </div>

            {uploadError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
            )}

            {uploadProgress && !uploadError && (
                <Alert>
                    <AlertDescription className="text-green-700">{uploadProgress}</AlertDescription>
                </Alert>
            )}

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
                    <CardContent className="p-2 h-full flex items-center justify-center min-h-[140px]">
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <input
                                type="file"
                                accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
                                multiple
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                    <span className="text-xs text-slate-600">{uploadProgress}</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <span className="text-xs text-slate-500 text-center px-2">
                                        Click to upload<br />or drag and drop
                                    </span>
                                </>
                            )}
                        </label>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}