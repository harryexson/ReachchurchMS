import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Loader2, Heart } from "lucide-react";

export default function PublicVisitorRegistration() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        visit_date: new Date().toISOString().split('T')[0],
        interests: [],
        notes: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [organizationAdmin, setOrganizationAdmin] = useState(null);
    const [churchSettings, setChurchSettings] = useState(null);
    const [isLoadingOrg, setIsLoadingOrg] = useState(true);

    // Get organization identifier from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orgId = urlParams.get('org');

    React.useEffect(() => {
        loadOrganizationInfo();
    }, [orgId]);

    const loadOrganizationInfo = async () => {
        if (!orgId) {
            setError('Invalid visitor card link. Please scan the QR code again or contact the church.');
            setIsLoadingOrg(false);
            return;
        }

        try {
            setIsLoadingOrg(true);
            const { data } = await base44.functions.invoke('getOrganizationInfo', { orgId });
            
            if (data && data.success) {
                setOrganizationAdmin(data.organization);
                setChurchSettings(data.settings);
                setError(null);
            } else {
                setError('Church not found. Please contact the church office.');
            }
        } catch (error) {
            console.error('Error loading organization:', error);
            setError('Failed to load church information.');
        } finally {
            setIsLoadingOrg(false);
        }
    };

    const interestOptions = [
        "Sunday Service",
        "Bible Study",
        "Small Groups",
        "Children's Ministry",
        "Youth Ministry",
        "Volunteer Opportunities",
        "Prayer Ministry",
        "Music & Worship"
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInterestToggle = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!organizationAdmin) {
            setError('Church information not loaded. Please try again.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { data } = await base44.functions.invoke('registerVisitor', {
                visitorData: formData,
                orgAdminEmail: organizationAdmin.email
            });

            if (!data || !data.success) {
                throw new Error(data?.error || 'Registration failed');
            }

            setIsSuccess(true);
            setFormData({
                name: "",
                email: "",
                phone: "",
                visit_date: new Date().toISOString().split('T')[0],
                interests: [],
                notes: ""
            });
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message || "Failed to submit your information. Please try again or contact us directly.");
        }

        setIsSubmitting(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full shadow-2xl">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-12 h-12 text-purple-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Thank You for Visiting!
                        </h1>
                        <p className="text-lg text-slate-600">
                            We're so glad you joined us! Your information has been received.
                        </p>
                        <p className="text-slate-600">
                            You'll hear from us soon with ways to get connected and feel at home in our church community.
                        </p>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
                            <p className="text-sm text-blue-900">
                                <strong>Next Steps:</strong> Check your email for a welcome message and information about upcoming events!
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsSuccess(false)}
                            className="mt-6"
                        >
                            Submit Another Visit Card
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoadingOrg) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full shadow-2xl">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
                        <h2 className="text-xl font-semibold text-slate-900">Loading...</h2>
                        <p className="text-slate-600">Please wait while we load the visitor card.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    {churchSettings?.logo_url ? (
                        <img 
                            src={churchSettings.logo_url} 
                            alt={churchSettings.church_name || "Church Logo"} 
                            className="h-24 w-auto max-w-[300px] object-contain mx-auto mb-4"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-10 h-10 text-white" />
                        </div>
                    )}
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">
                        {churchSettings?.church_name ? `Welcome to ${churchSettings.church_name}!` : "Welcome! We're Glad You're Here"}
                    </h1>
                    <p className="text-lg text-slate-600">
                        {churchSettings?.tagline || "Thank you for visiting our church! We'd love to stay in touch and help you get connected."}
                    </p>
                </div>

                <Card className="shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        <CardTitle className="text-2xl">Visitor Connect Card</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="visit_date">
                                    Date of Visit <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="visit_date"
                                    name="visit_date"
                                    type="date"
                                    value={formData.visit_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>
                                    What Are You Interested In? (Check all that apply)
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {interestOptions.map((interest) => (
                                        <div key={interest} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={interest}
                                                checked={formData.interests.includes(interest)}
                                                onCheckedChange={() => handleInterestToggle(interest)}
                                            />
                                            <Label
                                                htmlFor={interest}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {interest}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">
                                    Questions, Comments, or Prayer Requests
                                </Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Is there anything you'd like us to know? Any questions about our church? How can we pray for you?"
                                    rows={4}
                                />
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <h3 className="font-semibold text-purple-900 mb-2">What Happens Next?</h3>
                                <ul className="text-sm text-purple-800 space-y-1 list-disc ml-5">
                                    <li>You'll receive a welcome email within 24 hours</li>
                                    <li>Someone from our team may reach out to answer any questions</li>
                                    <li>We'll keep you informed about upcoming events and ways to get involved</li>
                                </ul>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Connect Card"
                                    )}
                                </Button>
                            </div>

                            <p className="text-sm text-slate-500 text-center">
                                We respect your privacy. Your information will only be used to connect with you about our church.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}