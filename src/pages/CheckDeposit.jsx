import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, FileText, DollarSign, User, Calendar, Upload, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CheckDepositPage() {
    const [step, setStep] = useState('capture'); // capture, review, success
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [currentSide, setCurrentSide] = useState('front');
    const [checkData, setCheckData] = useState({
        donor_name: '',
        amount: '',
        check_number: '',
        donation_type: 'offering',
        donation_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            setError('Unable to access camera. Please use the upload button instead.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const capturePhoto = () => {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        
        if (currentSide === 'front') {
            setFrontImage(imageDataUrl);
            setCurrentSide('back');
        } else {
            setBackImage(imageDataUrl);
            stopCamera();
            setStep('review');
        }
    };

    const handleFileUpload = (e, side) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (side === 'front') {
                    setFrontImage(event.target.result);
                } else {
                    setBackImage(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        setIsProcessing(true);
        setError('');
        
        try {
            // Upload images to storage
            const frontBlob = await fetch(frontImage).then(r => r.blob());
            const backBlob = await fetch(backImage).then(r => r.blob());
            
            const frontFile = new File([frontBlob], 'check-front.jpg', { type: 'image/jpeg' });
            const backFile = new File([backBlob], 'check-back.jpg', { type: 'image/jpeg' });
            
            const [frontUpload, backUpload] = await Promise.all([
                base44.integrations.Core.UploadFile({ file: frontFile }),
                base44.integrations.Core.UploadFile({ file: backFile })
            ]);

            // Try to extract check details via OCR
            try {
                const ocrResult = await base44.integrations.Core.InvokeLLM({
                    prompt: `Extract check details from this image. Return ONLY JSON with: amount, check_number, routing_number, account_number, date. If you can't read a field, return null for that field.`,
                    file_urls: [frontUpload.file_url],
                    response_json_schema: {
                        type: "object",
                        properties: {
                            amount: { type: "number" },
                            check_number: { type: "string" },
                            routing_number: { type: "string" },
                            account_number: { type: "string" },
                            date: { type: "string" }
                        }
                    }
                });
                
                // Auto-fill missing fields from OCR
                if (ocrResult.amount && !checkData.amount) {
                    setCheckData(prev => ({...prev, amount: ocrResult.amount.toString()}));
                }
                if (ocrResult.check_number && !checkData.check_number) {
                    setCheckData(prev => ({...prev, check_number: ocrResult.check_number}));
                }
            } catch (ocrError) {
                console.log('OCR extraction failed, using manual entry:', ocrError);
            }

            // Create donation record
            await base44.entities.Donation.create({
                ...checkData,
                amount: parseFloat(checkData.amount),
                payment_method: 'check',
                notes: `${checkData.notes}\n\nCheck Images:\nFront: ${frontUpload.file_url}\nBack: ${backUpload.file_url}`
            });

            setStep('success');
        } catch (err) {
            console.error('Error processing check:', err);
            setError('Failed to process check deposit. Please try again.');
        }
        
        setIsProcessing(false);
    };

    const resetForm = () => {
        setStep('capture');
        setFrontImage(null);
        setBackImage(null);
        setCurrentSide('front');
        setCheckData({
            donor_name: '',
            amount: '',
            check_number: '',
            donation_type: 'offering',
            donation_date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setError('');
    };

    React.useEffect(() => {
        if (step === 'capture' && !frontImage && !backImage) {
            startCamera();
        }
        
        return () => stopCamera();
    }, [step]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Check Deposit</h1>
                        <p className="text-slate-600">Scan and deposit checks using your device camera</p>
                    </div>
                </div>

                {/* Instructions */}
                {step === 'capture' && (
                    <>
                        <Alert className="bg-amber-50 border-amber-300">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            <AlertDescription>
                                <p className="font-semibold text-amber-900 mb-2">📸 Digital Record Keeping Mode</p>
                                <p className="text-sm text-amber-800 mb-2">
                                    This feature captures check images and uses AI to extract details. You'll still need to deposit checks via your bank's mobile app.
                                </p>
                                <details className="text-sm">
                                    <summary className="cursor-pointer font-semibold text-amber-900 mb-1">About automatic check processing</summary>
                                    <p className="text-amber-800 mt-1 mb-2">
                                        True automatic check processing requires bank-specific APIs and regulatory approval. We recommend:
                                    </p>
                                    <ul className="list-disc ml-5 text-amber-800 text-xs space-y-1">
                                        <li>Use this tool to scan and record checks</li>
                                        <li>Then use your bank's mobile deposit app to actually deposit</li>
                                        <li>For high-volume needs, contact <a href="mailto:sales@churchconnectms.com?subject=Check Processing Service" className="underline">sales@churchconnectms.com</a> about integrating with Bill.com or similar services</li>
                                    </ul>
                                </details>
                            </AlertDescription>
                        </Alert>
                        
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                            <AlertDescription>
                                <p className="font-semibold text-blue-900 mb-1">How to scan a check:</p>
                                <ol className="text-sm text-blue-800 list-decimal ml-5 space-y-1">
                                    <li>Position the check flat on a dark surface</li>
                                    <li>Ensure all four corners are visible</li>
                                    <li>Capture the front side first, then the back</li>
                                    <li>Review and enter check details</li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                    </>
                )}

                {error && (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Capture Step */}
                {step === 'capture' && (
                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Capture Check - {currentSide === 'front' ? 'Front' : 'Back'} Side</span>
                                <Badge className={currentSide === 'front' ? 'bg-blue-600' : 'bg-green-600'}>
                                    Step {currentSide === 'front' ? '1' : '2'} of 2
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Camera View */}
                            {!frontImage && currentSide === 'front' || !backImage && currentSide === 'back' ? (
                                <div className="space-y-4">
                                    <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 border-4 border-dashed border-white/50 m-8"></div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={capturePhoto}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 py-6"
                                            size="lg"
                                        >
                                            <Camera className="w-5 h-5 mr-2" />
                                            Capture {currentSide === 'front' ? 'Front' : 'Back'}
                                        </Button>
                                        
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, currentSide)}
                                            className="hidden"
                                        />
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            variant="outline"
                                            className="py-6"
                                            size="lg"
                                        >
                                            <Upload className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <img 
                                            src={currentSide === 'front' ? frontImage : backImage} 
                                            alt={`Check ${currentSide}`}
                                            className="w-full rounded-xl border-2 border-green-500"
                                        />
                                        <Button
                                            onClick={() => {
                                                if (currentSide === 'front') {
                                                    setFrontImage(null);
                                                } else {
                                                    setBackImage(null);
                                                }
                                                startCamera();
                                            }}
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-4 right-4"
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Retake
                                        </Button>
                                    </div>
                                    
                                    {frontImage && backImage ? (
                                        <Button
                                            onClick={() => setStep('review')}
                                            className="w-full bg-green-600 hover:bg-green-700 py-6"
                                            size="lg"
                                        >
                                            Continue to Details
                                            <CheckCircle className="w-5 h-5 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => {
                                                setCurrentSide('back');
                                                startCamera();
                                            }}
                                            className="w-full bg-blue-600 hover:bg-blue-700 py-6"
                                            size="lg"
                                        >
                                            Next: Capture Back Side
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Review Step */}
                {step === 'review' && (
                    <div className="space-y-6">
                        {/* Check Images Preview */}
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>Check Images</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="mb-2 block">Front</Label>
                                        <img src={frontImage} alt="Check front" className="w-full rounded-lg border" />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block">Back</Label>
                                        <img src={backImage} alt="Check back" className="w-full rounded-lg border" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Check Details Form */}
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>Check Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="donor_name">
                                            <User className="w-4 h-4 inline mr-1" />
                                            Donor Name *
                                        </Label>
                                        <Input
                                            id="donor_name"
                                            value={checkData.donor_name}
                                            onChange={(e) => setCheckData({...checkData, donor_name: e.target.value})}
                                            placeholder="John Smith"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="check_number">
                                            <FileText className="w-4 h-4 inline mr-1" />
                                            Check Number *
                                        </Label>
                                        <Input
                                            id="check_number"
                                            value={checkData.check_number}
                                            onChange={(e) => setCheckData({...checkData, check_number: e.target.value})}
                                            placeholder="1234"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="amount">
                                            <DollarSign className="w-4 h-4 inline mr-1" />
                                            Amount *
                                        </Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={checkData.amount}
                                            onChange={(e) => setCheckData({...checkData, amount: e.target.value})}
                                            placeholder="100.00"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="donation_date">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            Date
                                        </Label>
                                        <Input
                                            id="donation_date"
                                            type="date"
                                            value={checkData.donation_date}
                                            onChange={(e) => setCheckData({...checkData, donation_date: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="donation_type">Donation Type</Label>
                                        <Select
                                            value={checkData.donation_type}
                                            onValueChange={(value) => setCheckData({...checkData, donation_type: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tithe">Tithe</SelectItem>
                                                <SelectItem value="offering">Offering</SelectItem>
                                                <SelectItem value="building_fund">Building Fund</SelectItem>
                                                <SelectItem value="missions">Missions</SelectItem>
                                                <SelectItem value="special_event">Special Event</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <textarea
                                        id="notes"
                                        value={checkData.notes}
                                        onChange={(e) => setCheckData({...checkData, notes: e.target.value})}
                                        className="w-full p-3 border rounded-lg"
                                        rows={3}
                                        placeholder="Additional notes..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={resetForm}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isProcessing || !checkData.donor_name || !checkData.amount || !checkData.check_number}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        {isProcessing ? 'Processing...' : 'Complete Deposit'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Success Step */}
                {step === 'success' && (
                    <Card className="shadow-xl border-2 border-green-500">
                        <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Check Recorded Successfully!</h2>
                            <p className="text-lg text-slate-600 mb-2">
                                ${parseFloat(checkData.amount).toFixed(2)} from {checkData.donor_name} has been recorded.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-left max-w-md mx-auto">
                                <p className="text-sm text-amber-900 font-semibold mb-1">⚠️ Next Step:</p>
                                <p className="text-sm text-amber-800">
                                    Please deposit the physical check at your bank or use your bank's mobile deposit app to complete the transaction.
                                </p>
                            </div>
                            <div className="flex gap-4 justify-center">
                                <Button
                                    onClick={resetForm}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Deposit Another Check
                                </Button>
                                <Button
                                    onClick={() => window.location.href = '/giving'}
                                    variant="outline"
                                >
                                    View All Donations
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}