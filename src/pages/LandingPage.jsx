import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LazyImage from "../components/shared/LazyImage";
import SEO from "../components/shared/SEO";
import {
  Church,
  Users,
  Heart,
  Calendar,
  MessageSquare,
  BarChart3,
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Monitor,
  Tablet,
  Video,
  Mail,
  DollarSign,
  TrendingUp,
  UserPlus,
  Zap,
  Sparkles,
  Crown,
  Gift,
  FileText,
  Bell,
  UserCheck } from
"lucide-react";

import { base44 } from "@/api/base44Client";

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user is already authenticated
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        // User not authenticated, that's fine on landing page
        console.log('User not authenticated');
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    // Redirect to Base44 authentication - let Layout handle the redirect after login
    base44.auth.redirectToLogin();
  };

  const features = [
  {
    icon: Users,
    title: "Member Management",
    description: "Complete member directory with engagement scoring, lifecycle stages, family connections, custom fields, and automated follow-up tasks.",
    tier: "All Plans",
    color: "from-blue-500 to-indigo-600",
    unique: true
  },
  {
    icon: Heart,
    title: "Digital Giving (6 Ways!)",
    description: "Kiosk giving, text-to-give, online portal, mobile app, QR codes, check scanning—all included. Recurring donations & receipt automation!",
    tier: "All Plans",
    color: "from-green-500 to-emerald-600",
    unique: true
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "QR check-ins, registration with QR tickets, volunteer sign-ups, feedback collection, promotional flyers, and automated communications.",
    tier: "All Plans",
    color: "from-purple-500 to-pink-600"
  },
  {
    icon: MessageSquare,
    title: "SMS & MMS Campaigns",
    description: "1,000 SMS + 10 MMS monthly included. Text keywords, automated workflows, multimedia campaigns with videos and images.",
    tier: "Growth+",
    color: "from-orange-500 to-amber-600",
    unique: true
  },
  {
    icon: Mail,
    title: "Multi-Channel Communications",
    description: "Bulk email, SMS, push notifications, in-app messaging, targeted segments, scheduled broadcasts, and contact groups.",
    tier: "All Plans",
    color: "from-red-500 to-rose-600"
  },
  {
    icon: Video,
    title: "Video Meetings (Built-In)",
    description: "HD video with 25-200 participants, breakout rooms, recording, screen share, co-hosts. No Zoom subscription needed!",
    tier: "Growth+",
    color: "from-cyan-500 to-teal-600",
    unique: true
  },
  {
    icon: UserCheck,
    title: "Visitor Follow-Up Automation",
    description: "Automated 7-step nurture sequence via SMS/email, engagement scoring, at-risk alerts, QR visitor cards, visit tracking.",
    tier: "Growth+",
    color: "from-violet-500 to-purple-600",
    unique: true
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics & Reports",
    description: "Donor risk prediction, giving trends, member engagement tracking, attendance reports, exportable dashboards, financial statements.",
    tier: "Growth+",
    color: "from-indigo-500 to-blue-600"
  },
  {
    icon: UserPlus,
    title: "Kids Check-In System",
    description: "Secure check-in/out with label printing, parent SMS notifications, allergy tracking, safety protocols, family management.",
    tier: "Growth+",
    color: "from-pink-500 to-rose-600",
    unique: true
  },
  {
    icon: DollarSign,
    title: "Financial Management",
    description: "Budget tracking, expense management, financial reports, automated donor statements, tax receipts, check deposit scanning.",
    tier: "Growth+",
    color: "from-emerald-500 to-green-600"
  },
  {
    icon: Gift,
    title: "Coffee Shop & Bookstore POS",
    description: "Full point-of-sale with inventory management, stock alerts, loyalty programs, order fulfillment, kitchen display. Unique to REACH!",
    tier: "Growth+",
    color: "from-amber-500 to-yellow-600",
    unique: true
  },
  {
    icon: Smartphone,
    title: "Progressive Web App (PWA)",
    description: "Install-to-home-screen capability, push notifications, offline mode, mobile bottom nav, responsive design—no App Store needed!",
    tier: "All Plans",
    color: "from-purple-500 to-indigo-600",
    unique: true
  },
  {
    icon: Monitor,
    title: "Display Management & Casting",
    description: "Push announcements to lobby displays, schedule content, manage digital signage remotely, stream live services.",
    tier: "Growth+",
    color: "from-slate-500 to-gray-600"
  },
  {
    icon: Shield,
    title: "Advanced Permissions & Groups",
    description: "Role-based access, custom user roles, member groups, segmentation, granular security controls, group join requests.",
    tier: "Premium",
    color: "from-red-500 to-orange-600"
  },
  {
    icon: Bell,
    title: "Sermon Library & Community",
    description: "Upload sermons, auto-sync from YouTube/Facebook, share with REACH Connect community of churches, video player with engagement.",
    tier: "All Plans",
    color: "from-blue-500 to-cyan-600"
  },
  {
    icon: Zap,
    title: "Automated Workflows",
    description: "Visitor follow-up sequences, donor thank-you automation, volunteer reminders, event communications, SMS workflows—all automated.",
    tier: "Growth+",
    color: "from-yellow-500 to-orange-600",
    unique: true
  },
  {
    icon: Users,
    title: "Volunteer Management",
    description: "Track volunteer hours, manage roles, send invitations, schedule shifts, application tracking, engagement metrics.",
    tier: "All Plans",
    color: "from-teal-500 to-cyan-600"
  },
  {
    icon: Heart,
    title: "Donor Communications",
    description: "Automated thank-you messages, targeted campaigns by giving history, segment builders, engagement tracking, personalized outreach.",
    tier: "Growth+",
    color: "from-rose-500 to-pink-600"
  },
  {
    icon: FileText,
    title: "Resource Library & Webinars",
    description: "Share documents, videos, articles with members. Host webinars with registration tracking and attendance reports.",
    tier: "Growth+",
    color: "from-indigo-500 to-purple-600"
  },
  {
    icon: TrendingUp,
    title: "Member Engagement Scoring",
    description: "AI-powered engagement tracking, lifecycle stages, at-risk member alerts, automated follow-up tasks, retention insights.",
    tier: "Premium",
    color: "from-blue-500 to-sky-600",
    unique: true
  }];


  const givingMethods = [
  { icon: Smartphone, title: "Free Giving App", desc: "Mobile app for iOS & Android" },
  { icon: MessageSquare, title: "Text Giving", desc: "Give via SMS keyword" },
  { icon: Monitor, title: "Online Giving", desc: "Secure web portal" },
  { icon: Gift, title: "Gift Entry", desc: "Manual gift recording" },
  { icon: FileText, title: "Check Scanning", desc: "Quick check deposits" },
  { icon: Tablet, title: "Kiosk Giving", desc: "In-church tablet stations" }];


  const testimonials = [
  {
    name: "Pastor Michael Johnson",
    church: "Grace Community Church",
    size: "500 members",
    quote: "REACH Church Connect transformed our operations. The giving platform alone increased donations by 40%, and the automated visitor follow-up helped us engage 3x more first-time guests.",
    savings: "Saving $400/month vs. our old setup"
  },
  {
    name: "Sarah Williams",
    church: "New Hope Baptist",
    size: "1,200 members",
    quote: "The SMS campaigns are a game-changer. We can reach our entire congregation instantly, and the engagement rates are phenomenal. Setup was incredibly easy.",
    savings: "Replaced 3 separate tools"
  },
  {
    name: "Rev. David Chen",
    church: "City Life Church",
    size: "250 members",
    quote: "As a church planter, I needed affordable tools that could scale. REACH gives us enterprise features at a fraction of the cost. The kiosk giving has been perfect for our launch.",
    savings: "60% less than Planning Center"
  }];


  return (
    <>
        <SEO 
            title="REACH Church Connect - Complete Church Management System"
            description="Streamline your ministry with our all-in-one church management platform. Manage members, donations, events, communications, and more."
            keywords="church management software, church giving, member management, church events, ministry software, church CRM"
            url="/"
        />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
            {/* Stewardship CTA Banner */}
            <section className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 py-6">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                            Be Good Stewards of God's Resources
                        </h2>
                        <p className="text-xl text-green-50 font-semibold">
                            Quit Overpaying for Church Software
                        </p>
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 lg:py-32">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-purple-100 opacity-40"></div>
                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-block mb-6">
                            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                                💎 Trusted by 500+ Churches Worldwide
                            </Badge>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight">
                            All-in-One Church Management Software
                            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Built for Growing Churches
                            </span>
                        </h1>
                        <p className="text-xl lg:text-2xl text-slate-600 mb-6 leading-relaxed">
                            Manage members, giving, volunteers, events, and communication—all in one powerful platform. 
                            No more juggling multiple tools or subscriptions.
                        </p>
                        <ul className="text-lg text-slate-700 mb-12 space-y-3 max-w-2xl mx-auto text-left">
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                <span><strong>Text-to-Give & Mobile Giving</strong> — Accept donations anywhere</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                <span><strong>Member & Volunteer Management</strong> — Track engagement effortlessly</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                <span><strong>Event Management & Communications</strong> — Streamline ministry operations</span>
                            </li>
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <Link to={createPageUrl('SubscriptionPlans')}>
                                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-10 py-6 text-lg font-semibold shadow-xl shadow-blue-500/30">
                                    Start 14-Day Free Trial
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="px-10 py-6 text-lg font-semibold border-2 hover:bg-slate-50">
                                Watch Demo
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium">No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium">Cancel anytime</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium">Setup in 10 minutes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Giving Methods Showcase */}
            <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <Badge className="bg-green-600 text-white px-4 py-2 mb-4">
                            <Heart className="w-4 h-4 inline mr-2" />
                            Digital Giving
                        </Badge>
                        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Give Your Church 6 Ways to Give
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            From mobile apps to kiosk stations, make giving effortless for your congregation
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {givingMethods.map((method, index) => (
            <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white">
                                <CardContent className="pt-8 pb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <method.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mb-2">{method.title}</h3>
                                    <p className="text-xs text-slate-600">{method.desc}</p>
                                </CardContent>
                            </Card>
            ))}
                    </div>

                    <div className="mt-16 text-center">
                        <Card className="inline-block bg-white/80 backdrop-blur-sm border-2 border-green-200">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4">
                                    <div className="text-5xl font-bold text-green-600">$0</div>
                                    <div className="text-left">
                                        <div className="font-semibold text-slate-900">Transaction Fees</div>
                                        <div className="text-sm text-slate-600">Stripe's standard 2.9% + 30¢ only</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* What Makes Us Different */}
            <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <Badge className="bg-amber-600 text-white px-4 py-2 mb-4">
                            <Crown className="w-4 h-4 inline mr-2" />
                            Why REACH is Different
                        </Badge>
                        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Features They Charge Extra For, We Include
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            Planning Center charges $100+/mo for SMS. Tithe.ly charges $50+/mo for Kids Check-In. 
                            Subsplash charges $200+/mo for video. We include it all.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <Card className="border-2 border-amber-300 bg-white">
                            <CardContent className="p-6 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Gift className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Coffee Shop POS System</h3>
                                <p className="text-slate-600 mb-3">
                                    Full inventory management, loyalty programs, order fulfillment—completely unique to REACH!
                                </p>
                                <Badge className="bg-amber-100 text-amber-800">Only REACH has this!</Badge>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-purple-300 bg-white">
                            <CardContent className="p-6 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Smartphone className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Native PWA Experience</h3>
                                <p className="text-slate-600 mb-3">
                                    Install-to-home-screen, push notifications, offline mode—no App Store needed. Competitors charge $100+/mo!
                                </p>
                                <Badge className="bg-purple-100 text-purple-800">Save $1,200/year</Badge>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-blue-300 bg-white">
                            <CardContent className="p-6 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Automated Member Engagement</h3>
                                <p className="text-slate-600 mb-3">
                                    Engagement scoring, lifecycle stages, at-risk alerts, automated follow-up tasks. Planning Center doesn't have this!
                                </p>
                                <Badge className="bg-blue-100 text-blue-800">REACH Exclusive</Badge>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-xl">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Feature Comparison</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2">
                                        <th className="text-left py-3 px-4 text-slate-600 font-semibold">Feature</th>
                                        <th className="text-center py-3 px-4 text-blue-600 font-bold">REACH</th>
                                        <th className="text-center py-3 px-4 text-slate-500">Planning Center</th>
                                        <th className="text-center py-3 px-4 text-slate-500">Tithe.ly</th>
                                        <th className="text-center py-3 px-4 text-slate-500">Subsplash</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b">
                                        <td className="py-3 px-4">SMS Messaging (1,000/mo)</td>
                                        <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 inline" /></td>
                                        <td className="text-center py-3 px-4 text-slate-400">$100/mo extra</td>
                                        <td className="text-center py-3 px-4 text-slate-400">$75/mo extra</td>
                                        <td className="text-center py-3 px-4 text-slate-400">$99/mo extra</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4">Video Meetings (up to 200)</td>
                                        <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 inline" /></td>
                                        <td className="text-center py-3 px-4 text-slate-400">Not available</td>
                                        <td className="text-center py-3 px-4 text-slate-400">Not available</td>
                                        <td className="text-center py-3 px-4 text-slate-400">$200/mo extra</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4">Kids Check-In System</td>
                                        <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 inline" /></td>
                                        <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 inline" /></td>
                                        <td className="text-center py-3 px-4 text-slate-400">$50/mo extra</td>
                                        <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 inline" /></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4">PWA Mobile App</td>
                                        <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 inline" /></td>
                                        <td className="text-center py-3 px-4 text-slate-400">Not available</td>
                                        <td className="text-center py-3 px-4 text-slate-400">$100/mo extra</td>
                                        <td className="text-center py-3 px-4 text-slate-400">$149/mo extra</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4">Coffee Shop POS & Inventory</td>
                                        <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 inline" /></td>
                                        <td className="text-center py-3 px-4 text-slate-400">Not available</td>
                                        <td className="text-center py-3 px-4 text-slate-400">Not available</td>
                                        <td className="text-center py-3 px-4 text-slate-400">Not available</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4">Engagement Scoring & At-Risk Alerts</td>
                                        <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 inline" /></td>
                                        <td className="text-center py-3 px-4 text-slate-400">Limited</td>
                                        <td className="text-center py-3 px-4 text-slate-400">Not available</td>
                                        <td className="text-center py-3 px-4 text-slate-400">Not available</td>
                                    </tr>
                                    <tr className="border-b bg-blue-50">
                                        <td className="py-3 px-4 font-bold">Monthly Cost (Growth Plan)</td>
                                        <td className="text-center py-3 px-4 text-blue-600 font-bold">$119</td>
                                        <td className="text-center py-3 px-4 text-slate-600 font-semibold">$229+</td>
                                        <td className="text-center py-3 px-4 text-slate-600 font-semibold">$244+</td>
                                        <td className="text-center py-3 px-4 text-slate-600 font-semibold">$468+</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-center text-slate-600 mt-6">
                            💰 Save <strong>$110-349/month</strong> compared to competitors with ALL features included!
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Everything Your Church Needs, All in One Place
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            From first-time visitors to faithful givers, manage every aspect of your ministry with 16+ powerful modules
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
            <Card key={index} className={`group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${feature.unique ? 'ring-2 ring-amber-300' : ''}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                            <feature.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <Badge className={
                                            feature.tier === "All Plans" ? "bg-green-100 text-green-800" :
                                            feature.tier === "Growth+" ? "bg-blue-100 text-blue-800" :
                                            "bg-purple-100 text-purple-800"
                                        }>
                                            {feature.tier}
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        {feature.title}
                                        {feature.unique && <Sparkles className="w-4 h-4 text-amber-500" />}
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                                    {feature.unique && (
                                        <Badge className="mt-3 bg-amber-50 text-amber-700 border border-amber-300">Unique to REACH</Badge>
                                    )}
                                </CardContent>
                            </Card>
            ))}
                    </div>
                </div>
            </section>

            {/* SMS & Automation Highlight */}
            <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <Badge className="bg-purple-600 text-white px-4 py-2 mb-6">
                                <Zap className="w-4 h-4 inline mr-2" />
                                Powerful Automation
                            </Badge>
                            <h2 className="text-4xl font-bold text-slate-900 mb-6">
                                Engage Members with Smart Messaging
                            </h2>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">SMS Keywords</h3>
                                        <p className="text-slate-600">People text CONNECT and instantly get a welcome message and link to your visitor card</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">MMS Campaigns</h3>
                                        <p className="text-slate-600">Send beautiful multimedia messages with images, videos, and interactive slides</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <UserPlus className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Visitor Follow-Up</h3>
                                        <p className="text-slate-600">Automated 7-step nurture sequence that turns visitors into members</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Bell className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Giving Thank-Yous</h3>
                                        <p className="text-slate-600">Automatic thank-you messages within minutes of every donation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-8 shadow-2xl">
                            <div className="space-y-4">
                                <div className="bg-blue-100 rounded-lg p-4 ml-auto max-w-[80%]">
                                    <p className="text-sm text-blue-900">Hello Matt, This is Pastor Johnson we are thrilled to have you with us in church!

                  </p>
                                </div>
                                <div className="bg-blue-500 rounded-lg p-4 mr-auto max-w-[80%]">
                                    <p className="text-sm text-white"> Thank you, Pastor. I was blessed with teaching and worship songs.

                  </p>
                                </div>
                                <div className="bg-pink-100 ml-auto p-4 rounded-lg max-w-[80%]">
                                    <p className="text-sm text-blue-900">Glad to hear. There will be a coffee hour this Sunday before the service, would you like to join us? We hope to see you again.

                  </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Analytics Dashboard Preview */}
            <section className="py-20 bg-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <Badge className="bg-slate-700 text-white px-4 py-2 mb-4">
                            <BarChart3 className="w-4 h-4 inline mr-2" />
                            Data-Driven Ministry
                        </Badge>
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Make Decisions with Confidence
                        </h2>
                        <p className="text-xl text-slate-300">
                            Track donor risk, giving trends, and member engagement—all in one beautiful dashboard
                        </p>
                    </div>
                    <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl">
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-700 rounded-xl p-6">
                                <div className="text-sm text-slate-400 mb-2">Monthly Giving</div>
                                <div className="text-3xl font-bold text-white mb-1">$42,510</div>
                                <div className="text-sm text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    +18% vs last month
                                </div>
                            </div>
                            <div className="bg-slate-700 rounded-xl p-6">
                                <div className="text-sm text-slate-400 mb-2">Active Donors</div>
                                <div className="text-3xl font-bold text-white mb-1">287</div>
                                <div className="text-sm text-slate-400">95 pledged this month</div>
                            </div>
                            <div className="bg-slate-700 rounded-xl p-6">
                                <div className="text-sm text-slate-400 mb-2">High Risk Donors</div>
                                <div className="text-3xl font-bold text-orange-400 mb-1">12</div>
                                <div className="text-sm text-slate-400">Need follow-up</div>
                            </div>
                        </div>
                        <div className="bg-slate-700 rounded-xl p-6">
                            <div className="h-48 flex items-end justify-between gap-2">
                                {[65, 72, 58, 85, 92, 78, 88, 95, 102, 110, 98, 115].map((height, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t" style={{ height: `${height}%` }} />
                ))}
                            </div>
                            <div className="flex justify-between mt-4 text-xs text-slate-400">
                                <span>Jan</span>
                                <span>Feb</span>
                                <span>Mar</span>
                                <span>Apr</span>
                                <span>May</span>
                                <span>Jun</span>
                                <span>Jul</span>
                                <span>Aug</span>
                                <span>Sep</span>
                                <span>Oct</span>
                                <span>Nov</span>
                                <span>Dec</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Responsive Design Showcase */}
            <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Works Everywhere
                        </h2>
                        <p className="text-xl text-slate-600">
                            Desktop, tablet, and mobile—your church admin goes wherever you go
                        </p>
                    </div>
                    <div className="flex items-end justify-center gap-8">
                        <div className="w-[200px]">
                            <div className="bg-slate-900 rounded-t-3xl p-4 pb-0">
                                <div className="bg-white rounded-t-2xl h-[400px] p-4 text-xs">
                                    <div className="space-y-2">
                                        <div className="bg-slate-100 h-8 rounded"></div>
                                        <div className="bg-blue-100 h-20 rounded"></div>
                                        <div className="bg-slate-100 h-16 rounded"></div>
                                        <div className="bg-slate-100 h-16 rounded"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900 h-8 rounded-b-3xl"></div>
                            <div className="text-center mt-4 text-sm text-slate-600 font-semibold">Mobile</div>
                        </div>
                        <div className="w-[300px]">
                            <div className="bg-slate-900 rounded-t-3xl p-6 pb-0">
                                <div className="bg-white rounded-t-2xl h-[450px] p-6 text-xs">
                                    <div className="space-y-3">
                                        <div className="bg-slate-100 h-10 rounded"></div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-green-100 h-24 rounded"></div>
                                            <div className="bg-blue-100 h-24 rounded"></div>
                                        </div>
                                        <div className="bg-slate-100 h-20 rounded"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900 h-8 rounded-b-3xl"></div>
                            <div className="text-center mt-4 text-sm text-slate-600 font-semibold">Tablet</div>
                        </div>
                        <div className="w-[400px]">
                            <div className="bg-slate-900 rounded-t-3xl p-8 pb-0">
                                <div className="bg-white rounded-t-2xl h-[300px] p-8">
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="bg-green-100 h-20 rounded"></div>
                                        <div className="bg-blue-100 h-20 rounded"></div>
                                        <div className="bg-purple-100 h-20 rounded"></div>
                                        <div className="bg-orange-100 h-20 rounded"></div>
                                    </div>
                                    <div className="bg-slate-100 h-32 rounded"></div>
                                </div>
                            </div>
                            <div className="bg-slate-900 h-4 rounded-b-3xl"></div>
                            <div className="text-center mt-4 text-sm text-slate-600 font-semibold">Desktop</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">
                            Loved by Church Leaders
                        </h2>
                        <p className="text-xl text-slate-600">
                            Join hundreds of churches already growing with REACH Church Connect
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 hover:shadow-2xl transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="flex mb-4">
                                        {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                                    </div>
                                    <p className="text-slate-700 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                                    <div className="border-t border-slate-200 pt-6">
                                        <div className="font-semibold text-slate-900">{testimonial.name}</div>
                                        <div className="text-sm text-slate-600">{testimonial.church}</div>
                                        <div className="text-xs text-slate-500 mt-1">{testimonial.size}</div>
                                        <Badge className="mt-3 bg-green-100 text-green-800 hover:bg-green-100">
                                            💰 {testimonial.savings}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
            ))}
                    </div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        Starting at Just $49/Month
                    </h2>
                    <p className="text-xl text-blue-100 mb-4">
                        Our Growth plan at $119/mo matches Tithe.ly pricing but includes SMS, MMS, Video, Kids Check-In, 
                        Coffee Shop POS, Bookstore, and Financial Management—features competitors charge $100-200/mo extra for!
                    </p>
                    <p className="text-lg text-blue-200 mb-8 font-semibold">
                        💰 Save $600-2,400/year vs Planning Center, Pushpay, or Subsplash
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <Link to={createPageUrl('SubscriptionPlans')}>
                            <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 px-10 py-6 text-lg font-semibold">
                                View Pricing Plans
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Button 
                            size="lg" 
                            variant="outline"
                            className="border-2 border-white text-white hover:bg-white/10 px-10 py-6 text-lg font-semibold"
                            onClick={() => window.location.href = 'mailto:info@reachconnect.app?subject=Interested in REACH Church Connect'}
                        >
                            <Mail className="w-5 h-5 mr-2" />
                            Contact Sales
                        </Button>
                    </div>
                    <p className="text-sm text-blue-200">
                        14 days free • No credit card required • Cancel anytime
                    </p>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        Ready to Transform Your Church?
                    </h2>
                    <p className="text-xl text-slate-300 mb-12">
                        Get started in 10 minutes. No technical skills required.
                    </p>
                    <Link to={createPageUrl('SubscriptionPlans')}>
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-10 py-6 text-lg font-semibold shadow-xl">
                            Start Your Free Trial
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                        <div>
                            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-400" />
                            <div className="font-semibold mb-1">Setup in 10 Minutes</div>
                            <div className="text-slate-400">Get up and running today</div>
                        </div>
                        <div>
                            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-400" />
                            <div className="font-semibold mb-1">Migration Assistance</div>
                            <div className="text-slate-400">We'll help you switch</div>
                        </div>
                        <div>
                            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-400" />
                            <div className="font-semibold mb-1">24/7 Support</div>
                            <div className="text-slate-400">
                                <button 
                                        onClick={() => window.location.href = 'mailto:support@reachconnect.app?subject=Support Request'}
                                        className="underline hover:text-slate-200"
                                    >
                                        Contact us
                                    </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-white py-16" style={{ backgroundColor: '#0B2D5B' }}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                        {/* Logo & About */}
                        <div className="col-span-2 md:col-span-1">
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/b9c4b383d_REACHLOGOFORBLUEBACKGROUND20-md.jpeg"
                                alt="REACH Church Connect Logo"
                                className="h-[640px] w-auto mb-4"
                            />
                            <p className="text-slate-400 text-sm">
                                Empowering churches with modern technology.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to={createPageUrl('SubscriptionPlans')} className="hover:text-white">Pricing</Link></li>
                                <li><Link to={createPageUrl('PublicEventsCalendar')} className="hover:text-white">Events</Link></li>
                                <li><Link to={createPageUrl('PublicGiving')} className="hover:text-white">Give Online</Link></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to={createPageUrl('HelpCenter')} className="hover:text-white">Help Center</Link></li>
                                <li><Link to={createPageUrl('Documentation')} className="hover:text-white">Documentation</Link></li>
                                <li><Link to={createPageUrl('Support')} className="hover:text-white">Contact Support</Link></li>
                                <li><Link to={createPageUrl('Resources')} className="hover:text-white">Resources</Link></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to={createPageUrl('Careers')} className="hover:text-white">Careers</Link></li>
                                <li><a href="mailto:support@reachchurchMS.com" className="hover:text-white">Contact Us</a></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to={createPageUrl('PrivacyPolicy')} className="hover:text-white">Privacy Policy</Link></li>
                                <li><Link to={createPageUrl('TermsOfService')} className="hover:text-white">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between">
                        <div className="text-slate-400 text-sm mb-4 md:mb-0">
                            © 2024 REACH Church Connect. A product of Bold Intelligent Solutions, LLC. All rights reserved.
                        </div>
                        <div className="flex gap-4 text-sm text-slate-400">
                            <a href="mailto:support@reachchurchMS.com" className="hover:text-white">support@reachchurchMS.com</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </>
  );
}