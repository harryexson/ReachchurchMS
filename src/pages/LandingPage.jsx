import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function LandingPage() {
  // Mock authentication state and function for the landing page example
  // In a real application, this would typically come from an AuthContext or a global state manager
  const [currentUser, setCurrentUser] = useState(null); // null means not logged in
  // For testing logged-in state, uncomment one of these:
  // const [currentUser, setCurrentUser] = useState({ id: '123', role: 'admin' });
  // const [currentUser, setCurrentUser] = useState({ id: '456', role: 'member' });

  const handleLogin = () => {
    // In a real application, this would redirect to a login page or trigger a login modal
    console.log("Simulating login...");
    // For demonstration purposes, we'll set a mock user
    setCurrentUser({ id: 'mock-user-1', role: 'admin' }); // or 'member'
  };

  const features = [
  {
    icon: Users,
    title: "Member Management",
    description: "Complete member directory with engagement tracking, family units, and custom fields.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: Heart,
    title: "Digital Giving",
    description: "Kiosk giving, text-to-give, online donations, and automated thank-you messages.",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Schedule events, manage registrations, check-ins with QR codes, and volunteer coordination.",
    color: "from-purple-500 to-pink-600"
  },
  {
    icon: MessageSquare,
    title: "SMS & MMS Campaigns",
    description: "Text keywords, automated workflows, multimedia campaigns with images and videos.",
    color: "from-orange-500 to-amber-600"
  },
  {
    icon: Mail,
    title: "Email Communications",
    description: "Bulk email, group messaging, and automated follow-up sequences.",
    color: "from-red-500 to-rose-600"
  },
  {
    icon: Video,
    title: "Video Meetings",
    description: "HD video conferencing with up to 200 participants, breakout rooms, and recording.",
    color: "from-cyan-500 to-teal-600"
  },
  {
    icon: UserCheck,
    title: "Visitor Follow-Up",
    description: "Automated 7-step visitor nurture system with smart engagement tracking.",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Giving trends, donor risk analysis, member growth, and custom reports.",
    color: "from-indigo-500 to-blue-600"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
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
                            Church Management
                            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Made Simple
                            </span>
                        </h1>
                        <p className="text-xl lg:text-2xl text-slate-600 mb-12 leading-relaxed">
                            All-in-one platform with digital giving, SMS campaigns, visitor tracking,
                            and video meetings—at 40-60% less than competitors.
                        </p>
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
                        {givingMethods.map((method, index) =>
            <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white">
                                <CardContent className="pt-8 pb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <method.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mb-2">{method.title}</h3>
                                    <p className="text-xs text-slate-600">{method.desc}</p>
                                </CardContent>
                            </Card>
            )}
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

            {/* Features Grid */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Everything Your Church Needs
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            From first-time visitors to faithful givers, manage every aspect of your ministry
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) =>
            <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                                </CardContent>
                            </Card>
            )}
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
                                {[65, 72, 58, 85, 92, 78, 88, 95, 102, 110, 98, 115].map((height, i) =>
                <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t" style={{ height: `${height}%` }} />
                )}
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
                        {testimonials.map((testimonial, index) =>
            <Card key={index} className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 hover:shadow-2xl transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="flex mb-4">
                                        {[...Array(5)].map((_, i) =>
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  )}
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
            )}
                    </div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        Starting at Just $65/Month
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        40-60% less than Planning Center, Pushpay, or Tithely—with more features included
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
            <footer className="bg-white border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="flex items-center gap-3 mb-4 md:mb-0">
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/2ca3c03b0_ReachLOGOEdited08_44_18AM.png"
                                alt="REACH Church Connect Logo"
                                className="h-16 w-auto max-w-[200px] object-contain"
                            />
                        </div>
                        <div className="text-slate-600 text-sm">
                            © 2024 REACH Church Connect. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>);

}