import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    CheckCircle, XCircle, TrendingUp, DollarSign, Users, Zap, Shield, Star,
    Target, Award, MessageSquare, Video, Baby, Coffee, ArrowRight, Clock,
    Smartphone, Globe, BarChart3, Heart, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';

export default function CompetitiveAnalysis() {
    const [activeTab, setActiveTab] = useState("overview");

    // Current Market Research Data (Updated Nov 2024)
    const competitors = [
        {
            name: "Tithe.ly / Breeze",
            logo: "💨",
            pricing: {
                free: "$0/mo (Giving only)",
                chms: "$72/mo (Church Management)",
                allAccess: "$119/mo (All Access)"
            },
            transactionFees: "2.9% + $0.30",
            marketPosition: "Budget Leader - Acquired by Tithe.ly",
            marketShare: "~30% combined",
            targetChurch: "Small-Medium (50-500 members)",
            strengths: [
                "Free giving platform available",
                "Simple flat pricing - no member limits",
                "Easy setup, clean interface",
                "30-day free trial",
                "50,000+ churches using platform",
                "QuickBooks integration included"
            ],
            weaknesses: [
                "SMS costs extra (250/mo included, then pay per msg)",
                "No built-in video meetings",
                "No MMS/multimedia messaging",
                "Basic kids check-in only",
                "No multi-campus in standard plans",
                "Custom app costs $89/mo extra",
                "Limited automation workflows"
            ],
            annualCost: {
                basic: 864,
                withAddons: 1908
            }
        },
        {
            name: "Planning Center",
            logo: "📋",
            pricing: {
                free: "People free",
                perProduct: "$0-199/mo per product",
                typical: "$100-300/mo total"
            },
            transactionFees: "2.15% + $0.30 (discounted via Stripe)",
            marketPosition: "Premium Modular Leader",
            marketShare: "~25%",
            targetChurch: "Medium-Large (200-2000+ members)",
            strengths: [
                "Industry gold standard reputation",
                "Modular - only pay for what you need",
                "Beautiful, intuitive UI",
                "Excellent services/worship planning",
                "Strong developer community",
                "90,000+ customers",
                "Lowest processing fees (2.15%)"
            ],
            weaknesses: [
                "Expensive when using all modules ($200+/mo)",
                "No built-in SMS messaging",
                "No video meetings",
                "Complex pricing - hard to predict costs",
                "No coffee shop/bookstore modules",
                "Overkill for small churches"
            ],
            annualCost: {
                basic: 1200,
                withAddons: 3600
            }
        },
        {
            name: "Pushpay / CCB",
            logo: "💳",
            pricing: {
                core: "$199/mo (Core)",
                advanced: "$299/mo (Advanced)", 
                complete: "$399+/mo (Complete)"
            },
            transactionFees: "2.3%+ (varies)",
            marketPosition: "Enterprise Giving-Focused",
            marketShare: "~15%",
            targetChurch: "Large Churches (500-10,000+ members)",
            strengths: [
                "Best-in-class giving/donation tools",
                "Robust ChMS (Church Community Builder)",
                "Advanced analytics & donor development",
                "Multi-site capabilities",
                "Custom branded apps",
                "Enterprise-grade security"
            ],
            weaknesses: [
                "Very expensive ($2,400-5,000+/year)",
                "Long contracts often required",
                "Complex setup and onboarding",
                "Overkill for churches under 500",
                "Feature-gated pricing tiers",
                "Support varies by plan"
            ],
            annualCost: {
                basic: 2388,
                withAddons: 4788
            }
        },
        {
            name: "Subsplash",
            logo: "📲",
            pricing: {
                giving: "$0/mo (Giving only)",
                standard: "$199/mo",
                pro: "$399/mo"
            },
            transactionFees: "2.3-2.99% + $0.30",
            marketPosition: "Custom App Builder",
            marketShare: "~8%",
            targetChurch: "Tech-forward churches (300-3000)",
            strengths: [
                "Best custom-branded church apps",
                "Excellent media streaming",
                "Strong engagement tools",
                "White-label options",
                "Good for multi-campus",
                "Growing platform"
            ],
            weaknesses: [
                "Expensive for full features",
                "Hidden per-feature costs",
                "Mobile-centric (weak web admin)",
                "Complex setup",
                "High switching costs",
                "No built-in video meetings"
            ],
            annualCost: {
                basic: 2388,
                withAddons: 4788
            }
        },
        {
            name: "Elvanto",
            logo: "🌐",
            pricing: {
                basic: "$50/mo",
                standard: "$100/mo",
                premium: "$150/mo"
            },
            transactionFees: "Via Stripe",
            marketPosition: "International Simple Solution",
            marketShare: "~5%",
            targetChurch: "Small-Medium international",
            strengths: [
                "Simple, intuitive interface",
                "Good international support",
                "Roster/scheduling features",
                "Affordable pricing",
                "No contracts"
            ],
            weaknesses: [
                "Limited US market presence",
                "Basic giving features",
                "No SMS messaging",
                "No video meetings",
                "Limited integrations"
            ],
            annualCost: {
                basic: 600,
                withAddons: 1800
            }
        }
    ];

    // REACH Church Connect Pricing & Positioning
    const reachPricing = {
        starter: {
            name: "Starter",
            price: 65,
            annualPrice: 624,
            memberLimit: 100,
            features: [
                "Member Management (100 limit)",
                "Event Planning & Calendar",
                "Basic Giving Tracking",
                "Volunteer Coordination",
                "Email Communications (500/mo)",
                "Basic Reports & Analytics",
                "Visitor Management",
                "Sermon Library"
            ],
            notIncluded: ["SMS/MMS", "Video Meetings", "Kids Check-in", "Kiosk Giving", "Financial Management"]
        },
        growth: {
            name: "Growth",
            price: 149,
            annualPrice: 1430,
            memberLimit: 500,
            features: [
                "Everything in Starter",
                "📱 SMS Messaging (1,000 msgs/month)",
                "📸 MMS Campaigns (10/month)",
                "🎥 Video Meetings (25 participants)",
                "👶 Kids Check-In/Check-Out",
                "💰 Kiosk Giving Stations",
                "☕ Coffee Shop POS",
                "📚 Bookstore Management",
                "🤖 Automated Workflows",
                "📊 Advanced Analytics",
                "💰 Financial Management",
                "📄 Tax Statement Generation"
            ],
            notIncluded: []
        },
        premium: {
            name: "Premium",
            price: 299,
            annualPrice: 2870,
            memberLimit: "Unlimited",
            features: [
                "Everything in Growth",
                "♾️ Unlimited SMS/MMS",
                "🎥 Video Meetings (200 participants)",
                "📹 Video Recording",
                "🚪 Breakout Rooms",
                "🏢 Multi-Campus Support",
                "🎨 White-Label Branding",
                "🔌 API Access",
                "📞 Dedicated Phone Number",
                "👤 Dedicated Account Manager"
            ],
            notIncluded: []
        }
    };

    // Pricing Comparison Data
    const pricingComparisonData = [
        { name: 'REACH Growth', price: 149, color: '#3b82f6' },
        { name: 'Tithe.ly All Access', price: 119, color: '#10b981' },
        { name: 'Breeze ChMS', price: 72, color: '#8b5cf6' },
        { name: 'Planning Center (typical)', price: 200, color: '#f59e0b' },
        { name: 'Pushpay Core', price: 199, color: '#ef4444' },
        { name: 'Subsplash Standard', price: 199, color: '#ec4899' },
    ];

    // Feature comparison matrix
    const featureMatrix = [
        { feature: "Member Management", reach: "✅", tithelyBreeze: "✅", planningCenter: "✅", pushpay: "✅", subsplash: "✅" },
        { feature: "Online Giving", reach: "✅", tithelyBreeze: "✅", planningCenter: "✅", pushpay: "✅", subsplash: "✅" },
        { feature: "SMS Messaging", reach: "✅ 1,000/mo", tithelyBreeze: "⚠️ 250/mo", planningCenter: "❌", pushpay: "✅ Extra", subsplash: "❌" },
        { feature: "MMS Multimedia", reach: "✅ Included", tithelyBreeze: "❌", planningCenter: "❌", pushpay: "❌", subsplash: "❌" },
        { feature: "Video Meetings", reach: "✅ 25 seats", tithelyBreeze: "❌", planningCenter: "❌", pushpay: "❌", subsplash: "❌" },
        { feature: "Kids Check-In", reach: "✅ Included", tithelyBreeze: "⚠️ Basic", planningCenter: "✅ $19/mo", pushpay: "✅", subsplash: "❌" },
        { feature: "Kiosk Giving", reach: "✅ Included", tithelyBreeze: "✅", planningCenter: "✅", pushpay: "✅", subsplash: "✅" },
        { feature: "Coffee Shop POS", reach: "✅ Unique", tithelyBreeze: "❌", planningCenter: "❌", pushpay: "❌", subsplash: "❌" },
        { feature: "Bookstore Module", reach: "✅ Unique", tithelyBreeze: "❌", planningCenter: "❌", pushpay: "❌", subsplash: "❌" },
        { feature: "Automated Workflows", reach: "✅", tithelyBreeze: "✅", planningCenter: "✅", pushpay: "✅", subsplash: "⚠️" },
        { feature: "Multi-Campus", reach: "✅ Premium", tithelyBreeze: "❌", planningCenter: "✅", pushpay: "✅", subsplash: "✅" },
        { feature: "Custom App", reach: "🔜", tithelyBreeze: "✅ $89/mo", planningCenter: "❌", pushpay: "✅", subsplash: "✅" },
        { feature: "API Access", reach: "✅ Premium", tithelyBreeze: "❌", planningCenter: "✅", pushpay: "✅", subsplash: "✅" },
    ];

    // Annual TCO Comparison
    const annualTCOData = [
        { 
            name: 'REACH Growth', 
            base: 1788, 
            addons: 0, 
            total: 1788,
            includes: "SMS, MMS, Video, Kids Check-in, Kiosk, Coffee POS, Bookstore"
        },
        { 
            name: 'Tithe.ly All Access', 
            base: 1428, 
            addons: 600, 
            total: 2028,
            includes: "Base $119 + Extra SMS $50/mo typical"
        },
        { 
            name: 'Planning Center Full', 
            base: 2400, 
            addons: 828, 
            total: 3228,
            includes: "Services $60 + Check-ins $19 + Giving $49 + Groups $25"
        },
        { 
            name: 'Pushpay Advanced', 
            base: 3588, 
            addons: 600, 
            total: 4188,
            includes: "$299/mo base + typical add-ons"
        },
    ];

    // Market positioning strategy
    const positioningStrategy = {
        primaryTarget: "Small-Medium churches (50-500 members) currently using spreadsheets or basic tools",
        secondaryTarget: "Churches frustrated with expensive competitors seeking better value",
        uniquePositioning: "Enterprise features at SMB pricing - 'Planning Center quality at Breeze pricing'",
        keyDifferentiators: [
            {
                title: "SMS/MMS Included",
                description: "1,000 SMS + 10 MMS campaigns included in Growth tier. Competitors charge $50-100/mo extra.",
                savings: "$600-1,200/year"
            },
            {
                title: "Video Meetings Built-In",
                description: "25-200 participant video meetings included. Others require Zoom/Teams ($150-300/year)",
                savings: "$150-300/year"
            },
            {
                title: "Unique Modules",
                description: "Coffee Shop POS & Bookstore management - no competitor offers these",
                savings: "Unique value"
            },
            {
                title: "All-Inclusive Pricing",
                description: "No surprise add-on costs. What you see is what you pay.",
                savings: "Predictable budgeting"
            }
        ]
    };

    // Growth projections
    const growthProjections = [
        { month: 'M1', churches: 10, mrr: 1200 },
        { month: 'M3', churches: 50, mrr: 6000 },
        { month: 'M6', churches: 150, mrr: 18000 },
        { month: 'M12', churches: 500, mrr: 60000 },
        { month: 'M18', churches: 1200, mrr: 144000 },
        { month: 'M24', churches: 2500, mrr: 300000 },
        { month: 'M36', churches: 5000, mrr: 600000 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
                        <Star className="w-4 h-4 mr-2 inline" />
                        Market Intelligence Report - November 2024
                    </Badge>
                    <h1 className="text-4xl font-bold text-slate-900">
                        Church Management System (ChMS) Competitive Analysis
                    </h1>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                        Strategic positioning analysis for REACH Church Connect in the $500M+ church management software market
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
                        <TabsTrigger value="overview">Market Overview</TabsTrigger>
                        <TabsTrigger value="competitors">Competitors</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                        <TabsTrigger value="positioning">Positioning</TabsTrigger>
                        <TabsTrigger value="strategy">Go-to-Market</TabsTrigger>
                    </TabsList>

                    {/* Market Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <Card className="shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                    Market Opportunity 2024-2025
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid md:grid-cols-4 gap-6 mb-8">
                                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                                        <div className="text-3xl font-bold text-blue-600">380,000+</div>
                                        <div className="text-sm text-slate-600 mt-1">Churches in USA</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                                        <div className="text-3xl font-bold text-purple-600">$580M</div>
                                        <div className="text-sm text-slate-600 mt-1">Market Size (2024)</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-xl">
                                        <div className="text-3xl font-bold text-green-600">12.5%</div>
                                        <div className="text-sm text-slate-600 mt-1">CAGR Growth</div>
                                    </div>
                                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                                        <div className="text-3xl font-bold text-orange-600">55%</div>
                                        <div className="text-sm text-slate-600 mt-1">Still Using Spreadsheets</div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                            <Target className="w-5 h-5" /> Target Market Segments
                                        </h4>
                                        <ul className="text-sm text-blue-800 space-y-2">
                                            <li>• <strong>85%</strong> of churches have under 200 members (underserved)</li>
                                            <li>• <strong>55%</strong> still use spreadsheets/paper (huge opportunity)</li>
                                            <li>• <strong>40%</strong> switched ChMS in past 3 years (high churn)</li>
                                            <li>• <strong>92%</strong> want online giving post-COVID</li>
                                            <li>• <strong>67%</strong> want text messaging capabilities</li>
                                            <li>• <strong>45%</strong> need video meeting integration</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" /> Key Market Trends
                                        </h4>
                                        <ul className="text-sm text-green-800 space-y-2">
                                            <li>• <strong>Mobile-first</strong> giving growing 35% YoY</li>
                                            <li>• <strong>SMS engagement</strong> 5x higher than email</li>
                                            <li>• <strong>Hybrid worship</strong> now permanent fixture</li>
                                            <li>• <strong>Younger pastors</strong> expect modern tech</li>
                                            <li>• <strong>Consolidation:</strong> Tithe.ly acquired Breeze</li>
                                            <li>• <strong>Price sensitivity</strong> increasing post-2023</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Competitors Tab */}
                    <TabsContent value="competitors" className="space-y-6">
                        <Card className="shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-purple-600" />
                                    Competitive Landscape Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {competitors.map(comp => (
                                    <div key={comp.name} className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-4xl">{comp.logo}</div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">{comp.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <Badge className="bg-blue-100 text-blue-800">{comp.marketPosition}</Badge>
                                                        <span className="text-sm text-slate-600">Share: {comp.marketShare}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-slate-500">Processing Fees</div>
                                                <div className="font-semibold text-slate-900">{comp.transactionFees}</div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">Pricing Tiers</div>
                                                {Object.entries(comp.pricing).map(([key, val]) => (
                                                    <div key={key} className="text-sm">
                                                        <span className="text-slate-600 capitalize">{key}:</span>{" "}
                                                        <span className="font-medium">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <div className="text-xs text-green-700 mb-1 font-semibold">Strengths</div>
                                                <ul className="text-xs text-slate-600 space-y-1">
                                                    {comp.strengths.slice(0, 4).map((s, i) => (
                                                        <li key={i} className="flex items-start gap-1">
                                                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-red-50 rounded-lg">
                                                <div className="text-xs text-red-700 mb-1 font-semibold">Weaknesses (Our Opportunity)</div>
                                                <ul className="text-xs text-slate-600 space-y-1">
                                                    {comp.weaknesses.slice(0, 4).map((w, i) => (
                                                        <li key={i} className="flex items-start gap-1">
                                                            <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                                            {w}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="text-sm text-slate-600 border-t border-slate-100 pt-3">
                                            <strong>Target:</strong> {comp.targetChurch} | 
                                            <strong className="ml-2">Est. Annual Cost:</strong> ${comp.annualCost.basic.toLocaleString()} - ${comp.annualCost.withAddons.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Pricing Tab */}
                    <TabsContent value="pricing" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Price Comparison Chart */}
                            <Card className="shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        Monthly Price Comparison
                                    </CardTitle>
                                    <CardDescription>Comparable tier pricing across platforms</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={pricingComparisonData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                                                <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                                                <Tooltip formatter={(value) => [`$${value}/mo`, 'Price']} />
                                                <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                                                    {pricingComparisonData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Annual TCO */}
                            <Card className="shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-purple-600" />
                                        Annual Total Cost of Ownership
                                    </CardTitle>
                                    <CardDescription>Including typical add-ons for equivalent features</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {annualTCOData.map((item, idx) => (
                                            <div key={item.name} className={`p-4 rounded-lg ${idx === 0 ? 'bg-blue-50 border-2 border-blue-300' : 'bg-slate-50'}`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`font-semibold ${idx === 0 ? 'text-blue-900' : 'text-slate-900'}`}>
                                                        {item.name}
                                                        {idx === 0 && <Badge className="ml-2 bg-blue-600">Our Solution</Badge>}
                                                    </span>
                                                    <span className={`text-xl font-bold ${idx === 0 ? 'text-blue-600' : 'text-slate-700'}`}>
                                                        ${item.total.toLocaleString()}/yr
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-600">{item.includes}</div>
                                                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-slate-400'}`}
                                                        style={{ width: `${(item.total / 4200) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 text-green-800 font-semibold">
                                            <Award className="w-5 h-5" />
                                            REACH saves churches $1,000-2,400/year vs competitors
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Feature Matrix */}
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>Feature Comparison Matrix</CardTitle>
                                <CardDescription>REACH Growth ($149/mo) vs competitor equivalent tiers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="font-semibold">Feature</TableHead>
                                                <TableHead className="text-blue-600 font-bold bg-blue-50">REACH Growth</TableHead>
                                                <TableHead>Tithe.ly/Breeze</TableHead>
                                                <TableHead>Planning Center</TableHead>
                                                <TableHead>Pushpay</TableHead>
                                                <TableHead>Subsplash</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {featureMatrix.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{row.feature}</TableCell>
                                                    <TableCell className="bg-blue-50 font-semibold">{row.reach}</TableCell>
                                                    <TableCell>{row.tithelyBreeze}</TableCell>
                                                    <TableCell>{row.planningCenter}</TableCell>
                                                    <TableCell>{row.pushpay}</TableCell>
                                                    <TableCell>{row.subsplash}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 text-xs text-slate-500">
                                    ✅ = Included | ⚠️ = Limited/Extra Cost | ❌ = Not Available
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Positioning Tab */}
                    <TabsContent value="positioning" className="space-y-6">
                        <Card className="shadow-2xl border-2 border-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <Zap className="w-8 h-8" />
                                    REACH Church Connect: Strategic Positioning
                                </CardTitle>
                                <CardDescription className="text-blue-100">
                                    "Enterprise features at SMB pricing"
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Value Proposition */}
                                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">🎯 Core Value Proposition</h3>
                                    <p className="text-lg text-slate-700 mb-4">
                                        <strong>"{positioningStrategy.uniquePositioning}"</strong>
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm font-semibold text-blue-800 mb-2">Primary Target</div>
                                            <p className="text-sm text-slate-600">{positioningStrategy.primaryTarget}</p>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-purple-800 mb-2">Secondary Target</div>
                                            <p className="text-sm text-slate-600">{positioningStrategy.secondaryTarget}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Differentiators */}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">💎 Key Differentiators</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {positioningStrategy.keyDifferentiators.map((diff, idx) => (
                                            <div key={idx} className="p-4 bg-white rounded-xl border-2 border-green-200 hover:shadow-lg transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-900">{diff.title}</h4>
                                                    <Badge className="bg-green-100 text-green-800">{diff.savings}</Badge>
                                                </div>
                                                <p className="text-sm text-slate-600">{diff.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recommended Pricing Adjustment */}
                                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
                                    <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                                        <DollarSign className="w-6 h-6" />
                                        Recommended Pricing Strategy
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="text-center p-4 bg-white rounded-lg">
                                            <div className="text-sm text-slate-600 mb-1">Starter</div>
                                            <div className="text-3xl font-bold text-slate-900">$65/mo</div>
                                            <div className="text-xs text-green-600 mt-1">Undercut Breeze $72</div>
                                        </div>
                                        <div className="text-center p-4 bg-blue-100 rounded-lg border-2 border-blue-400">
                                            <div className="text-sm text-blue-700 font-semibold mb-1">Growth (Best Value)</div>
                                            <div className="text-3xl font-bold text-blue-900">$149/mo</div>
                                            <div className="text-xs text-blue-600 mt-1">More value than $200+ competitors</div>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-lg">
                                            <div className="text-sm text-slate-600 mb-1">Premium</div>
                                            <div className="text-3xl font-bold text-slate-900">$299/mo</div>
                                            <div className="text-xs text-green-600 mt-1">40% less than Pushpay Complete</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-white rounded-lg">
                                        <div className="text-sm text-slate-700">
                                            <strong>💡 Strategy:</strong> Position Growth tier as the "sweet spot" - 
                                            more features than Tithe.ly All Access ($119) at only $30 more, 
                                            with SMS/MMS/Video that competitors charge $100+/mo extra for.
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Strategy Tab */}
                    <TabsContent value="strategy" className="space-y-6">
                        <Card className="shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-6 h-6 text-orange-600" />
                                    Go-to-Market Strategy & Projections
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Growth Projection Chart */}
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-4">📈 36-Month Growth Projections</h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={growthProjections}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis yAxisId="left" tickFormatter={(v) => v.toLocaleString()} />
                                                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v/1000)}k`} />
                                                <Tooltip formatter={(value, name) => [
                                                    name === 'churches' ? value.toLocaleString() : `$${value.toLocaleString()}`,
                                                    name === 'churches' ? 'Churches' : 'MRR'
                                                ]} />
                                                <Legend />
                                                <Line yAxisId="left" type="monotone" dataKey="churches" stroke="#3b82f6" strokeWidth={3} name="Churches" />
                                                <Line yAxisId="right" type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={3} name="MRR" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Phase Strategy */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                                            <h4 className="font-bold text-blue-900">Launch (M1-6)</h4>
                                        </div>
                                        <ul className="text-sm text-blue-800 space-y-2">
                                            <li>• Target: 150 churches</li>
                                            <li>• Focus: Small churches (50-200)</li>
                                            <li>• Offer: 30% off first year</li>
                                            <li>• MRR Goal: $18,000</li>
                                            <li>• Strategy: Partner with 10 influential pastors</li>
                                        </ul>
                                    </div>
                                    <div className="p-5 bg-purple-50 rounded-xl border border-purple-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">2</div>
                                            <h4 className="font-bold text-purple-900">Growth (M7-18)</h4>
                                        </div>
                                        <ul className="text-sm text-purple-800 space-y-2">
                                            <li>• Target: 1,200 churches</li>
                                            <li>• Expand: Medium churches (200-500)</li>
                                            <li>• Launch: Referral program (20%)</li>
                                            <li>• MRR Goal: $144,000</li>
                                            <li>• Strategy: Target competitor churn</li>
                                        </ul>
                                    </div>
                                    <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">3</div>
                                            <h4 className="font-bold text-green-900">Scale (M19-36)</h4>
                                        </div>
                                        <ul className="text-sm text-green-800 space-y-2">
                                            <li>• Target: 5,000+ churches</li>
                                            <li>• Expand: Large & multi-campus</li>
                                            <li>• International: Canada, UK</li>
                                            <li>• MRR Goal: $600,000</li>
                                            <li>• ARR: $7.2M</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Marketing Channels */}
                                <div className="p-5 bg-slate-50 rounded-xl">
                                    <h3 className="font-bold text-lg text-slate-900 mb-4">🎯 Marketing & Sales Channels</h3>
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <div className="p-3 bg-white rounded-lg">
                                            <div className="font-semibold text-slate-900 mb-2">Digital Marketing</div>
                                            <ul className="text-xs text-slate-600 space-y-1">
                                                <li>• Facebook/IG ads to pastors</li>
                                                <li>• YouTube tutorials</li>
                                                <li>• SEO for "church software"</li>
                                                <li>• Google Ads</li>
                                            </ul>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg">
                                            <div className="font-semibold text-slate-900 mb-2">Partnerships</div>
                                            <ul className="text-xs text-slate-600 space-y-1">
                                                <li>• Pastor influencers</li>
                                                <li>• Church consultants</li>
                                                <li>• Denominations</li>
                                                <li>• Seminary partnerships</li>
                                            </ul>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg">
                                            <div className="font-semibold text-slate-900 mb-2">Events</div>
                                            <ul className="text-xs text-slate-600 space-y-1">
                                                <li>• Church conferences</li>
                                                <li>• Webinars & demos</li>
                                                <li>• Pastor meetups</li>
                                                <li>• Trade shows</li>
                                            </ul>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg">
                                            <div className="font-semibold text-slate-900 mb-2">Referrals</div>
                                            <ul className="text-xs text-slate-600 space-y-1">
                                                <li>• 20% recurring commission</li>
                                                <li>• Affiliate program</li>
                                                <li>• Case study incentives</li>
                                                <li>• Review programs</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Success Metrics */}
                                <div className="p-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
                                    <h3 className="font-bold text-lg mb-4">🏆 Key Success Metrics to Track</h3>
                                    <div className="grid md:grid-cols-5 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-bold">5,000</div>
                                            <div className="text-xs text-blue-200">Churches by Y3</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">$7.2M</div>
                                            <div className="text-xs text-blue-200">ARR Target</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">&lt;5%</div>
                                            <div className="text-xs text-blue-200">Monthly Churn</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">$120</div>
                                            <div className="text-xs text-blue-200">Avg Revenue/Church</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">40%</div>
                                            <div className="text-xs text-blue-200">Growth → Premium</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}