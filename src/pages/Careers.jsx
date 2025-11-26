import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Briefcase, MapPin, Clock, DollarSign, Users, 
    TrendingUp, Headphones, Settings, Send, CheckCircle,
    Building, Heart, Zap
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const jobListings = [
    {
        id: "sales-rep",
        title: "Sales Representative",
        department: "Sales",
        location: "Remote",
        type: "Full-time",
        salary: "$50,000 - $80,000 + Commission",
        icon: TrendingUp,
        description: "Join our dynamic sales team and help churches discover the power of REACH Church Connect. You'll be responsible for prospecting, demonstrating our platform, and closing deals with church leaders.",
        responsibilities: [
            "Prospect and qualify new church leads through outbound calling and networking",
            "Conduct product demonstrations via video conferencing",
            "Build and maintain relationships with church decision-makers",
            "Meet and exceed monthly sales quotas",
            "Collaborate with marketing on lead generation campaigns"
        ],
        requirements: [
            "2+ years of B2B sales experience",
            "Experience with SaaS or church technology preferred",
            "Excellent communication and presentation skills",
            "Self-motivated with strong work ethic",
            "Familiarity with church operations is a plus"
        ]
    },
    {
        id: "business-dev-manager",
        title: "Business Development Manager",
        department: "Business Development",
        location: "Remote / Hybrid",
        type: "Full-time",
        salary: "$70,000 - $100,000 + Bonus",
        icon: Briefcase,
        description: "Lead strategic partnerships and business growth initiatives. You'll identify new market opportunities, develop partnership strategies, and drive revenue growth through innovative business development tactics.",
        responsibilities: [
            "Identify and pursue strategic partnership opportunities",
            "Develop and execute business development strategies",
            "Build relationships with denominational leaders and church networks",
            "Negotiate partnership agreements and contracts",
            "Analyze market trends and competitive landscape"
        ],
        requirements: [
            "5+ years of business development experience",
            "Proven track record of closing large deals",
            "Strong negotiation and relationship-building skills",
            "Experience in religious or nonprofit sector preferred",
            "MBA or equivalent experience"
        ]
    },
    {
        id: "regional-bd-manager",
        title: "Regional Business Development Manager",
        department: "Business Development",
        location: "Southeast US",
        type: "Full-time",
        salary: "$75,000 - $110,000 + Bonus",
        icon: MapPin,
        description: "Own business development for the Southeast region. You'll build a territory strategy, attend regional conferences, and develop relationships with key church leaders and denominations.",
        responsibilities: [
            "Develop and execute regional growth strategy",
            "Attend church conferences and networking events",
            "Build relationships with regional denominational leaders",
            "Manage regional sales pipeline",
            "Collaborate with national team on best practices"
        ],
        requirements: [
            "5+ years of regional sales/BD experience",
            "Strong network in Southeast church community",
            "Willingness to travel 30-50%",
            "Experience with CRM and sales tools",
            "Deep understanding of church culture and needs"
        ]
    },
    {
        id: "operations-manager",
        title: "Operations Manager",
        department: "Operations",
        location: "Remote",
        type: "Full-time",
        salary: "$65,000 - $90,000",
        icon: Settings,
        description: "Oversee daily operations and ensure smooth delivery of our services. You'll optimize processes, manage vendor relationships, and support the team in delivering exceptional customer experiences.",
        responsibilities: [
            "Streamline operational processes and workflows",
            "Manage vendor and partner relationships",
            "Oversee customer onboarding processes",
            "Monitor and report on operational KPIs",
            "Support cross-functional team coordination"
        ],
        requirements: [
            "4+ years of operations management experience",
            "Experience with SaaS operations preferred",
            "Strong project management skills",
            "Excellent analytical and problem-solving abilities",
            "Experience with process improvement methodologies"
        ]
    },
    {
        id: "customer-support-specialist",
        title: "Customer Support Specialist",
        department: "Customer Success",
        location: "Remote",
        type: "Full-time",
        salary: "$40,000 - $55,000",
        icon: Headphones,
        description: "Be the friendly voice that helps churches succeed with our platform. You'll provide technical support, troubleshoot issues, and ensure our customers have an amazing experience.",
        responsibilities: [
            "Respond to customer inquiries via chat, email, and phone",
            "Troubleshoot technical issues and provide solutions",
            "Create and update support documentation",
            "Escalate complex issues to appropriate teams",
            "Gather customer feedback for product improvements"
        ],
        requirements: [
            "1+ years of customer support experience",
            "Technical aptitude and willingness to learn",
            "Excellent written and verbal communication",
            "Patient and empathetic demeanor",
            "Experience with help desk software"
        ]
    },
    {
        id: "customer-support-lead",
        title: "Customer Support Team Lead",
        department: "Customer Success",
        location: "Remote",
        type: "Full-time",
        salary: "$55,000 - $75,000",
        icon: Users,
        description: "Lead and mentor our customer support team. You'll set service standards, handle escalations, and ensure our support team delivers world-class service to every church we serve.",
        responsibilities: [
            "Lead and mentor customer support team members",
            "Handle escalated customer issues",
            "Develop and implement support policies and procedures",
            "Monitor team performance and provide coaching",
            "Collaborate with product team on customer feedback"
        ],
        requirements: [
            "3+ years of customer support experience",
            "1+ years of team leadership experience",
            "Strong conflict resolution skills",
            "Experience with support metrics and KPIs",
            "Passion for helping churches succeed"
        ]
    }
];

export default function CareersPage() {
    const [selectedJob, setSelectedJob] = useState(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        position: "",
        resume: "",
        coverLetter: "",
        linkedin: "",
        howHeard: ""
    });

    const handleApply = (job) => {
        setSelectedJob(job);
        setFormData(prev => ({ ...prev, position: job.title }));
        setIsApplyModalOpen(true);
        setSubmitSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await base44.integrations.Core.SendEmail({
                to: "hr@boldintelligentsolutions.com",
                subject: `Job Application: ${formData.position} - ${formData.name}`,
                body: `
New Job Application Received

Position: ${formData.position}
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
LinkedIn: ${formData.linkedin || "Not provided"}
How they heard about us: ${formData.howHeard || "Not specified"}

Cover Letter:
${formData.coverLetter}

Resume/Experience:
${formData.resume}

---
This application was submitted through the REACH Church Connect careers page.
                `
            });

            setSubmitSuccess(true);
            setFormData({
                name: "",
                email: "",
                phone: "",
                position: "",
                resume: "",
                coverLetter: "",
                linkedin: "",
                howHeard: ""
            });
        } catch (error) {
            console.error("Failed to submit application:", error);
            alert("Failed to submit application. Please try again or email hr@boldintelligentsolutions.com directly.");
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Mission</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Help us empower churches with technology that makes a difference. 
                        We're building the future of church management together.
                    </p>
                </div>
            </div>

            {/* Why Work With Us */}
            <div className="max-w-6xl mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Why Work With Us</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="text-center border-0 shadow-lg">
                        <CardContent className="p-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Mission-Driven</h3>
                            <p className="text-slate-600">Make a real impact by helping churches connect with their communities and grow their ministries.</p>
                        </CardContent>
                    </Card>
                    <Card className="text-center border-0 shadow-lg">
                        <CardContent className="p-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Growth Opportunity</h3>
                            <p className="text-slate-600">Join a fast-growing company with endless opportunities to learn, grow, and advance your career.</p>
                        </CardContent>
                    </Card>
                    <Card className="text-center border-0 shadow-lg">
                        <CardContent className="p-8">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Remote-First</h3>
                            <p className="text-slate-600">Work from anywhere with flexible hours. We trust our team to deliver great results.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Job Listings */}
            <div className="max-w-6xl mx-auto px-4 pb-20">
                <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Open Positions</h2>
                <div className="space-y-6">
                    {jobListings.map(job => {
                        const Icon = job.icon;
                        return (
                            <Card key={job.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <Icon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        <Briefcase className="w-3 h-3 mr-1" />
                                                        {job.department}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {job.location}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {job.type}
                                                    </Badge>
                                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                                        <DollarSign className="w-3 h-3 mr-1" />
                                                        {job.salary}
                                                    </Badge>
                                                </div>
                                                <p className="text-slate-600 mt-3 line-clamp-2">{job.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 lg:flex-shrink-0">
                                            <Button variant="outline" onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}>
                                                {selectedJob?.id === job.id ? "Hide Details" : "View Details"}
                                            </Button>
                                            <Button onClick={() => handleApply(job)} className="bg-blue-600 hover:bg-blue-700">
                                                Apply Now
                                            </Button>
                                        </div>
                                    </div>

                                    {selectedJob?.id === job.id && (
                                        <div className="mt-6 pt-6 border-t grid md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-3">Responsibilities</h4>
                                                <ul className="space-y-2">
                                                    {job.responsibilities.map((item, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-3">Requirements</h4>
                                                <ul className="space-y-2">
                                                    {job.requirements.map((item, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                                            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Application Modal */}
            <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
                    </DialogHeader>

                    {submitSuccess ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">Application Submitted!</h3>
                            <p className="text-slate-600 mb-4">
                                Thank you for your interest. Our HR team will review your application and contact you soon.
                            </p>
                            <Button onClick={() => setIsApplyModalOpen(false)}>Close</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                                    <Input
                                        id="linkedin"
                                        value={formData.linkedin}
                                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                        placeholder="https://linkedin.com/in/yourprofile"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="howHeard">How did you hear about us?</Label>
                                <Select value={formData.howHeard} onValueChange={(v) => setFormData({ ...formData, howHeard: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                                        <SelectItem value="indeed">Indeed</SelectItem>
                                        <SelectItem value="referral">Employee Referral</SelectItem>
                                        <SelectItem value="church">Church Connection</SelectItem>
                                        <SelectItem value="website">Company Website</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="coverLetter">Cover Letter *</Label>
                                <Textarea
                                    id="coverLetter"
                                    value={formData.coverLetter}
                                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                                    placeholder="Tell us why you're interested in this role and what makes you a great fit..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="resume">Resume / Experience Summary *</Label>
                                <Textarea
                                    id="resume"
                                    value={formData.resume}
                                    onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                                    placeholder="Please paste your resume or provide a summary of your relevant experience..."
                                    rows={6}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                    {isSubmitting ? "Submitting..." : "Submit Application"}
                                    <Send className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}