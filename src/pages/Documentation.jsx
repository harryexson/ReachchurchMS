import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Search, Book, ChevronRight, ChevronDown, FileText,
    Users, DollarSign, Calendar, MessageSquare, Baby,
    Video, BarChart3, Settings, Zap, Shield, Database
} from "lucide-react";

const documentation = [
    {
        id: "getting-started",
        title: "Getting Started",
        icon: Zap,
        sections: [
            {
                title: "Quick Start Guide",
                content: "Welcome to REACH Church Connect! This guide will help you get your church management system up and running in minutes.\n\n1. **Create Your Account**: Sign up at our homepage and verify your email.\n2. **Set Up Your Profile**: Go to Settings and add your church name, logo, and branding.\n3. **Invite Your Team**: Add administrators and staff members to help manage your church.\n4. **Import Members**: Bring in your existing member data via CSV import.\n5. **Configure Giving**: Connect your bank account through Stripe to start accepting donations."
            },
            {
                title: "System Requirements",
                content: "REACH Church Connect is a cloud-based platform that works on any modern web browser.\n\n**Supported Browsers:**\n- Google Chrome (recommended)\n- Mozilla Firefox\n- Microsoft Edge\n- Safari\n\n**For Best Experience:**\n- Stable internet connection\n- Screen resolution of 1280x720 or higher\n- JavaScript enabled"
            },
            {
                title: "User Roles & Permissions",
                content: "**Administrator**: Full access to all features including settings, billing, and user management.\n\n**Staff**: Can manage members, events, and communications but cannot access billing or system settings.\n\n**Member**: Limited access to personal profile, giving history, and event registration."
            }
        ]
    },
    {
        id: "member-management",
        title: "Member Management",
        icon: Users,
        sections: [
            {
                title: "Adding Members",
                content: "Add new members individually or in bulk.\n\n**Individual Entry:**\n1. Go to Members → Add New\n2. Fill in member details\n3. Click Save\n\n**Bulk Import:**\n1. Go to Members → Import\n2. Download the CSV template\n3. Fill in your member data\n4. Upload the completed CSV"
            },
            {
                title: "Member Profiles",
                content: "Each member profile includes:\n- Contact information\n- Family connections\n- Giving history\n- Event attendance\n- Ministry involvement\n- Custom notes"
            },
            {
                title: "Groups & Tags",
                content: "Organize members using groups and tags for targeted communication and reporting.\n\n**Groups**: Create groups for small groups, ministries, or committees.\n\n**Tags**: Add flexible tags for filtering (e.g., 'volunteer', 'new member', 'youth')."
            }
        ]
    },
    {
        id: "giving",
        title: "Online Giving",
        icon: DollarSign,
        sections: [
            {
                title: "Setting Up Stripe",
                content: "Connect your church's bank account to receive donations.\n\n1. Go to Settings → Giving\n2. Click 'Connect Bank Account'\n3. Follow the Stripe Connect wizard\n4. Verify your nonprofit status\n5. Add your bank account details\n\n**Processing Fees**: Stripe charges 2.9% + $0.30 per transaction."
            },
            {
                title: "Giving Categories",
                content: "Create categories to track different types of giving:\n- Tithes\n- Offerings\n- Building Fund\n- Missions\n- Special Events\n\nGo to Giving Categories to add, edit, or deactivate categories."
            },
            {
                title: "Recurring Donations",
                content: "Members can set up recurring donations on a weekly, monthly, or annual basis.\n\nRecurring donations automatically process on the scheduled date and can be managed by donors through the Donor Portal."
            },
            {
                title: "Tax Statements",
                content: "Generate year-end giving statements for tax purposes.\n\n1. Go to Financial Reports\n2. Select 'Year-End Statements'\n3. Choose the tax year\n4. Generate and email statements to all donors"
            }
        ]
    },
    {
        id: "events",
        title: "Events & Calendar",
        icon: Calendar,
        sections: [
            {
                title: "Creating Events",
                content: "Create one-time or recurring events.\n\n1. Go to Events → Create New\n2. Enter event details\n3. Set date, time, and location\n4. Configure registration if needed\n5. Add volunteer needs\n6. Publish the event"
            },
            {
                title: "Event Registration",
                content: "Enable online registration for events that require sign-up.\n\n- Set registration limits\n- Collect custom information\n- Send confirmation emails\n- Generate QR codes for check-in"
            },
            {
                title: "Volunteer Scheduling",
                content: "Create volunteer shifts and let members sign up.\n\n1. Go to the event → Volunteers\n2. Create shifts with roles needed\n3. Set number of spots per role\n4. Send invitations or open for sign-up"
            }
        ]
    },
    {
        id: "communications",
        title: "Communications",
        icon: MessageSquare,
        sections: [
            {
                title: "SMS Setup (Sinch)",
                content: "Set up text messaging for your church.\n\n1. Create a Sinch account at sinch.com\n2. Get a phone number\n3. Go to Settings → SMS/Sinch\n4. Enter your credentials\n5. Set up environment variables\n6. Configure webhook URL"
            },
            {
                title: "Keywords",
                content: "Create SMS keywords for automated responses.\n\nExamples:\n- GIVE: Send donation link\n- CONNECT: Send visitor card\n- PRAY: Submit prayer request\n\nGo to Text Messaging → Create Keyword"
            },
            {
                title: "Email Communications",
                content: "Send emails to members, groups, or custom segments.\n\n- Announcement emails\n- Event invitations\n- Giving thank-you messages\n- Newsletter campaigns"
            }
        ]
    },
    {
        id: "kids",
        title: "Kids Check-In",
        icon: Baby,
        sections: [
            {
                title: "Check-In Setup",
                content: "Configure secure check-in for children's ministry.\n\n1. Set up age groups/classes\n2. Configure label printing\n3. Set security code options\n4. Train volunteers on the system"
            },
            {
                title: "Label Printing",
                content: "Print name tags and parent receipts.\n\n**Supported Printers:**\n- Brother QL series\n- DYMO LabelWriter\n- Zebra thermal printers\n\nConnect printers via WiFi or USB."
            },
            {
                title: "Security Features",
                content: "Keep children safe with built-in security.\n\n- Unique pickup codes\n- Parent notification via SMS\n- Allergy alerts on labels\n- Photo verification (optional)"
            }
        ]
    },
    {
        id: "streaming",
        title: "Streaming & Sermons",
        icon: Video,
        sections: [
            {
                title: "Live Streaming",
                content: "Stream services to YouTube, Facebook, or custom RTMP.\n\n1. Go to Settings → Streaming\n2. Connect your YouTube/Facebook account\n3. Add stream keys\n4. Set primary streaming platform"
            },
            {
                title: "Sermon Library",
                content: "Build a searchable library of past sermons.\n\n- Auto-import from YouTube\n- Add titles, descriptions, and series\n- Enable community sharing\n- Track view counts"
            }
        ]
    },
    {
        id: "reports",
        title: "Reports & Analytics",
        icon: BarChart3,
        sections: [
            {
                title: "Financial Reports",
                content: "Generate comprehensive financial reports.\n\n- Giving by category\n- Donor reports\n- Recurring donation status\n- Year-over-year comparisons"
            },
            {
                title: "Attendance Reports",
                content: "Track attendance trends across services and events.\n\n- Weekly/monthly attendance\n- Event participation\n- Visitor trends\n- Member engagement"
            },
            {
                title: "Exporting Data",
                content: "Export data to CSV or PDF for external analysis.\n\n1. Go to Reports\n2. Select report type\n3. Set date range and filters\n4. Click Export"
            }
        ]
    }
];

export default function DocumentationPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedSections, setExpandedSections] = useState({});
    const [selectedDoc, setSelectedDoc] = useState(documentation[0]);

    const toggleSection = (docId, sectionIdx) => {
        const key = `${docId}-${sectionIdx}`;
        setExpandedSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-4">Documentation</h1>
                    <p className="text-blue-100 mb-6">Everything you need to know about REACH Church Connect</p>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <Input 
                            className="pl-10 text-slate-900" 
                            placeholder="Search documentation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="border-0 shadow-lg sticky top-4">
                            <CardContent className="p-4">
                                <nav className="space-y-1">
                                    {documentation.map(doc => {
                                        const Icon = doc.icon;
                                        return (
                                            <button
                                                key={doc.id}
                                                onClick={() => setSelectedDoc(doc)}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                                    selectedDoc.id === doc.id
                                                        ? "bg-blue-50 text-blue-600"
                                                        : "hover:bg-slate-50 text-slate-700"
                                                }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-sm font-medium">{doc.title}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    {React.createElement(selectedDoc.icon, { className: "w-8 h-8 text-blue-600" })}
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedDoc.title}</h2>
                                </div>

                                <div className="space-y-6">
                                    {selectedDoc.sections.map((section, idx) => {
                                        const isExpanded = expandedSections[`${selectedDoc.id}-${idx}`] !== false;
                                        return (
                                            <div key={idx} className="border rounded-lg">
                                                <button
                                                    onClick={() => toggleSection(selectedDoc.id, idx)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-slate-400" />
                                                        <span className="font-semibold text-slate-900">{section.title}</span>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-4 pb-4">
                                                        <div className="prose prose-slate max-w-none">
                                                            {section.content.split('\n').map((line, lidx) => {
                                                                if (line.startsWith('**') && line.endsWith('**')) {
                                                                    return <h4 key={lidx} className="font-semibold text-slate-900 mt-4">{line.replace(/\*\*/g, '')}</h4>;
                                                                }
                                                                if (line.startsWith('- ')) {
                                                                    return <li key={lidx} className="text-slate-600 ml-4">{line.substring(2)}</li>;
                                                                }
                                                                if (line.match(/^\d+\./)) {
                                                                    return <p key={lidx} className="text-slate-600 ml-4">{line}</p>;
                                                                }
                                                                if (line.trim() === '') {
                                                                    return <br key={lidx} />;
                                                                }
                                                                return <p key={lidx} className="text-slate-600">{line}</p>;
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}