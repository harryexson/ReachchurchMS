
import React, { useState, useEffect, useRef } from "react";
import FeatureGate from "../components/subscription/FeatureGate";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Baby, CheckCircle, AlertTriangle, XCircle, Camera, Scan, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function KidsCheckOutPage() {
    const [childRecord, setChildRecord] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkOutSuccess, setCheckOutSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [scanMode, setScanMode] = useState("scanner");
    const [cameraActive, setCameraActive] = useState(false);
    const [detectedCode, setDetectedCode] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scannerInputRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const processingCodeRef = useRef(false);
    const lastScannedCodeRef = useRef("");
    const scanTimeoutRef = useRef(null);

    // Auto-focus scanner input
    useEffect(() => {
        if (scanMode === "scanner" && scannerInputRef.current && !childRecord && !isProcessing) {
            scannerInputRef.current.focus();
        }
    }, [scanMode, childRecord, checkOutSuccess, isProcessing]);

    // Camera management
    useEffect(() => {
        if (scanMode === "camera" && !childRecord && !checkOutSuccess && !isProcessing) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [scanMode, childRecord, checkOutSuccess, isProcessing]);

    const startCamera = async () => {
        try {
            setCameraActive(true);
            setError(null);
            setIsScanning(false);
            processingCodeRef.current = false;
            lastScannedCodeRef.current = "";
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().then(() => {
                        setTimeout(() => {
                            if (streamRef.current) {
                                startScanning();
                            }
                        }, 1000);
                    });
                };
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Unable to access camera. Please allow camera permission or use barcode scanner.");
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        console.log("Stopping camera...");
        
        // Clear all intervals and timeouts
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
        }
        
        // Stop video stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
        
        // Clear video source
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        setCameraActive(false);
        setIsScanning(false);
        processingCodeRef.current = false;
        lastScannedCodeRef.current = "";
    };

    const startScanning = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }

        setIsScanning(true);
        console.log("Starting barcode scanning...");

        if ('BarcodeDetector' in window) {
            const barcodeDetector = new window.BarcodeDetector({
                formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
            });

            scanIntervalRef.current = setInterval(async () => {
                if (processingCodeRef.current || !videoRef.current) {
                    return;
                }

                if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                    try {
                        const barcodes = await barcodeDetector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            const code = barcodes[0].rawValue.toUpperCase();
                            
                            // Prevent duplicate scans
                            if (code !== lastScannedCodeRef.current && code.length === 6) {
                                lastScannedCodeRef.current = code;
                                setDetectedCode(code);
                                handleCodeDetected(code);
                            }
                        }
                    } catch (err) {
                        console.error("Barcode detection error:", err);
                    }
                }
            }, 500); // Scan every 500ms
        } else {
            setError("Your browser doesn't support barcode scanning. Please use a handheld scanner or update your browser.");
            stopCamera();
        }
    };

    const handleCodeDetected = (code) => {
        if (processingCodeRef.current || !code || code.length !== 6) {
            return;
        }

        console.log("Code detected:", code);
        processingCodeRef.current = true;
        stopCamera();
        lookupChild(code);
    };

    const lookupChild = async (code) => {
        if (!code || code.length !== 6 || isProcessing) return;
        
        setIsProcessing(true);
        setError(null);

        try {
            console.log("Looking up code:", code);
            
            const records = await base44.entities.KidsCheckIn.filter({
                check_in_code: code.toUpperCase(),
                checked_out: false
            });

            console.log("Records found:", records.length);

            if (records.length === 0) {
                setError("❌ No matching child found or already checked out");
                setChildRecord(null);
                setDetectedCode("");
                processingCodeRef.current = false;
                lastScannedCodeRef.current = "";
                
                // Restart scanning after 3 seconds
                scanTimeoutRef.current = setTimeout(() => {
                    setError(null);
                    if (scanMode === "camera") {
                        startCamera();
                    } else if (scannerInputRef.current) {
                        scannerInputRef.current.focus();
                    }
                }, 3000);
            } else {
                setChildRecord(records[0]);
            }
        } catch (err) {
            console.error("Lookup error:", err);
            setError("❌ Error looking up check-in code: " + err.message);
            setChildRecord(null);
            setDetectedCode("");
            processingCodeRef.current = false;
            lastScannedCodeRef.current = "";
            
            scanTimeoutRef.current = setTimeout(() => {
                setError(null);
                if (scanMode === "camera") {
                    startCamera();
                } else if (scannerInputRef.current) {
                    scannerInputRef.current.focus();
                }
            }, 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleScannerInput = (e) => {
        const code = e.target.value.toUpperCase();
        setDetectedCode(code);
        
        // Auto-submit when 6 characters are entered
        if (code.length === 6 && !isProcessing) {
            lookupChild(code);
        }
    };

    const handleCheckOut = async () => {
        if (!childRecord || isProcessing) return;

        setIsProcessing(true);

        try {
            const user = await base44.auth.me();
            
            await base44.entities.KidsCheckIn.update(childRecord.id, {
                checked_out: true,
                check_out_time: new Date().toISOString(),
                check_out_by: user.email,
                check_out_by_name: user.full_name,
                pickup_authorized: true
            });

            setCheckOutSuccess(true);
            
            // Reset after 5 seconds
            scanTimeoutRef.current = setTimeout(() => {
                resetCheckout();
            }, 5000);

        } catch (err) {
            console.error("Check-out error:", err);
            setError("Check-out failed: " + err.message);
            setIsProcessing(false);
        }
    };

    const resetCheckout = () => {
        setChildRecord(null);
        setCheckOutSuccess(false);
        setError(null);
        setDetectedCode("");
        processingCodeRef.current = false;
        lastScannedCodeRef.current = "";
        setIsProcessing(false);
        
        if (scanMode === "camera") {
            startCamera();
        } else if (scannerInputRef.current) {
            scannerInputRef.current.focus();
        }
    };

    const cancelVerification = () => {
        setChildRecord(null);
        setError(null);
        setDetectedCode("");
        processingCodeRef.current = false;
        lastScannedCodeRef.current = "";
        setIsProcessing(false);
        
        if (scanMode === "camera") {
            startCamera();
        } else if (scannerInputRef.current) {
            scannerInputRef.current.focus();
        }
    };

    const switchMode = (mode) => {
        stopCamera();
        setScanMode(mode);
        setDetectedCode("");
        setError(null);
        processingCodeRef.current = false;
        lastScannedCodeRef.current = "";
        setIsProcessing(false);
    };

    if (checkOutSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full shadow-2xl">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <CheckCircle className="w-24 h-24 mx-auto text-green-600 animate-bounce" />
                        <h1 className="text-4xl font-bold text-gray-900">Check-Out Complete! ✅</h1>
                        <p className="text-2xl text-gray-700">
                            <strong>{childRecord?.child_name}</strong> has been picked up safely.
                        </p>
                        <p className="text-lg text-gray-600">
                            Parent: {childRecord?.parent_name}
                        </p>
                        <p className="text-sm text-gray-500">
                            Check-out time: {new Date().toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-400 mt-4">
                            Automatically restarting in 5 seconds...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <FeatureGate 
            feature="kids_checkin_enabled"
            featureName="Kids Check-Out System"
            requiredPlan="Growth"
        >
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="text-center">
                        <Baby className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Kids Check-Out Kiosk</h1>
                        <p className="text-lg text-gray-600 mt-2">Fast & Secure Child Pick-Up</p>
                    </div>

                    {error && (
                        <Alert className="bg-red-50 border-red-300">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <AlertDescription>
                                <p className="font-bold text-red-900">{error}</p>
                                <p className="text-sm text-red-700 mt-1">
                                    Scanner will restart automatically...
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Mode Selection */}
                    {!childRecord && (
                        <>
                            <div className="flex justify-center gap-4 mb-6">
                                <Button
                                    onClick={() => switchMode("scanner")}
                                    disabled={isProcessing}
                                    className={`h-16 px-8 text-lg ${
                                        scanMode === "scanner"
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                                            : "bg-gray-300 text-gray-700"
                                    }`}
                                >
                                    <Scan className="w-6 h-6 mr-3" />
                                    Handheld Scanner
                                </Button>
                                <Button
                                    onClick={() => switchMode("camera")}
                                    disabled={isProcessing}
                                    className={`h-16 px-8 text-lg ${
                                        scanMode === "camera"
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600"
                                            : "bg-gray-300 text-gray-700"
                                    }`}
                                >
                                    <Camera className="w-6 h-6 mr-3" />
                                    Camera Scan
                                </Button>
                            </div>

                            {/* Handheld Scanner Mode */}
                            {scanMode === "scanner" && (
                                <Card className="shadow-2xl border-4 border-blue-500">
                                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                        <CardTitle className="flex items-center gap-3 text-2xl">
                                            <Scan className="w-8 h-8" />
                                            Ready to Scan Barcode/QR Code
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-8 space-y-6">
                                        <Alert className="bg-blue-50 border-blue-300">
                                            <AlertDescription>
                                                <p className="font-bold text-blue-900 text-lg mb-2">⚡ Instructions:</p>
                                                <ol className="text-sm text-blue-800 list-decimal ml-5 space-y-1">
                                                    <li>Point your USB/Bluetooth barcode scanner at the parent's slip</li>
                                                    <li>Scan the barcode or QR code</li>
                                                    <li>The code will automatically be verified</li>
                                                </ol>
                                            </AlertDescription>
                                        </Alert>

                                        <div className="bg-white p-8 rounded-xl border-4 border-blue-200">
                                            <div className="text-center mb-4">
                                                {isProcessing ? (
                                                    <Loader2 className="w-20 h-20 mx-auto text-blue-600 animate-spin" />
                                                ) : (
                                                    <Scan className="w-20 h-20 mx-auto text-blue-600 animate-pulse" />
                                                )}
                                                <p className="text-2xl font-bold text-gray-900 mt-4">
                                                    {isProcessing ? "Verifying..." : "Scan Code Now"}
                                                </p>
                                            </div>
                                            
                                            <Input
                                                ref={scannerInputRef}
                                                type="text"
                                                value={detectedCode}
                                                onChange={handleScannerInput}
                                                placeholder="Scanner input..."
                                                className="text-4xl text-center tracking-widest h-20 font-bold border-4 border-blue-400 focus:border-blue-600"
                                                maxLength={6}
                                                autoFocus
                                                autoComplete="off"
                                                disabled={isProcessing}
                                            />
                                            
                                            {detectedCode && !isProcessing && (
                                                <p className="text-center text-green-600 font-bold mt-4 text-xl">
                                                    Code Detected: {detectedCode}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Camera Scan Mode */}
                            {scanMode === "camera" && (
                                <Card className="shadow-2xl border-4 border-purple-500">
                                    <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                        <CardTitle className="flex items-center gap-3 text-2xl">
                                            <Camera className="w-8 h-8" />
                                            Camera QR/Barcode Scanner
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-8 space-y-6">
                                        {!cameraActive ? (
                                            <div className="text-center py-12">
                                                <Camera className="w-20 h-20 mx-auto text-purple-600 mb-4" />
                                                <p className="text-xl text-gray-700 mb-6">Initializing camera...</p>
                                                <Button onClick={startCamera} size="lg" className="bg-purple-600" disabled={isProcessing}>
                                                    <RefreshCw className="w-5 h-5 mr-2" />
                                                    Retry Camera
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <Alert className="bg-purple-50 border-purple-300">
                                                    <AlertDescription>
                                                        <p className="font-bold text-purple-900 text-lg mb-2">📸 Instructions:</p>
                                                        <ol className="text-sm text-purple-800 list-decimal ml-5 space-y-1">
                                                            <li>Hold the parent's slip in front of the camera</li>
                                                            <li>Center the QR code or barcode in the frame</li>
                                                            <li>Keep it steady for 1-2 seconds</li>
                                                            <li>System will automatically detect and verify</li>
                                                        </ol>
                                                    </AlertDescription>
                                                </Alert>

                                                <div className="relative bg-black rounded-xl overflow-hidden">
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        muted
                                                        className="w-full h-[480px] object-cover"
                                                    />
                                                    
                                                    {/* Scanning overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="w-64 h-64 border-4 border-purple-500 rounded-lg">
                                                            {isScanning && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="w-full h-1 bg-purple-500 animate-pulse"></div>
                                                                </div>
                                                            )}
                                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-full">
                                                        <p className="text-sm font-semibold">
                                                            {isProcessing ? "Verifying..." : 
                                                            detectedCode ? `Detected: ${detectedCode}` : 
                                                            isScanning ? 'Scanning for QR/Barcode...' : 'Starting...'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <canvas ref={canvasRef} className="hidden" />

                                                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
                                                    <p className="text-sm font-semibold text-purple-900 mb-2">💡 Camera Tips:</p>
                                                    <ul className="text-xs text-purple-800 space-y-1 ml-4 list-disc">
                                                        <li>Ensure good lighting for best results</li>
                                                        <li>Hold the slip 6-12 inches from camera</li>
                                                        <li>Keep the code flat and in focus</li>
                                                        <li>Browser must support BarcodeDetector API</li>
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Child Found - Verification */}
                    {childRecord && !checkOutSuccess && (
                        <Card className="shadow-2xl border-4 border-green-500">
                            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                                <CardTitle className="text-2xl">✅ Child Found - Verify Before Release</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <Alert className="bg-yellow-50 border-yellow-400 border-2">
                                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                                    <AlertDescription>
                                        <p className="font-bold text-yellow-900 text-lg">⚠️ VERIFICATION REQUIRED</p>
                                        <p className="text-yellow-800">
                                            Please verify the child's name tag matches this information before release.
                                        </p>
                                    </AlertDescription>
                                </Alert>

                                <div className="grid md:grid-cols-2 gap-6 text-lg bg-blue-50 p-6 rounded-xl">
                                    <div>
                                        <p className="text-gray-600 font-medium">Child's Name:</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{childRecord.child_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">Age / Grade:</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {childRecord.child_age} years / {childRecord.child_grade}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">Parent Name:</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{childRecord.parent_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">Parent Phone:</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{childRecord.parent_phone}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-gray-600 font-medium">Check-In Time:</p>
                                        <p className="text-xl font-bold text-gray-900 mt-1">
                                            {new Date(childRecord.check_in_time).toLocaleString()}
                                        </p>
                                    </div>
                                    {childRecord.location_room && (
                                        <div className="md:col-span-2">
                                            <p className="text-gray-600 font-medium">Location:</p>
                                            <p className="text-xl font-bold text-gray-900 mt-1">
                                                {childRecord.location_room} ({childRecord.ministry_area?.replace('_', ' ')})
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {childRecord.child_allergies && (
                                    <Alert className="bg-red-50 border-red-400 border-2">
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                        <AlertDescription>
                                            <p className="font-bold text-red-900 text-lg">⚠️ ALLERGY ALERT</p>
                                            <p className="text-red-800 text-lg">{childRecord.child_allergies}</p>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex gap-4 pt-6">
                                    <Button
                                        onClick={handleCheckOut}
                                        disabled={isProcessing}
                                        className="flex-1 h-20 text-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "✅ Confirm Check-Out"
                                        )}
                                    </Button>
                                    <Button
                                        onClick={cancelVerification}
                                        disabled={isProcessing}
                                        variant="outline"
                                        className="flex-1 h-20 text-2xl border-4 border-red-500 text-red-600 hover:bg-red-50"
                                    >
                                        <XCircle className="w-6 h-6 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </FeatureGate>
    );
}
