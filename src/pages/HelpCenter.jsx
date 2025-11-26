import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, Users, DollarSign, Calendar, MessageSquare, 
    Baby, Video, BarChart3, Settings, BookOpen, ChevronRight,
    PlayCircle, FileText, Headphones
} from "lucide-react";

const categories = [
    {
        title: "Getting Started",
        icon: PlayCircle,
        color: "blue",
        articles: ["Quick Start Guide", "Setting Up Your Church Profile", "Inviting Team Members", "Navigating the Dashboard"]
    },
    {
        title: "Member Management",
        icon: Users,
        color: "green",
        articles: ["Adding New Members", "Importing Member Data", "Member Groups & Tags", "Tracking Attendance"]
    },
    {
        title: "Online Giving",
        icon: DollarSign,
        color: "emerald",
        articles: ["Setting Up Stripe Connect", "Creating Giving Categories", "Recurring Donations", "Generating Tax Statements"]
    },
    {
        title: "Events & Calendar",
        icon: Calendar,
        color: "purple",
        articles: ["Creating Events", "Event Registration", "Volunteer Scheduling", "Check-In Systems"]
    },
    {
        title: "SMS & Communications",
        icon: MessageSquare,
        color: "orange",
        articles: ["Setting Up Sinch SMS", "Creating Keywords", "Broadcasting Messages", "Email Templates"]
    },
    {
        title: "Kids Check-In",
        icon: Baby,
        color: "pink",
        articles: ["Kids Check-In Setup", "Printing Name Tags", "Security Features", "Parent Notifications"]
    },
    {
        title: "Streaming & Sermons",
        icon: Video,
        color: "red",
        articles: ["YouTube Integration", "Facebook Live Setup", "Sermon Library", "Community Sharing"]
    },
    {
        title: "Reports & Analytics",
        icon: BarChart3,
        color: "indigo",
        articles: ["Financial Reports", "Attendance Trends", "Giving Analytics", "Exporting Data"]
    }
];

const popularArticles = [
    "How to set up online giving",
    "Importing members from another system",
    "Setting up SMS text messaging",
    "Creating your first event",
    "Connecting your bank account"
];

export default function HelpCenterPage() {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        emerald: "bg-emerald-100 text-emerald-600",
        purple: "bg-purple-100 text-purple-600",
        orange: "bg-orange-100 text-orange-600",
        pink: "bg-pink-100 text-pink-600",
        red: "bg-red-100 text-red-600",
        indigo: "bg-indigo-100 text-indigo-600"
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold mb-4">Help Center</h1>
                    <p className="text-xl text-blue-100 mb-8">
                        Find answers, guides, and resources to help you succeed
                    </p>
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <Input 
                            className="pl-12 py-6 text-lg text-slate-900" 
                            placeholder="Search for help articles..."
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Quick Links */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Link to={createPageUrl("Documentation")}>
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Documentation</h3>
                                    <p className="text-sm text-slate-600">In-depth guides & tutorials</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                            </CardContent>
                        </Card>
                    </Link>
                    <Link to={createPageUrl("Support")}>
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Headphones className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Contact Support</h3>
                                    <p className="text-sm text-slate-600">Get personalized help</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                            </CardContent>
                        </Card>
                    </Link>
                    <Link to={createPageUrl("Resources")}>
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Resources</h3>
                                    <p className="text-sm text-slate-600">Templates & downloads</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Popular Articles */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Popular Articles</h2>
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {popularArticles.map((article, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <span className="text-slate-700">{article}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Categories */}
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by Category</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, idx) => {
                        const Icon = category.icon;
                        return (
                            <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
                                <CardContent className="p-6">
                                    <div className={`w-12 h-12 ${colorClasses[category.color]} rounded-lg flex items-center justify-center mb-4`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mb-3">{category.title}</h3>
                                    <ul className="space-y-2">
                                        {category.articles.map((article, aidx) => (
                                            <li key={aidx} className="text-sm text-slate-600 hover:text-blue-600 cursor-pointer">
                                                {article}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Need More Help */}
                <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
                    <p className="text-blue-100 mb-6">Our support team is here to assist you</p>
                    <Link to={createPageUrl("Support")}>
                        <Button className="bg-white text-blue-600 hover:bg-blue-50">
                            Contact Support
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}