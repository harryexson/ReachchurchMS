import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, StopCircle, Play, RotateCcw, Check, Loader2, Camera } from "lucide-react";

export default function VideoRecorder({ onVideoReady, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [cameraReady, setCameraReady] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            stopCamera();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (recordedUrl) {
                URL.revokeObjectURL(recordedUrl);
            }
        };
    }, [recordedUrl]);

    const startCamera = async () => {
        setIsInitializing(true);
        setError(null);
        
        try {
            // Request camera with high resolution preference
            const constraints = {
                video: {
                    width: { ideal: 1920, max: 3840 },
                    height: { ideal: 1080, max: 2160 },
                    frameRate: { ideal: 30, max: 60 },
                    facingMode: "user"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            };

            console.log("Requesting camera access...");
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Camera access granted", stream.getTracks());
            
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true; // Mute preview to avoid feedback
                
                // Wait for video to be ready
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                        resolve();
                    };
                });
            }
            
            setCameraReady(true);
            console.log("Camera ready");
        } catch (err) {
            console.error("Camera access error:", err);
            let errorMessage = "Failed to access camera. ";
            
            if (err.name === 'NotAllowedError') {
                errorMessage += "Please grant camera permissions in your browser settings.";
            } else if (err.name === 'NotFoundError') {
                errorMessage += "No camera found on your device.";
            } else {
                errorMessage += err.message || "Unknown error occurred.";
            }
            
            setError(errorMessage);
        } finally {
            setIsInitializing(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log("Stopped track:", track.kind);
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
    };

    const startRecording = async () => {
        if (!streamRef.current) {
            setError("Camera not available. Please start camera first.");
            return;
        }

        try {
            chunksRef.current = [];
            
            // Check supported mime types
            let mimeType = 'video/webm;codecs=vp9,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm;codecs=vp8,opus';
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }
            
            console.log("Using mime type:", mimeType);

            const options = {
                mimeType: mimeType,
                videoBitsPerSecond: 5000000 // 5 Mbps
            };

            const mediaRecorder = new MediaRecorder(streamRef.current, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    console.log("Data chunk received:", event.data.size);
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                console.log("Recording stopped, total chunks:", chunksRef.current.length);
                const blob = new Blob(chunksRef.current, { type: mimeType });
                console.log("Created blob:", blob.size, "bytes");
                setRecordedBlob(blob);
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
                setIsPreviewing(true);
                stopCamera();
            };

            mediaRecorder.onerror = (event) => {
                console.error("MediaRecorder error:", event);
                setError("Recording error occurred. Please try again.");
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setRecordingTime(0);
            console.log("Recording started");

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Recording error:", err);
            setError(`Failed to start recording: ${err.message}`);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            console.log("Stopping recording...");
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const retake = () => {
        if (recordedUrl) {
            URL.revokeObjectURL(recordedUrl);
        }
        setIsPreviewing(false);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setRecordingTime(0);
        startCamera();
    };

    const uploadVideo = async () => {
        if (!recordedBlob) return;

        setIsUploading(true);
        try {
            console.log("Uploading video...");
            const { UploadFile } = await import("@/integrations/Core");
            
            // Convert blob to file
            const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
                type: recordedBlob.type
            });

            const result = await UploadFile({ file });
            console.log("Upload complete:", result.file_url);
            
            onVideoReady({
                media_url: result.file_url,
                media_type: 'video'
            });

        } catch (error) {
            console.error("Upload error:", error);
            setError("Failed to upload video. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="border-2 border-purple-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-600" />
                    Record Video
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        {error}
                    </div>
                )}

                {/* Video Preview/Recording Area */}
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={!isPreviewing}
                        src={isPreviewing ? recordedUrl : undefined}
                        className="w-full h-full object-cover"
                        controls={isPreviewing}
                    />
                    
                    {isRecording && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                            <span className="font-mono font-semibold">{formatTime(recordingTime)}</span>
                        </div>
                    )}

                    {!cameraReady && !isPreviewing && !isInitializing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <Camera className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <p className="text-white">Click "Start Camera" to begin</p>
                            </div>
                        </div>
                    )}

                    {isInitializing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 mx-auto mb-4 text-white animate-spin" />
                                <p className="text-white">Initializing camera...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recording Info */}
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                    <p className="font-semibold mb-1">📹 Recording Tips:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Find good lighting for best quality</li>
                        <li>Keep your camera steady</li>
                        <li>Speak clearly towards your microphone</li>
                        <li>You can retake as many times as needed</li>
                        <li>Camera will record at highest quality your device supports</li>
                    </ul>
                </div>

                {/* Controls */}
                <div className="flex gap-3 flex-wrap">
                    {!cameraReady && !isPreviewing && (
                        <Button
                            onClick={startCamera}
                            disabled={isInitializing}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                            {isInitializing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Starting Camera...
                                </>
                            ) : (
                                <>
                                    <Camera className="w-4 h-4 mr-2" />
                                    Start Camera
                                </>
                            )}
                        </Button>
                    )}

                    {cameraReady && !isRecording && !isPreviewing && (
                        <Button
                            onClick={startRecording}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Start Recording
                        </Button>
                    )}

                    {isRecording && (
                        <Button
                            onClick={stopRecording}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            <StopCircle className="w-4 h-4 mr-2" />
                            Stop Recording ({formatTime(recordingTime)})
                        </Button>
                    )}

                    {isPreviewing && (
                        <>
                            <Button
                                onClick={retake}
                                variant="outline"
                                className="flex-1"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retake
                            </Button>
                            <Button
                                onClick={uploadVideo}
                                disabled={isUploading}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Use This Video
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    <Button
                        onClick={() => {
                            stopCamera();
                            onCancel();
                        }}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                </div>

                {/* Technical Info */}
                <div className="text-xs text-slate-500 text-center space-y-1">
                    <p>Recording in HD (up to 4K if supported by your camera)</p>
                    {cameraReady && (
                        <p className="text-green-600 font-semibold">✓ Camera is ready to record</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}