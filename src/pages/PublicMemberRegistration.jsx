import React, { useState } from "react";
import { Member } from "@/entities/Member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2, Church } from "lucide-react";

export default function PublicMemberRegistration() {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        birth_date: "",
        family_members: [],
        ministry_involvement: [],
        notes: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Create member with initial status as "visitor" or "regular_attendee"
            await Member.create({
                ...formData,
                member_status: "regular_attendee",
                join_date: new Date().toISOString().split('T')[0]
            });

            setIsSuccess(true);
            setFormData({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                address: "",
                birth_date: "",
                family_members: [],
                ministry_involvement: [],
                notes: ""
            });
        } catch (err) {
            console.error("Registration error:", err);
            setError("Failed to submit registration. Please try again or contact us directly.");
        }

        setIsSubmitting(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full shadow-2xl">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Registration Received!
                        </h1>
                        <p className="text-lg text-slate-600">
                            Thank you for registering with our church! We're excited to welcome you to our community.
                        </p>
                        <p className="text-slate-600">
                            Someone from our team will reach out to you within 48 hours to complete your membership process.
                        </p>
                        <Button
                            onClick={() => setIsSuccess(false)}
                            className="mt-6"
                        >
                            Register Another Person
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Church className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-3">
                        Become a Member
                    </h1>
                    <p className="text-lg text-slate-600">
                        We're thrilled that you want to join our church family! Please fill out the form below.
                    </p>
                </div>

                <Card className="shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <CardTitle className="text-2xl">Membership Registration Form</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">
                                        First Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="John"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">
                                        Last Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Doe"
                                    />
                                </div>
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
                                        Phone Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">
                                    Home Address
                                </Label>
                                <Input
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="123 Main St, City, State, ZIP"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birth_date">
                                    Date of Birth
                                </Label>
                                <Input
                                    id="birth_date"
                                    name="birth_date"
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">
                                    Tell Us About Yourself
                                </Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="How did you hear about us? What brings you to our church? Any questions or prayer requests?"
                                    rows={4}
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Submitting Registration...
                                        </>
                                    ) : (
                                        "Submit Membership Registration"
                                    )}
                                </Button>
                            </div>

                            <p className="text-sm text-slate-500 text-center">
                                By submitting this form, you agree to be contacted by our church for membership follow-up.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}