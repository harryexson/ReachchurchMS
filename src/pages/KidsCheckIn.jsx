import React, { useState, useEffect, useRef } from "react";
import FeatureGate from "../components/subscription/FeatureGate";
import { useSubscription } from "../components/subscription/useSubscription";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Baby, Printer, Smartphone, CheckCircle, QrCode, Calendar, Clock, Camera, Scan, RefreshCw, AlertCircle, AlertTriangle, Settings, MessageSquare } from "lucide-react";
import StaffParentMessenger from "@/components/kids/StaffParentMessenger";
import PrinterSetup from "../components/printing/PrinterSetup";
import PrintPreview from "../components/printing/PrintPreview";
import { LabelTemplates } from "../components/printing/LabelTemplates";

export default function KidsCheckInPage() {
    const { canUseKidsCheckIn, loading: subscriptionLoading } = useSubscription();

    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({
        child_name: "",
        child_age: "",
        child_grade: "",
        child_allergies: "",
        parent_name: "",
        parent_phone: "",
        parent_email: "",
        ministry_area: "",
        location_room: "",
        teacher_staff: "",
        notes: ""
    });
    const [checkInResult, setCheckInResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState("print_both");
    const [showMessenger, setShowMessenger] = useState(false);
    const [showPrinterSetup, setShowPrinterSetup] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [printPreview, setPrintPreview] = useState(null);

    // Camera scanning states
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [detectedCode, setDetectedCode] = useState("");
    const [scanError, setScanError] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    useEffect(() => {
        loadEvents();
        
        // Load saved printer
        const savedPrinterId = localStorage.getItem('kidsCheckInPrinter');
        if (savedPrinterId) {
            const printers = JSON.parse(localStorage.getItem('churchConnectPrinters') || '[]');
            const printer = printers.find(p => p.id === savedPrinterId);
            if (printer) setSelectedPrinter(printer);
        }
    }, []);

    useEffect(() => {
        if (showCameraScanner && !checkInResult) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [showCameraScanner, checkInResult]);

    const loadEvents = async () => {
        try {
            const user = await base44.auth.me();
            const eventsList = await base44.entities.Event.filter({ created_by: user.email }, "-start_datetime");

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingEvents = eventsList.filter(e => {
                if (!e.start_datetime) return false;
                const eventDate = new Date(e.start_datetime);
                return eventDate >= today;
            });

            upcomingEvents.sort((a, b) =>
                new Date(a.start_datetime) - new Date(b.start_datetime)
            );

            setEvents(upcomingEvents);

            if (upcomingEvents.length > 0) {
                setSelectedEvent(upcomingEvents[0]);
            }
        } catch (error) {
            console.error("Error loading events:", error);
            alert("Unable to load events. Please try refreshing the page.");
        }
    };

    const startCamera = async () => {
        try {
            setCameraActive(true);
            setScanError(null);

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
                    videoRef.current.play();
                    setTimeout(() => {
                        startScanning();
                    }, 500);
                };
            }
        } catch (err) {
            console.error("Camera error:", err);
            setScanError("Unable to access camera. Please allow camera permission.");
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        setCameraActive(false);
    };

    const startScanning = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }

        if ('BarcodeDetector' in window) {
            const barcodeDetector = new window.BarcodeDetector({
                formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
            });

            scanIntervalRef.current = setInterval(async () => {
                if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                    try {
                        const barcodes = await barcodeDetector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            const code = barcodes[0].rawValue.toUpperCase();
                            setDetectedCode(code);
                            handleCodeDetected(code);
                        }
                    } catch (err) {
                        console.error("Barcode detection error:", err);
                    }
                }
            }, 300);
        } else {
            setScanError("Your browser doesn't support camera scanning. Please use a barcode scanner or enter code manually.");
        }
    };

    const handleCodeDetected = async (code) => {
        if (code && code.length === 6 && !isProcessing) {
            stopCamera();
            setDetectedCode(code);

            // Look up existing check-in to pre-fill form
            try {
                const existingCheckIns = await base44.entities.KidsCheckIn.filter({
                    check_in_code: code.toUpperCase()
                });

                if (existingCheckIns.length > 0) {
                    const lastCheckIn = existingCheckIns[0];
                    setFormData({
                        ...formData,
                        child_name: lastCheckIn.child_name,
                        child_age: lastCheckIn.child_age.toString(),
                        child_grade: lastCheckIn.child_grade,
                        child_allergies: lastCheckIn.child_allergies,
                        parent_name: lastCheckIn.parent_name,
                        parent_phone: lastCheckIn.parent_phone,
                        parent_email: lastCheckIn.parent_email,
                        ministry_area: lastCheckIn.ministry_area,
                        location_room: lastCheckIn.location_room,
                        teacher_staff: lastCheckIn.teacher_staff
                    });
                    setScanError("✅ Previous check-in found! Information pre-filled.");
                }
                setShowCameraScanner(false);
            } catch (error) {
                console.error("Error looking up code:", error);
                setShowCameraScanner(false);
            }
        }
    };

    const generateCheckInCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handlePreviewPrint = (slip_type) => {
        if (!checkInResult) return;

        const printContent = LabelTemplates.kidsCheckIn({
            child_name: checkInResult.child_name,
            check_in_code: checkInResult.check_in_code,
            qr_code_url: checkInResult.qr_code_url,
            barcode_url: checkInResult.barcode_url,
            event_title: checkInResult.event_title,
            location_room: checkInResult.location_room,
            ministry_area: checkInResult.ministry_area,
            teacher_staff: checkInResult.teacher_staff,
            child_allergies: checkInResult.child_allergies,
            check_in_time: checkInResult.check_in_time,
            slip_type: slip_type
        });

        setPrintPreview({
            content: printContent,
            title: `${slip_type === 'child' ? "Child's" : "Parent's"} Check-In Label`,
            paperSize: '2.25x4'
        });
    };

    const handleCheckIn = async () => {
        if (!selectedEvent || !formData.child_name || !formData.parent_name || !formData.parent_phone || !formData.ministry_area || !formData.location_room) {
            alert("Please fill in all required fields including ministry area and room location");
            return;
        }

        setIsProcessing(true);

        try {
            const checkInCode = generateCheckInCode();
            const user = await base44.auth.me();

            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${checkInCode}`;
            const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${checkInCode}&scale=3&height=10`;

            let smsSentSuccessfully = false;
            let smsError = null;

            const checkInRecord = await base44.entities.KidsCheckIn.create({
                event_id: selectedEvent.id,
                event_title: selectedEvent.title,
                child_name: formData.child_name,
                child_age: parseInt(formData.child_age),
                child_grade: formData.child_grade,
                child_allergies: formData.child_allergies,
                parent_name: formData.parent_name,
                parent_phone: formData.parent_phone,
                parent_email: formData.parent_email,
                check_in_code: checkInCode,
                qr_code_url: qrCodeUrl,
                barcode_url: barcodeUrl,
                registration_date: new Date().toISOString(),
                check_in_time: new Date().toISOString(),
                check_in_by: user.email,
                check_in_by_name: user.full_name,
                ministry_area: formData.ministry_area,
                location_room: formData.location_room,
                teacher_staff: formData.teacher_staff,
                sms_sent: false,
                slips_printed: deliveryMethod === "print_both" ? 2 : 1,
                notes: formData.notes
            });

            console.log('✅ Check-in record created:', checkInRecord.id);

            const shouldSendSMS = ["print_sms","sms_only","email_sms"].includes(deliveryMethod);
            const shouldSendEmail = deliveryMethod === "email_sms";

            if (shouldSendSMS && formData.parent_phone) {
                try {
                    const smsResponse = await base44.functions.invoke('sendKidsCheckInSMS', {
                        phone: formData.parent_phone,
                        child_name: formData.child_name,
                        check_in_code: checkInCode,
                        event_title: selectedEvent.title,
                        qr_code_url: qrCodeUrl
                    });
                    if (smsResponse.data?.success) {
                        smsSentSuccessfully = true;
                        await base44.entities.KidsCheckIn.update(checkInRecord.id, { sms_sent: true });
                    } else {
                        smsError = smsResponse.data?.error || 'Unknown SMS error';
                    }
                } catch (smsException) {
                    smsError = smsException.message || 'SMS sending failed';
                }
                checkInRecord.sms_sent = smsSentSuccessfully;
            }

            if (shouldSendEmail && formData.parent_email) {
                try {
                    await base44.integrations.Core.SendEmail({
                        to: formData.parent_email,
                        from_name: "Children's Church",
                        subject: `Kids Check-In: ${formData.child_name} – Code: ${checkInCode}`,
                        body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                            <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:24px;border-radius:12px 12px 0 0;text-align:center">
                                <h1 style="color:white;margin:0">👶 Kids Check-In Confirmed</h1>
                            </div>
                            <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
                                <p style="font-size:18px;font-weight:bold">✅ ${formData.child_name} is checked in for ${selectedEvent.title}!</p>
                                <p>Room: <strong>${formData.location_room}</strong> | Ministry: <strong>${formData.ministry_area}</strong></p>
                                <div style="text-align:center;background:#f3f4f6;padding:24px;border-radius:12px;margin:20px 0">
                                    <p style="font-size:14px;color:#6b7280;margin-bottom:8px">PICK-UP CODE</p>
                                    <p style="font-size:48px;font-weight:900;letter-spacing:8px;color:#7c3aed;margin:0">${checkInCode}</p>
                                    <img src="${qrCodeUrl}" alt="QR Code" style="width:180px;height:180px;margin-top:16px"/>
                                    <p style="font-size:12px;color:#9ca3af;margin-top:8px">Show this code or QR to staff at pickup</p>
                                </div>
                            </div>
                        </div>`
                    });
                } catch (emailErr) {
                    console.error("Email send error:", emailErr);
                }
            }

            // Always send in-app notification
            if (formData.parent_email) {
                try {
                    await base44.entities.Notification.create({
                        user_email: formData.parent_email,
                        title: `${formData.child_name} is checked in! ✅`,
                        message: `Code: ${checkInCode} | Room: ${formData.location_room} | ${selectedEvent.title}`,
                        type: 'kids_checkin',
                        read: false,
                        created_at: new Date().toISOString()
                    });
                } catch (e) { /* non-critical */ }
            }

            setCheckInResult(checkInRecord);

            // Show print preview instead of auto-printing
            if (deliveryMethod.includes("print") && selectedPrinter) {
                setTimeout(() => {
                    handlePreviewPrint('child');
                }, 500);
            }

        } catch (error) {
            console.error("❌ Check-in error:", error);
            alert("Check-in failed: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setFormData({
            child_name: "",
            child_age: "",
            child_grade: "",
            child_allergies: "",
            parent_name: "",
            parent_phone: "",
            parent_email: "",
            ministry_area: "",
            location_room: "",
            teacher_staff: "",
            notes: ""
        });
        setCheckInResult(null);
        setDetectedCode("");
        setScanError(null);
        setDeliveryMethod("print_both"); // Reset delivery method
    };

    const formatEventDisplay = (event) => {
        const date = new Date(event.start_datetime);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const typeStr = event.event_type.replace('_', ' ').toUpperCase();
        return `${event.title} - ${typeStr} (${dateStr} at ${timeStr})`;
    };

    const resendSMS = async () => {
        if (!checkInResult) return;

        setIsProcessing(true);
        try {
            const smsResponse = await base44.functions.invoke('sendKidsCheckInSMS', {
                phone: checkInResult.parent_phone,
                child_name: checkInResult.child_name,
                check_in_code: checkInResult.check_in_code,
                event_title: checkInResult.event_title,
                qr_code_url: checkInResult.qr_code_url
            });

            if (smsResponse.data && smsResponse.data.success) {
                // Update the check-in record in the database
                const updatedRecord = await base44.entities.KidsCheckIn.update(checkInResult.id, {
                    sms_sent: true
                });
                // Update the local state with the new record
                setCheckInResult(updatedRecord);
                alert("✅ SMS sent successfully to " + checkInResult.parent_phone);
            } else {
                const errorMessage = smsResponse.data?.error || 'Unknown SMS error';
                alert(`❌ Failed to send SMS: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Resend SMS error:", error);
            alert("❌ Failed to send SMS: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (showPrinterSetup) {
        return (
            <FeatureGate
                feature="kids_checkin_enabled"
                featureName="Kids Check-In System"
                requiredPlan="Growth"
            >
                <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Printer Setup</h1>
                                <p className="text-gray-600 mt-1">Configure printer for check-in labels</p>
                            </div>
                            <Button onClick={() => setShowPrinterSetup(false)} variant="outline">
                                Back to Check-In
                            </Button>
                        </div>

                        <Card>
                            <CardContent className="p-6">
                                <PrinterSetup 
                                    onPrinterSelected={(printer) => {
                                        setSelectedPrinter(printer);
                                        localStorage.setItem('kidsCheckInPrinter', printer.id);
                                    }}
                                    selectedPrinterId={selectedPrinter?.id}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </FeatureGate>
        );
    }

    if (checkInResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="no-print">
                        <Alert className="bg-green-50 border-green-300">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-bold text-lg">Check-In Successful! ✅</p>
                                    <p><strong>{checkInResult.child_name}</strong> has been checked in.</p>
                                    <p>Check-in Code: <span className="text-2xl font-bold">{checkInResult.check_in_code}</span></p>
                                    <p className="text-sm text-gray-600">
                                        Room: {checkInResult.location_room} • {checkInResult.ministry_area}
                                    </p>

                                    {/* SMS STATUS DISPLAY */}
                                    <div className="mt-4 p-3 rounded-lg border-2" style={{
                                        backgroundColor: checkInResult.sms_sent ? '#dcfce7' : '#fef3c7',
                                        borderColor: checkInResult.sms_sent ? '#22c55e' : '#f59e0b'
                                    }}>
                                        <p className="font-bold text-sm flex items-center gap-2">
                                            {checkInResult.sms_sent ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 text-green-700" />
                                                    <span className="text-green-900">SMS Sent Successfully!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-4 h-4 text-yellow-700" />
                                                    <span className="text-yellow-900">SMS Not Sent</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-4 mt-6">
                            {selectedPrinter ? (
                                <>
                                    <Button onClick={() => handlePreviewPrint('child')} className="bg-purple-600 gap-2">
                                        <Printer className="w-5 h-5" />
                                        Print Child's Label
                                    </Button>
                                    {deliveryMethod === 'print_both' && (
                                        <Button onClick={() => handlePreviewPrint('parent')} className="bg-blue-600 gap-2">
                                            <Printer className="w-5 h-5" />
                                            Print Parent's Label
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Button onClick={() => setShowPrinterSetup(true)} className="bg-purple-600 gap-2">
                                    <Settings className="w-5 h-5" />
                                    Setup Printer First
                                </Button>
                            )}
                            {!checkInResult.sms_sent && (
                                <Button
                                    onClick={resendSMS}
                                    disabled={isProcessing}
                                    variant="outline"
                                    className="gap-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                                >
                                    <Smartphone className="w-4 h-4" />
                                    {isProcessing ? "Sending..." : "Retry Send SMS"}
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowMessenger(true)}
                                variant="outline"
                                className="gap-2 border-purple-400 text-purple-700 hover:bg-purple-50"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Message Parent
                            </Button>
                            <Button onClick={resetForm} variant="outline">
                                Check In Another Child
                            </Button>
                        </div>

                        {showMessenger && checkInResult && (
                            <StaffParentMessenger
                                checkInRecord={checkInResult}
                                onClose={() => setShowMessenger(false)}
                            />
                        )}

                        {/* QR Code Preview for Parent */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Parent Pick-Up Information</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                                <p className="text-sm text-gray-600">
                                    This QR code can be used at pick-up time
                                </p>
                                <img
                                    src={checkInResult.qr_code_url}
                                    alt="Pick-up QR Code"
                                    className="mx-auto w-48 h-48 border-4 border-purple-200 rounded-lg"
                                />
                                <div className="space-y-2">
                                    <p className="font-bold text-2xl tracking-wider">
                                        {checkInResult.check_in_code}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Pick-up code for {checkInResult.child_name}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Print Preview Modal */}
                {printPreview && (
                    <PrintPreview
                        isOpen={true}
                        onClose={() => setPrintPreview(null)}
                        onPrint={() => setPrintPreview(null)}
                        content={printPreview.content}
                        title={printPreview.title}
                        paperSize={printPreview.paperSize}
                        selectedPrinter={selectedPrinter}
                    />
                )}
            </div>
        );
    }

    return (
        <FeatureGate
            feature="kids_checkin_enabled"
            featureName="Kids Check-In System"
            requiredPlan="Growth"
        >
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center">
                        <Baby className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Kids Check-In Kiosk</h1>
                        <p className="text-lg text-gray-600 mt-2">Safe & Secure Children's Ministry Check-In</p>
                    </div>

                    {/* Printer Status Banner */}
                    {selectedPrinter ? (
                        <Alert className="bg-green-50 border-green-200">
                            <Printer className="w-5 h-5 text-green-600" />
                            <AlertDescription>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-green-900">Printer Connected: {selectedPrinter.name}</p>
                                        <p className="text-sm text-green-700">
                                            {selectedPrinter.connectionType} • {selectedPrinter.width}" × {selectedPrinter.height}"
                                        </p>
                                    </div>
                                    <Button onClick={() => setShowPrinterSetup(true)} variant="outline" size="sm">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Change Printer
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="bg-yellow-50 border-yellow-200">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <AlertDescription>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-yellow-900">No Printer Configured</p>
                                        <p className="text-sm text-yellow-700">
                                            Setup a printer to print check-in labels
                                        </p>
                                    </div>
                                    <Button onClick={() => setShowPrinterSetup(true)} className="bg-yellow-600 hover:bg-yellow-700">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Setup Printer
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Camera Scanner Modal */}
                    {showCameraScanner && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <Card className="w-full max-w-2xl shadow-2xl">
                                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-3">
                                            <Camera className="w-8 h-8" />
                                            Scan Parent's Pick-Up Slip
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowCameraScanner(false)}
                                            className="text-white hover:bg-white/20"
                                        >
                                            ✕ Close
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    {scanError && (
                                        <Alert className={scanError.includes('✅') ? "bg-green-50 border-green-300" : "bg-yellow-50 border-yellow-300"}>
                                            <AlertDescription>
                                                <p className="font-semibold">{scanError}</p>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {!cameraActive ? (
                                        <div className="text-center py-12">
                                            <Camera className="w-20 h-20 mx-auto text-purple-600 mb-4" />
                                            <p className="text-xl text-gray-700 mb-6">Initializing camera...</p>
                                            <Button onClick={startCamera} size="lg" className="bg-purple-600">
                                                <RefreshCw className="w-5 h-5 mr-2" />
                                                Start Camera
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Alert className="bg-purple-50 border-purple-300">
                                                <AlertDescription>
                                                    <p className="font-bold text-purple-900 text-sm mb-2">📸 Instructions:</p>
                                                    <ol className="text-xs text-purple-800 list-decimal ml-5 space-y-1">
                                                        <li>Hold the parent's pick-up slip in front of the camera</li>
                                                        <li>Center the QR code or barcode in the frame</li>
                                                        <li>Keep steady for 1-2 seconds</li>
                                                        <li>System will auto-detect and fill information</li>
                                                    </ol>
                                                </AlertDescription>
                                            </Alert>

                                            <div className="relative bg-black rounded-xl overflow-hidden">
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-[400px] object-cover"
                                                />

                                                {/* Scanning overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-56 h-56 border-4 border-purple-500 rounded-lg animate-pulse">
                                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-full">
                                                    <p className="text-sm font-semibold">
                                                        {detectedCode ? `Detected: ${detectedCode}` : 'Scanning for code...'}
                                                    </p>
                                                </div>
                                            </div>

                                            <canvas ref={canvasRef} className="hidden" />
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Card className="shadow-2xl">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Register Child for Service</CardTitle>
                                <Button
                                    onClick={() => setShowCameraScanner(true)}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Camera className="w-5 h-5" />
                                    Scan Previous Slip
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Event Selection */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <Label className="text-lg font-bold mb-3 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Select Event/Service *
                                </Label>

                                {events.length === 0 ? (
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <AlertDescription>
                                            <p className="font-semibold text-yellow-800">No upcoming events found</p>
                                            <p className="text-sm text-yellow-700 mt-2">
                                                To check in children, you need to create events first:
                                            </p>
                                            <ol className="text-sm text-yellow-700 mt-2 ml-4 list-decimal space-y-1">
                                                <li>Go to <strong>Events</strong> in the navigation menu</li>
                                                <li>Click <strong>"Schedule Event"</strong></li>
                                                <li>Fill in event details (title, date, type)</li>
                                                <li>Save the event</li>
                                                <li>Return here and refresh</li>
                                            </ol>
                                            <Button
                                                onClick={loadEvents}
                                                className="mt-3 bg-blue-600 hover:bg-blue-700"
                                                size="sm"
                                            >
                                                🔄 Refresh Events List
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <>
                                        <Select
                                            value={selectedEvent?.id}
                                            onValueChange={(id) => setSelectedEvent(events.find(e => e.id === id))}
                                        >
                                            <SelectTrigger className="h-14 text-lg">
                                                <SelectValue placeholder="Choose a service or event" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[400px]">
                                                {events.map(event => {
                                                    const eventDate = new Date(event.start_datetime);
                                                    const today = new Date();
                                                    const tomorrow = new Date(today);
                                                    tomorrow.setDate(today.getDate() + 1);

                                                    const isToday = eventDate.toDateString() === today.toDateString();
                                                    const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();

                                                    let dateLabel = '';
                                                    if (isToday) dateLabel = 'TODAY';
                                                    else if (isTomorrow) dateLabel = 'TOMORROW';

                                                    return (
                                                        <SelectItem key={event.id} value={event.id} className="py-4">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-base">{event.title}</span>
                                                                    {dateLabel && (
                                                                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                                                            {dateLabel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm text-gray-600 mt-1">
                                                                    {event.event_type.replace('_', ' ').toUpperCase()} • {eventDate.toLocaleDateString('en-US', {
                                                                        weekday: 'short',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                                                    })} at {eventDate.toLocaleTimeString('en-US', {
                                                                        hour: 'numeric',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                                {event.location && (
                                                                    <span className="text-xs text-gray-500 mt-0.5">
                                                                        📍 {event.location}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>

                                        {selectedEvent && (
                                            <div className="mt-3 p-4 bg-white rounded-lg border border-blue-300 shadow-sm">
                                                <div className="flex items-start gap-3">
                                                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900">{selectedEvent.title}</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {new Date(selectedEvent.start_datetime).toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })} at {new Date(selectedEvent.start_datetime).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                        {selectedEvent.location && (
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                📍 Location: {selectedEvent.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Child Information */}
                            <div className="border-t pt-6">
                                <h3 className="font-bold text-lg mb-4">Child Information</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Child's Full Name *</Label>
                                        <Input
                                            value={formData.child_name}
                                            onChange={(e) => setFormData({...formData, child_name: e.target.value})}
                                            placeholder="John Doe"
                                            className="text-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label>Age *</Label>
                                        <Input
                                            type="number"
                                            value={formData.child_age}
                                            onChange={(e) => setFormData({...formData, child_age: e.target.value})}
                                            placeholder="5"
                                            className="text-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label>Grade Level</Label>
                                        <Select
                                            value={formData.child_grade}
                                            onValueChange={(value) => setFormData({...formData, child_grade: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select grade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Infant">Infant (0-1)</SelectItem>
                                                <SelectItem value="Toddler">Toddler (1-3)</SelectItem>
                                                <SelectItem value="Preschool">Preschool (3-5)</SelectItem>
                                                <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                                <SelectItem value="1st Grade">1st Grade</SelectItem>
                                                <SelectItem value="2nd Grade">2nd Grade</SelectItem>
                                                <SelectItem value="3rd Grade">3rd Grade</SelectItem>
                                                <SelectItem value="4th Grade">4th Grade</SelectItem>
                                                <SelectItem value="5th Grade">5th Grade</SelectItem>
                                                <SelectItem value="6th Grade">6th Grade</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Allergies / Medical Conditions</Label>
                                        <Textarea
                                            value={formData.child_allergies}
                                            onChange={(e) => setFormData({...formData, child_allergies: e.target.value})}
                                            placeholder="Any allergies, medications, or special needs?"
                                            className="h-20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Information */}
                            <div className="border-t pt-6">
                                <h3 className="font-bold text-lg mb-4">Parent/Guardian Information</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Parent Name *</Label>
                                        <Input
                                            value={formData.parent_name}
                                            onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                                            placeholder="Jane Doe"
                                            className="text-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone Number *</Label>
                                        <Input
                                            type="tel"
                                            value={formData.parent_phone}
                                            onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                                            placeholder="(555) 123-4567"
                                            className="text-lg"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Email (Optional)</Label>
                                        <Input
                                            type="email"
                                            value={formData.parent_email}
                                            onChange={(e) => setFormData({...formData, parent_email: e.target.value})}
                                            placeholder="parent@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Placement Information */}
                            <div className="border-t pt-6">
                                <h3 className="font-bold text-lg mb-4">Placement Information</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Ministry Area *</Label>
                                        <Input
                                            value={formData.ministry_area}
                                            onChange={(e) => setFormData({...formData, ministry_area: e.target.value})}
                                            placeholder="e.g., Nursery, Preschool, Elementary"
                                            className="text-lg"
                                        />
                                    </div>
                                    <div>
                                        <Label>Room / Location *</Label>
                                        <Input
                                            value={formData.location_room}
                                            onChange={(e) => setFormData({...formData, location_room: e.target.value})}
                                            placeholder="e.g., Room 101, Blue Room"
                                            className="text-lg"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Assigned Teacher/Staff (Optional)</Label>
                                        <Input
                                            value={formData.teacher_staff}
                                            onChange={(e) => setFormData({...formData, teacher_staff: e.target.value})}
                                            placeholder="e.g., Ms. Emily"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Method */}
                            <div className="border-t pt-6">
                                <Label className="text-base font-semibold">Notification Channels</Label>
                                <p className="text-sm text-gray-500 mb-3">How should the parent receive their check-in confirmation & code?</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { key: "print_both", icon: Printer, label: "Print Both", sub: "Child + Parent slip", activeClass: "border-purple-500 bg-purple-50 text-purple-800" },
                                        { key: "print_sms", icon: Smartphone, label: "Print + SMS", sub: "Label + Text parent", activeClass: "border-blue-500 bg-blue-50 text-blue-800" },
                                        { key: "sms_only", icon: Smartphone, label: "SMS Only", sub: "Text code to parent", activeClass: "border-green-500 bg-green-50 text-green-800" },
                                        { key: "email_sms", icon: QrCode, label: "SMS + Email", sub: "Both digital channels", activeClass: "border-amber-500 bg-amber-50 text-amber-800" },
                                    ].map(({ key, icon: Icon, label, sub, activeClass }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setDeliveryMethod(key)}
                                            className={`p-4 border-2 rounded-lg transition-all text-center ${deliveryMethod === key ? activeClass : "border-gray-200 hover:border-purple-300"}`}
                                        >
                                            <Icon className="w-7 h-7 mx-auto mb-1" />
                                            <p className="font-bold text-sm">{label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <Label>Additional Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Any special instructions?"
                                    className="h-20"
                                />
                            </div>

                            <Button
                                onClick={handleCheckIn}
                                disabled={isProcessing}
                                className="w-full h-16 text-xl bg-purple-600 hover:bg-purple-700"
                            >
                                {isProcessing ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <QrCode className="w-6 h-6 mr-3" />
                                        Complete Check-In
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Print Preview Modal */}
                {printPreview && (
                    <PrintPreview
                        isOpen={true}
                        onClose={() => setPrintPreview(null)}
                        onPrint={() => setPrintPreview(null)}
                        content={printPreview.content}
                        title={printPreview.title}
                        paperSize={printPreview.paperSize}
                        selectedPrinter={selectedPrinter}
                    />
                )}
            </div>
        </FeatureGate>
    );
}