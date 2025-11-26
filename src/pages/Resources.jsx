import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Download, FileText, Video, BookOpen, Users, 
    Calendar, DollarSign, CheckSquare, Presentation,
    FileSpreadsheet, Image, Megaphone
} from "lucide-react";

const resources = [
    {
        category: "Templates",
        items: [
            { title: "Member Import CSV Template", description: "Standard format for bulk importing members", icon: FileSpreadsheet, type: "CSV" },
            { title: "Visitor Follow-Up Email Templates", description: "5 email templates for visitor engagement", icon: FileText, type: "DOC" },
            { title: "Event Planning Checklist", description: "Comprehensive checklist for church events", icon: CheckSquare, type: "PDF" },
            { title: "Volunteer Schedule Template", description: "Weekly/monthly volunteer scheduling spreadsheet", icon: Calendar, type: "XLSX" }
        ]
    },
    {
        category: "Guides & eBooks",
        items: [
            { title: "Church Digital Transformation Guide", description: "Step-by-step guide to modernizing your church", icon: BookOpen, type: "PDF" },
            { title: "Online Giving Best Practices", description: "Maximize digital donations", icon: DollarSign, type: "PDF" },
            { title: "Building a Volunteer Culture", description: "Recruit and retain dedicated volunteers", icon: Users, type: "PDF" },
            { title: "Effective Church Communications", description: "Engage your congregation across channels", icon: Megaphone, type: "PDF" }
        ]
    },
    {
        category: "Video Tutorials",
        items: [
            { title: "Getting Started with REACH", description: "15-minute overview of key features", icon: Video, type: "VIDEO", duration: "15:00" },
            { title: "Setting Up Online Giving", description: "Complete Stripe setup walkthrough", icon: Video, type: "VIDEO", duration: "8:30" },
            { title: "Kids Check-In Configuration", description: "Set up secure children's check-in", icon: Video, type: "VIDEO", duration: "12:00" },
            { title: "SMS Messaging Setup", description: "Configure Sinch and create keywords", icon: Video, type: "VIDEO", duration: "10:45" }
        ]
    },
    {
        category: "Graphics & Media",
        items: [
            { title: "Social Media Graphics Pack", description: "Customizable templates for church social media", icon: Image, type: "ZIP" },
            { title: "Presentation Backgrounds", description: "50+ worship presentation backgrounds", icon: Presentation, type: "ZIP" },
            { title: "Event Flyer Templates", description: "Editable Canva templates for events", icon: Image, type: "CANVA" }
        ]
    }
];

const webinars = [
    { title: "Maximizing Church Engagement in 2024", date: "Dec 5, 2024", time: "2:00 PM EST" },
    { title: "Year-End Giving Strategies", date: "Dec 12, 2024", time: "1:00 PM EST" },
    { title: "New Features Overview: Q4 2024", date: "Dec 19, 2024", time: "3:00 PM EST" }
];

export default function ResourcesPage() {
    const getTypeColor = (type) => {
        const colors = {
            PDF: "bg-red-100 text-red-800",
            CSV: "bg-green-100 text-green-800",
            XLSX: "bg-emerald-100 text-emerald-800",
            DOC: "bg-blue-100 text-blue-800",
            VIDEO: "bg-purple-100 text-purple-800",
            ZIP: "bg-orange-100 text-orange-800",
            CANVA: "bg-pink-100 text-pink-800"
        };
        return colors[type] || "bg-slate-100 text-slate-800";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">Resources</h1>
                    <p className="text-xl text-blue-100">
                        Templates, guides, and tools to help your church thrive
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Upcoming Webinars */}
                <Card className="border-0 shadow-lg mb-12">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Video className="w-5 h-5 text-blue-600" />
                            Upcoming Webinars
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            {webinars.map((webinar, idx) => (
                                <div key={idx} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <h4 className="font-semibold text-slate-900 mb-2">{webinar.title}</h4>
                                    <p className="text-sm text-slate-600 mb-3">{webinar.date} • {webinar.time}</p>
                                    <Button size="sm" variant="outline">Register Free</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Resource Categories */}
                {resources.map((category, cidx) => (
                    <div key={cidx} className="mb-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">{category.category}</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {category.items.map((item, iidx) => {
                                const Icon = item.icon;
                                return (
                                    <Card key={iidx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-slate-100 rounded-lg">
                                                        <Icon className="w-6 h-6 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                                                        <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                                                            {item.duration && (
                                                                <span className="text-xs text-slate-500">{item.duration}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* CTA */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-4">Need Custom Resources?</h2>
                    <p className="text-blue-100 mb-6">Our team can help create custom templates and training for your church</p>
                    <Link to={createPageUrl("Support")}>
                        <Button className="bg-white text-blue-600 hover:bg-blue-50">
                            Contact Us
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}