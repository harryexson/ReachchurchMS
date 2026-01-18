import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, UserPlus, Church } from "lucide-react";

export default function PublicMemberRegistrationPage() {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        gender: "",
        age_group: "",
        birth_date: "",
        interests: "",
        skills: "",
        notes: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [existingVisitor, setExistingVisitor] = useState(null);
    const [checkingVisitor, setCheckingVisitor] = useState(false);

    const checkForExistingVisitor = async () => {
        if (!formData.email && !formData.phone) return;

        setCheckingVisitor(true);
        try {
            const visitors = await base44.entities.Visitor.filter({
                $or: [
                    { email: formData.email },
                    { phone: formData.phone }
                ]
            });

            if (visitors.length > 0) {
                setExistingVisitor(visitors[0]);
            }
        } catch (error) {
            console.error("Error checking visitor:", error);
        }
        setCheckingVisitor(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Check if already a member
            const existingMembers = await base44.entities.Member.filter({
                $or: [
                    { email: formData.email },
                    { phone: formData.phone }
                ]
            });

            if (existingMembers.length > 0) {
                alert("You're already registered as a member!");
                setIsSubmitting(false);
                return;
            }

            // Check for existing visitor to convert
            const visitors = await base44.entities.Visitor.filter({
                $or: [
                    { email: formData.email },
                    { phone: formData.phone }
                ]
            });

            const memberData = {
                ...formData,
                member_status: "member",
                join_date: new Date().toISOString().split('T')[0],
                interests: formData.interests ? formData.interests.split(',').map(i => i.trim()) : [],
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : []
            };

            // If visitor exists, include visitor info
            if (visitors.length > 0) {
                const visitor = visitors[0];
                memberData.visitor_id = visitor.id;
                memberData.total_visits = visitor.total_visits || 1;
                memberData.conversion_date = new Date().toISOString().split('T')[0];
                
                // Update visitor record to mark as converted
                await base44.entities.Visitor.update(visitor.id, {
                    conversion_status: "converted_to_member",
                    member_conversion_date: new Date().toISOString().split('T')[0]
                });
            }

            // Create member record
            await base44.entities.Member.create(memberData);
            
            // Send invitation to complete profile and create login credentials
            // This invites them as a MEMBER (role='user'), not an admin
            try {
                const response = await fetch('/api/functions/inviteUser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        full_name: `${formData.first_name} ${formData.last_name}`,
                        role: 'user', // CRITICAL: Members get 'user' role, NOT admin
                        phone: formData.phone
                    })
                });
                
                if (!response.ok) {
                    console.warn('Could not send invitation email/SMS, but member was created');
                }
            } catch (inviteError) {
                console.warn('Invitation error:', inviteError);
                // Don't fail registration if invitation fails
            }
            
            setSubmitted(true);
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed. Please try again or contact the church office.");
        }

        setIsSubmitting(false);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-2xl">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome to the Family!</h1>
                        <p className="text-slate-600">
                            {existingVisitor 
                                ? "Thank you for becoming a member! We're excited to have you transition from visitor to full member."
                                : "Thank you for registering as a member! We're excited to have you join our church family."
                            }
                        </p>
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-left">
                            <p className="text-sm font-semibold text-blue-900 mb-2">📧 Check Your Email!</p>
                            <p className="text-sm text-blue-800">
                                We've sent you an invitation email to <strong>{formData.email}</strong> to create your password 
                                and complete your profile. Check your inbox (and spam folder) to finish setting up your member account.
                            </p>
                            {formData.phone && (
                                <p className="text-xs text-blue-700 mt-2">
                                    You'll also receive an SMS confirmation at {formData.phone}
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-slate-500">
                            Once you create your password, you'll be able to access the member portal, view events, give online, and connect with our community.
                        </p>
                        <Button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700">
                            Register Another Person
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="max-w-2xl mx-auto py-8">
                <div className="text-center mb-8">
                    <Church className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Become a Member</h1>
                    <p className="text-slate-600">Join our church family today</p>
                    <Alert className="mt-4 bg-green-50 border-green-200 text-left">
                        <AlertDescription className="text-sm text-green-800">
                            <strong>Note:</strong> You're registering as a church member. After submitting, you'll receive an email 
                            to create your login credentials and access the member portal under your church's account.
                        </AlertDescription>
                    </Alert>
                </div>

                {existingVisitor && (
                    <Alert className="mb-6 bg-blue-50 border-blue-200">
                        <AlertDescription className="text-blue-800">
                            <p className="font-semibold mb-1">Welcome back, {existingVisitor.first_name}!</p>
                            <p className="text-sm">We see you've visited us before. Complete this form to officially become a member.</p>
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle>Member Registration Form</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>First Name *</Label>
                                    <Input
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Last Name *</Label>
                                    <Input
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        onBlur={checkForExistingVisitor}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Phone *</Label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        onBlur={checkForExistingVisitor}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>City</Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>State</Label>
                                    <Input
                                        value={formData.state}
                                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>ZIP Code</Label>
                                    <Input
                                        value={formData.zip_code}
                                        onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Birth Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Gender</Label>
                                    <Select value={String(formData.gender)} onValueChange={(value) => setFormData({...formData, gender: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Age Group</Label>
                                    <Select value={String(formData.age_group)} onValueChange={(value) => setFormData({...formData, age_group: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="child">Child (0-12)</SelectItem>
                                            <SelectItem value="teen">Teen (13-17)</SelectItem>
                                            <SelectItem value="young_adult">Young Adult (18-35)</SelectItem>
                                            <SelectItem value="adult">Adult (36-59)</SelectItem>
                                            <SelectItem value="senior">Senior (60+)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Interests (comma-separated)</Label>
                                    <Input
                                        value={formData.interests}
                                        onChange={(e) => setFormData({...formData, interests: e.target.value})}
                                        placeholder="e.g., Music, Youth Ministry, Teaching"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Skills & Talents (comma-separated)</Label>
                                    <Input
                                        value={formData.skills}
                                        onChange={(e) => setFormData({...formData, skills: e.target.value})}
                                        placeholder="e.g., Graphic Design, IT, Carpentry"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Additional Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        placeholder="Anything else you'd like us to know..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Register as Member
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}