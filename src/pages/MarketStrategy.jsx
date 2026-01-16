import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    CheckCircle, XCircle, TrendingUp, DollarSign, Users, Target, 
    Award, Crown, Rocket, BarChart3, Download, FileText, Shield,
    Zap, Star, MessageSquare, Video, Baby, Coffee, ArrowRight,
    Globe, Smartphone, Heart, AlertTriangle, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, Legend } from 'recharts';

export default function MarketStrategyPage() {
    const [activeTab, setActiveTab] = useState('executive');
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = useRef(null);

    // REVISED COMPETITIVE REACH PRICING (Jan 2026) - More aggressive to compete
    const reachPricing = {
        starter: { name: "Starter", monthly: 49, annual: 470, members: 150 },
        growth: { name: "Growth", monthly: 119, annual: 1140, members: 750 },
        premium: { name: "Premium", monthly: 249, annual: 2390, members: "Unlimited" }
    };

    // COMPETITOR PRICING (Current as of Nov 2024)
    const competitors = [
        {
            name: "Tithe.ly / Breeze",
            pricing: { giving: "$0/mo", chms: "$72/mo", allAccess: "$119/mo" },
            processingFees: "2.9% + $0.30",
            marketShare: "~30%",
            strengths: ["Free giving tier", "Simple pricing", "50,000+ churches", "30-day trial"],
            weaknesses: ["SMS limited (250/mo)", "No video meetings", "No MMS", "Basic kids check-in"],
            annualCost: { basic: 864, full: 1908 }
        },
        {
            name: "Planning Center",
            pricing: { free: "People free", typical: "$100-300/mo total" },
            processingFees: "2.15% + $0.30",
            marketShare: "~25%",
            strengths: ["Industry standard", "Modular pricing", "Beautiful UI", "90,000+ churches"],
            weaknesses: ["Expensive at scale", "No SMS", "No video", "Complex pricing"],
            annualCost: { basic: 1200, full: 3600 }
        },
        {
            name: "Pushpay / CCB",
            pricing: { core: "$199/mo", advanced: "$299/mo", complete: "$399+/mo" },
            processingFees: "2.3%+",
            marketShare: "~15%",
            strengths: ["Best giving tools", "Enterprise features", "Multi-site", "Custom apps"],
            weaknesses: ["Very expensive", "Long contracts", "Overkill for small churches"],
            annualCost: { basic: 2388, full: 4788 }
        },
        {
            name: "Subsplash",
            pricing: { giving: "$0/mo", standard: "$199/mo", pro: "$399/mo" },
            processingFees: "2.3-2.99% + $0.30",
            marketShare: "~8%",
            strengths: ["Best custom apps", "Media streaming", "White-label"],
            weaknesses: ["Hidden costs", "Mobile-centric", "No video meetings"],
            annualCost: { basic: 2388, full: 4788 }
        }
    ];

    // Pricing comparison chart data
    const pricingComparisonData = [
        { name: 'REACH Starter', price: 49, color: '#3b82f6' },
        { name: 'REACH Growth', price: 119, color: '#8b5cf6' },
        { name: 'REACH Premium', price: 249, color: '#6366f1' },
        { name: 'Tithe.ly All Access', price: 119, color: '#10b981' },
        { name: 'Breeze ChMS', price: 72, color: '#14b8a6' },
        { name: 'Planning Center (avg)', price: 200, color: '#f59e0b' },
        { name: 'Pushpay Core', price: 199, color: '#ef4444' },
        { name: 'Subsplash Standard', price: 199, color: '#ec4899' },
    ];

    // Feature comparison matrix
    const featureMatrix = [
        { feature: "Member Management", reach: "✅ All tiers", competitor: "✅ All" },
        { feature: "Online Giving", reach: "✅ All tiers", competitor: "✅ All" },
        { feature: "SMS Messaging", reach: "✅ 1,000/mo (Growth)", competitor: "⚠️ Extra $50+/mo" },
        { feature: "MMS Campaigns", reach: "✅ 10/mo (Growth)", competitor: "❌ Not available" },
        { feature: "Video Meetings", reach: "✅ 25 seats (Growth)", competitor: "❌ Use Zoom separately" },
        { feature: "Kids Check-In", reach: "✅ Growth tier", competitor: "⚠️ Extra $19-50/mo" },
        { feature: "Kiosk Giving", reach: "✅ Growth tier", competitor: "✅ Most include" },
        { feature: "Coffee Shop POS", reach: "✅ UNIQUE", competitor: "❌ Not available" },
        { feature: "Bookstore Module", reach: "✅ UNIQUE", competitor: "❌ Not available" },
        { feature: "Automated Workflows", reach: "✅ Growth tier", competitor: "⚠️ Premium tiers" },
        { feature: "Multi-Campus", reach: "✅ Premium tier", competitor: "⚠️ $100+/mo extra" },
        { feature: "Financial Reports", reach: "✅ Growth tier", competitor: "⚠️ Premium only" },
    ];

    // Annual TCO comparison (Updated with new competitive pricing)
    const tcoComparisonData = [
        { name: 'REACH Growth', cost: 1428, savings: 0 },
        { name: 'Tithe.ly + SMS', cost: 2028, savings: 600 },
        { name: 'Planning Center Full', cost: 3228, savings: 1800 },
        { name: 'Pushpay Advanced', cost: 4188, savings: 2760 },
    ];

    // Growth projections
    const growthProjections = [
        { period: 'M3', churches: 50, mrr: 6000, arr: 72000 },
        { period: 'M6', churches: 150, mrr: 18000, arr: 216000 },
        { period: 'M12', churches: 500, mrr: 60000, arr: 720000 },
        { period: 'M18', churches: 1200, mrr: 144000, arr: 1728000 },
        { period: 'M24', churches: 2500, mrr: 300000, arr: 3600000 },
        { period: 'M36', churches: 5000, mrr: 600000, arr: 7200000 },
    ];

    // Market size data
    const marketSizeData = [
        { segment: 'Small (<100)', churches: 228000, penetration: 35, color: '#3b82f6' },
        { segment: 'Medium (100-500)', churches: 95000, penetration: 55, color: '#8b5cf6' },
        { segment: 'Large (500+)', churches: 57000, penetration: 75, color: '#6366f1' },
    ];

    const generatePDFContent = () => {
        const content = `
REACH CHURCHCONNECT
MARKET STRATEGY & COMPETITIVE ANALYSIS
Generated: ${new Date().toLocaleDateString()}

================================================================================
EXECUTIVE SUMMARY
================================================================================

REACH Church Connect is positioned to disrupt the $580M church management software 
market by offering enterprise-grade features at mid-market pricing.

KEY VALUE PROPOSITION:
"Premium church management features at 50% of competitor prices - SMS, video, 
and advanced features included by default."

CURRENT PRICING:
• Starter: $${reachPricing.starter.monthly}/mo ($${reachPricing.starter.annual}/yr) - Up to ${reachPricing.starter.members} members
• Growth:  $${reachPricing.growth.monthly}/mo ($${reachPricing.growth.annual}/yr) - Up to ${reachPricing.growth.members} members  
• Premium: $${reachPricing.premium.monthly}/mo ($${reachPricing.premium.annual}/yr) - ${reachPricing.premium.members} members

================================================================================
MARKET OPPORTUNITY
================================================================================

MARKET SIZE:
• Total US Churches: 380,000+
• Market Size (2024): $580M
• CAGR: 12.5%
• Churches still using spreadsheets: 55%

TARGET SEGMENTS:
• Primary: Small-Medium churches (50-500 members) - 85% of market
• Secondary: Churches switching from expensive competitors

KEY TRENDS:
• Mobile-first giving growing 35% YoY
• SMS engagement 5x higher than email
• Hybrid worship now permanent
• Price sensitivity increasing

================================================================================
COMPETITIVE ANALYSIS
================================================================================

TITHE.LY / BREEZE (Market Share: ~30%)
Pricing: $0-119/mo | Processing: 2.9% + $0.30
Strengths: Free giving, simple pricing, 50,000+ churches
Weaknesses: SMS limited, no video, no MMS, basic kids check-in
Annual Cost: $864-$1,908

PLANNING CENTER (Market Share: ~25%)
Pricing: $100-300/mo typical | Processing: 2.15% + $0.30
Strengths: Industry standard, modular, 90,000+ churches
Weaknesses: Expensive at scale, no SMS/video, complex pricing
Annual Cost: $1,200-$3,600

PUSHPAY / CCB (Market Share: ~15%)
Pricing: $199-399+/mo | Processing: 2.3%+
Strengths: Best giving tools, enterprise features, multi-site
Weaknesses: Very expensive, long contracts, overkill for small churches
Annual Cost: $2,388-$4,788

SUBSPLASH (Market Share: ~8%)
Pricing: $0-399/mo | Processing: 2.3-2.99% + $0.30
Strengths: Best custom apps, media streaming
Weaknesses: Hidden costs, mobile-centric, no video
Annual Cost: $2,388-$4,788

================================================================================
REACH COMPETITIVE ADVANTAGES
================================================================================

1. SMS/MMS INCLUDED
   REACH: 1,000 SMS + 10 MMS/mo in Growth tier
   Competitors: $50-100/mo extra or not available
   SAVINGS: $600-1,200/year

2. VIDEO MEETINGS BUILT-IN
   REACH: 25-200 seats included
   Competitors: Require Zoom/Teams ($150-300/yr)
   SAVINGS: $150-300/year

3. UNIQUE MODULES
   REACH: Coffee Shop POS, Bookstore Management
   Competitors: Not available
   VALUE: Unique differentiator

4. ALL-INCLUSIVE PRICING
   REACH: No hidden fees, predictable costs
   Competitors: Module-based, add-on pricing
   VALUE: Budget certainty

TOTAL COST OF OWNERSHIP (Annual):
• REACH Growth: $1,788/yr (all features included)
• Tithe.ly + Add-ons: $2,028/yr
• Planning Center Full: $3,228/yr
• Pushpay Advanced: $4,188/yr

ANNUAL SAVINGS VS COMPETITORS: $240 - $2,400

================================================================================
GO-TO-MARKET STRATEGY
================================================================================

PHASE 1: LAUNCH (Months 1-6)
• Target: 150 churches
• Focus: Small churches (50-200 members)
• Tactics: Pastor partnerships, 30% first-year discount
• MRR Goal: $18,000

PHASE 2: GROWTH (Months 7-18)
• Target: 1,200 churches
• Focus: Medium churches, competitor switchers
• Tactics: Referral program (20% commission), conferences
• MRR Goal: $144,000

PHASE 3: SCALE (Months 19-36)
• Target: 5,000+ churches
• Focus: Large churches, international expansion
• Tactics: Enterprise features, partner network
• MRR Goal: $600,000
• ARR Goal: $7.2M

================================================================================
FINANCIAL PROJECTIONS
================================================================================

MONTH    CHURCHES    MRR         ARR
M3       50          $6,000      $72,000
M6       150         $18,000     $216,000
M12      500         $60,000     $720,000
M18      1,200       $144,000    $1,728,000
M24      2,500       $300,000    $3,600,000
M36      5,000       $600,000    $7,200,000

UNIT ECONOMICS:
• Average Revenue Per Customer: $120/mo
• Customer Acquisition Cost: $400
• Lifetime Value: $4,800 (40 months avg)
• LTV:CAC Ratio: 12:1
• Monthly Churn Target: <3%

BREAK-EVEN:
• Monthly Operating Costs: $65,000
• Customers Needed: 541
• Expected Break-Even: Month 15

================================================================================
KEY SUCCESS METRICS
================================================================================

• Year 1 Target: 500 churches, $720K ARR
• Year 2 Target: 2,500 churches, $3.6M ARR
• Year 3 Target: 5,000 churches, $7.2M ARR
• Monthly Churn: <3%
• NPS Score: >50
• Feature Adoption: >70%

================================================================================
RECOMMENDED ACTIONS
================================================================================

IMMEDIATE (Next 30 Days):
1. Finalize Starter tier pricing at $65/mo
2. Launch 30-day free trial for all tiers
3. Create 5 video testimonials from beta churches
4. Set up Google Ads for "church software" keywords

SHORT-TERM (60-90 Days):
1. Partner with 10 influential pastors
2. Sponsor 2 regional church conferences
3. Launch referral program
4. Create SEO content strategy

MEDIUM-TERM (6-12 Months):
1. Hire 2 inside sales reps
2. Build integration partnerships
3. Launch mobile app
4. Expand to Canada/UK markets

================================================================================

For questions or investor inquiries:
Email: info@reachconnect.app

© ${new Date().getFullYear()} REACH Church Connect. All rights reserved.
        `;
        return content;
    };

    const handleDownloadPDF = () => {
        setIsGeneratingPDF(true);
        
        // Generate text content
        const content = generatePDFContent();
        
        // Create blob and download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `REACH_Market_Strategy_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setIsGeneratingPDF(false);
    };

    const handleDownloadCSV = () => {
        const csvContent = `Category,Item,Value,Notes
Pricing,Starter Monthly,$${reachPricing.starter.monthly},"Up to ${reachPricing.starter.members} members"
Pricing,Starter Annual,$${reachPricing.starter.annual},"20% savings"
Pricing,Growth Monthly,$${reachPricing.growth.monthly},"Up to ${reachPricing.growth.members} members"
Pricing,Growth Annual,$${reachPricing.growth.annual},"20% savings"
Pricing,Premium Monthly,$${reachPricing.premium.monthly},"${reachPricing.premium.members} members"
Pricing,Premium Annual,$${reachPricing.premium.annual},"20% savings"
Competitor,Tithe.ly All Access,$119/mo,"30% market share"
Competitor,Breeze ChMS,$72/mo,"Owned by Tithe.ly"
Competitor,Planning Center,$100-300/mo,"25% market share"
Competitor,Pushpay Core,$199/mo,"15% market share"
Competitor,Subsplash Standard,$199/mo,"8% market share"
Market,Total Churches,380000,"USA only"
Market,Market Size 2024,$580M,"ChMS software"
Market,CAGR,12.5%,"2024-2029"
Market,Using Spreadsheets,55%,"Target segment"
Projections,Month 6 Churches,150,""
Projections,Month 6 MRR,$18000,""
Projections,Month 12 Churches,500,""
Projections,Month 12 ARR,$720000,""
Projections,Month 24 Churches,2500,""
Projections,Month 24 ARR,$3600000,""
Projections,Month 36 Churches,5000,""
Projections,Month 36 ARR,$7200000,""
`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `REACH_Market_Data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8" ref={reportRef}>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="text-center md:text-left space-y-2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
                            <Target className="w-4 h-4 mr-2 inline" />
                            Strategic Market Analysis - November 2024
                        </Badge>
                        <h1 className="text-4xl font-bold text-slate-900">
                            REACH Church Connect Market Strategy
                        </h1>
                        <p className="text-lg text-slate-600">
                            Competitive Positioning & Growth Plan
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {isGeneratingPDF ? 'Generating...' : 'Download Report'}
                        </Button>
                        <Button 
                            onClick={handleDownloadCSV}
                            variant="outline"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Export Data
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5 max-w-4xl mx-auto">
                        <TabsTrigger value="executive">Executive</TabsTrigger>
                        <TabsTrigger value="market">Market</TabsTrigger>
                        <TabsTrigger value="competitors">Competitors</TabsTrigger>
                        <TabsTrigger value="positioning">Positioning</TabsTrigger>
                        <TabsTrigger value="projections">Projections</TabsTrigger>
                    </TabsList>

                    {/* EXECUTIVE SUMMARY */}
                    <TabsContent value="executive" className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid md:grid-cols-4 gap-4">
                            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                                <CardContent className="p-6 text-center">
                                    <DollarSign className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                                    <h3 className="text-3xl font-bold text-slate-900">$580M</h3>
                                    <p className="text-sm text-slate-600">Market Size 2024</p>
                                </CardContent>
                            </Card>
                            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                                <CardContent className="p-6 text-center">
                                    <Users className="w-10 h-10 mx-auto mb-3 text-purple-600" />
                                    <h3 className="text-3xl font-bold text-slate-900">380K+</h3>
                                    <p className="text-sm text-slate-600">US Churches</p>
                                </CardContent>
                            </Card>
                            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                                <CardContent className="p-6 text-center">
                                    <TrendingUp className="w-10 h-10 mx-auto mb-3 text-green-600" />
                                    <h3 className="text-3xl font-bold text-slate-900">12.5%</h3>
                                    <p className="text-sm text-slate-600">Annual Growth</p>
                                </CardContent>
                            </Card>
                            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                                <CardContent className="p-6 text-center">
                                    <Target className="w-10 h-10 mx-auto mb-3 text-orange-600" />
                                    <h3 className="text-3xl font-bold text-slate-900">55%</h3>
                                    <p className="text-sm text-slate-600">Still Use Spreadsheets</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Value Proposition */}
                        <Card className="border-2 border-blue-300 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Zap className="w-6 h-6" />
                                    Core Value Proposition
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-xl text-slate-800 leading-relaxed mb-6">
                                    <strong>"Enterprise features at SMB pricing"</strong> — REACH delivers Planning Center quality 
                                    at Breeze pricing, with SMS, video, and advanced features included by default.
                                </p>
                                
                                {/* Current Pricing Display */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                        <div className="text-sm text-slate-600 mb-1">Starter</div>
                                        <div className="text-3xl font-bold text-slate-900">${reachPricing.starter.monthly}<span className="text-lg text-slate-500">/mo</span></div>
                                        <div className="text-xs text-slate-500">Up to {reachPricing.starter.members} members</div>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-400 text-center">
                                        <Badge className="mb-2 bg-blue-600">Best Value</Badge>
                                        <div className="text-sm text-blue-700 mb-1">Growth</div>
                                        <div className="text-3xl font-bold text-blue-900">${reachPricing.growth.monthly}<span className="text-lg text-blue-500">/mo</span></div>
                                        <div className="text-xs text-blue-600">Up to {reachPricing.growth.members} members</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                        <div className="text-sm text-slate-600 mb-1">Premium</div>
                                        <div className="text-3xl font-bold text-slate-900">${reachPricing.premium.monthly}<span className="text-lg text-slate-500">/mo</span></div>
                                        <div className="text-xs text-slate-500">{reachPricing.premium.members} members</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Key Differentiators */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-2 border-green-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-green-800">
                                        <CheckCircle className="w-5 h-5" />
                                        What We Include (Others Charge Extra)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                        <span className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-green-600" />
                                            SMS Messaging (1,000/mo)
                                        </span>
                                        <Badge className="bg-green-100 text-green-800">Save $50/mo</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                        <span className="flex items-center gap-2">
                                            <Video className="w-4 h-4 text-green-600" />
                                            Video Meetings (25 seats)
                                        </span>
                                        <Badge className="bg-green-100 text-green-800">Save $15/mo</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                        <span className="flex items-center gap-2">
                                            <Baby className="w-4 h-4 text-green-600" />
                                            Kids Check-In System
                                        </span>
                                        <Badge className="bg-green-100 text-green-800">Save $19/mo</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                        <span className="flex items-center gap-2">
                                            <Coffee className="w-4 h-4 text-green-600" />
                                            Coffee Shop & Bookstore POS
                                        </span>
                                        <Badge className="bg-blue-100 text-blue-800">UNIQUE</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-blue-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-800">
                                        <Award className="w-5 h-5" />
                                        Annual Savings vs Competitors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {tcoComparisonData.map((item, idx) => (
                                            <div key={item.name} className={`p-3 rounded-lg ${idx === 0 ? 'bg-blue-100 border-2 border-blue-300' : 'bg-slate-50'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className={idx === 0 ? 'font-bold text-blue-900' : 'text-slate-700'}>{item.name}</span>
                                                    <div className="text-right">
                                                        <span className={`font-bold ${idx === 0 ? 'text-blue-600' : 'text-slate-900'}`}>${item.cost.toLocaleString()}/yr</span>
                                                        {item.savings > 0 && (
                                                            <div className="text-xs text-green-600">You save ${item.savings.toLocaleString()}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* MARKET TAB */}
                    <TabsContent value="market" className="space-y-6">
                        <Card className="shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-6 h-6 text-blue-600" />
                                    Market Opportunity Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Market Segments */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-4">Church Market Segments</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={marketSizeData}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        dataKey="churches"
                                                        label={({ segment, churches }) => `${segment}: ${(churches/1000).toFixed(0)}K`}
                                                    >
                                                        {marketSizeData.map((entry, index) => (
                                                            <Cell key={index} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => `${(value/1000).toFixed(0)}K churches`} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-4">ChMS Penetration by Segment</h3>
                                        <div className="space-y-4">
                                            {marketSizeData.map((seg) => (
                                                <div key={seg.segment}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>{seg.segment}</span>
                                                        <span className="font-semibold">{seg.penetration}% using ChMS</span>
                                                    </div>
                                                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full" 
                                                            style={{ width: `${seg.penetration}%`, backgroundColor: seg.color }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {((seg.churches * (100 - seg.penetration)) / 100 / 1000).toFixed(0)}K churches without ChMS
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Market Trends */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <h4 className="font-bold text-blue-900 mb-3">📈 Growth Drivers</h4>
                                        <ul className="space-y-2 text-sm text-blue-800">
                                            <li>• Mobile-first giving growing 35% YoY</li>
                                            <li>• SMS engagement 5x higher than email open rates</li>
                                            <li>• Hybrid worship now permanent post-COVID</li>
                                            <li>• Younger pastors expect modern technology</li>
                                            <li>• Integration with accounting software demand up 45%</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                                        <h4 className="font-bold text-orange-900 mb-3">⚠️ Market Challenges</h4>
                                        <ul className="space-y-2 text-sm text-orange-800">
                                            <li>• Economic uncertainty affecting church budgets</li>
                                            <li>• High switching costs create inertia</li>
                                            <li>• Market consolidation (Tithe.ly + Breeze)</li>
                                            <li>• Feature parity among top competitors</li>
                                            <li>• Long sales cycles (3-6 months typical)</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* COMPETITORS TAB */}
                    <TabsContent value="competitors" className="space-y-6">
                        <Card className="shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-red-600" />
                                    Competitive Landscape (Current Pricing Nov 2024)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {competitors.map((comp) => (
                                    <div key={comp.name} className="border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all">
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">{comp.name}</h3>
                                                <Badge variant="outline" className="mt-1">{comp.marketShare} market share</Badge>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-slate-600">Processing: {comp.processingFees}</div>
                                                <div className="text-sm font-semibold text-slate-900">
                                                    Annual: ${comp.annualCost.basic.toLocaleString()} - ${comp.annualCost.full.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <div className="text-xs font-semibold text-slate-700 mb-2">Pricing</div>
                                                {Object.entries(comp.pricing).map(([k, v]) => (
                                                    <div key={k} className="text-xs"><span className="capitalize">{k}:</span> {v}</div>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <div className="text-xs font-semibold text-green-700 mb-2">Strengths</div>
                                                {comp.strengths.map((s, i) => (
                                                    <div key={i} className="text-xs flex items-start gap-1">
                                                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />{s}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-3 bg-red-50 rounded-lg">
                                                <div className="text-xs font-semibold text-red-700 mb-2">Weaknesses (Our Opportunity)</div>
                                                {comp.weaknesses.map((w, i) => (
                                                    <div key={i} className="text-xs flex items-start gap-1">
                                                        <XCircle className="w-3 h-3 text-red-500 mt-0.5" />{w}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Price Comparison Chart */}
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>Monthly Price Comparison</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={pricingComparisonData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                                            <YAxis dataKey="name" type="category" width={140} fontSize={11} />
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
                    </TabsContent>

                    {/* POSITIONING TAB */}
                    <TabsContent value="positioning" className="space-y-6">
                        <Card className="shadow-2xl border-2 border-blue-400">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Crown className="w-8 h-8" />
                                    Strategic Positioning
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Target Market */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                                        <h3 className="font-bold text-blue-900 mb-3">🎯 Primary Target</h3>
                                        <p className="text-blue-800 mb-3">Small-Medium churches (50-500 members) currently using spreadsheets or basic tools</p>
                                        <ul className="text-sm text-blue-700 space-y-1">
                                            <li>• 209,000 churches in this segment</li>
                                            <li>• 45% still without ChMS</li>
                                            <li>• Price-sensitive but growing</li>
                                        </ul>
                                    </div>
                                    <div className="p-5 bg-purple-50 rounded-xl border border-purple-200">
                                        <h3 className="font-bold text-purple-900 mb-3">🔄 Secondary Target</h3>
                                        <p className="text-purple-800 mb-3">Churches frustrated with expensive competitors seeking better value</p>
                                        <ul className="text-sm text-purple-700 space-y-1">
                                            <li>• 40% switch ChMS within 3 years</li>
                                            <li>• Cost is #1 reason for switching</li>
                                            <li>• Looking for "all-in-one" solutions</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Feature Matrix */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-4">Feature Comparison: REACH vs Market</h3>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Feature</TableHead>
                                                    <TableHead className="bg-blue-50 text-blue-900 font-bold">REACH Church Connect</TableHead>
                                                    <TableHead>Typical Competitor</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {featureMatrix.map((row, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-medium">{row.feature}</TableCell>
                                                        <TableCell className="bg-blue-50 font-semibold">{row.reach}</TableCell>
                                                        <TableCell>{row.competitor}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Win Strategy */}
                                <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
                                    <h3 className="font-bold text-green-900 mb-4 text-xl">🏆 How We Win</h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-white rounded-lg">
                                            <div className="text-3xl mb-2">💰</div>
                                            <h4 className="font-bold text-slate-900">Price Leadership</h4>
                                            <p className="text-sm text-slate-600">50-60% lower than Planning Center/Pushpay with more features included</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-lg">
                                            <div className="text-3xl mb-2">📦</div>
                                            <h4 className="font-bold text-slate-900">All-Inclusive</h4>
                                            <p className="text-sm text-slate-600">No surprise add-ons. SMS, video, kids check-in included in Growth tier</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-lg">
                                            <div className="text-3xl mb-2">🚀</div>
                                            <h4 className="font-bold text-slate-900">Unique Features</h4>
                                            <p className="text-sm text-slate-600">Coffee Shop POS, Bookstore, MMS campaigns - no competitor offers these</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PROJECTIONS TAB */}
                    <TabsContent value="projections" className="space-y-6">
                        <Card className="shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                    36-Month Growth Projections
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Growth Chart */}
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={growthProjections}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis yAxisId="left" tickFormatter={(v) => v.toLocaleString()} />
                                            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                                            <Tooltip formatter={(value, name) => [
                                                name === 'churches' ? value.toLocaleString() : `$${value.toLocaleString()}`,
                                                name === 'churches' ? 'Churches' : name === 'mrr' ? 'MRR' : 'ARR'
                                            ]} />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="churches" stroke="#3b82f6" strokeWidth={3} name="Churches" />
                                            <Line yAxisId="right" type="monotone" dataKey="arr" stroke="#10b981" strokeWidth={3} name="ARR" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Projection Table */}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-100">
                                                <TableHead>Period</TableHead>
                                                <TableHead className="text-right">Churches</TableHead>
                                                <TableHead className="text-right">MRR</TableHead>
                                                <TableHead className="text-right">ARR</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {growthProjections.map((row) => (
                                                <TableRow key={row.period}>
                                                    <TableCell className="font-medium">{row.period}</TableCell>
                                                    <TableCell className="text-right">{row.churches.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">${row.mrr.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right font-semibold">${row.arr.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Unit Economics */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Card className="border-2 border-blue-200">
                                        <CardContent className="p-4 text-center">
                                            <div className="text-3xl font-bold text-blue-600">$120</div>
                                            <div className="text-sm text-slate-600">Avg Revenue/Church/Mo</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-2 border-green-200">
                                        <CardContent className="p-4 text-center">
                                            <div className="text-3xl font-bold text-green-600">12:1</div>
                                            <div className="text-sm text-slate-600">LTV:CAC Ratio</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-2 border-purple-200">
                                        <CardContent className="p-4 text-center">
                                            <div className="text-3xl font-bold text-purple-600">&lt;3%</div>
                                            <div className="text-sm text-slate-600">Monthly Churn Target</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Go-to-Market Timeline */}
                                <div className="p-5 bg-slate-50 rounded-xl">
                                    <h3 className="font-bold text-slate-900 mb-4">🗓️ Go-to-Market Timeline</h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-green-100 rounded-lg border-l-4 border-green-500">
                                            <h4 className="font-bold text-green-900">Phase 1: Launch</h4>
                                            <div className="text-sm text-green-700">Months 1-6</div>
                                            <ul className="text-xs text-green-800 mt-2 space-y-1">
                                                <li>• 150 churches target</li>
                                                <li>• Pastor partnerships</li>
                                                <li>• 30% first-year discount</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-blue-100 rounded-lg border-l-4 border-blue-500">
                                            <h4 className="font-bold text-blue-900">Phase 2: Growth</h4>
                                            <div className="text-sm text-blue-700">Months 7-18</div>
                                            <ul className="text-xs text-blue-800 mt-2 space-y-1">
                                                <li>• 1,200 churches target</li>
                                                <li>• Referral program launch</li>
                                                <li>• Conference sponsorships</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-purple-100 rounded-lg border-l-4 border-purple-500">
                                            <h4 className="font-bold text-purple-900">Phase 3: Scale</h4>
                                            <div className="text-sm text-purple-700">Months 19-36</div>
                                            <ul className="text-xs text-purple-800 mt-2 space-y-1">
                                                <li>• 5,000+ churches target</li>
                                                <li>• International expansion</li>
                                                <li>• $7.2M ARR goal</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Download CTA */}
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Download Complete Analysis</h2>
                                <p className="text-blue-100">Get the full market strategy report with all data and projections</p>
                            </div>
                            <div className="flex gap-3">
                                <Button 
                                    size="lg" 
                                    onClick={handleDownloadPDF}
                                    className="bg-white text-blue-600 hover:bg-blue-50"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Download Report
                                </Button>
                                <Button 
                                    size="lg" 
                                    variant="outline"
                                    onClick={handleDownloadCSV}
                                    className="border-white text-white hover:bg-white/10"
                                >
                                    <FileText className="w-5 h-5 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}