import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import SEO from "../components/shared/SEO";
import { CheckCircle, X, ArrowRight, Zap, DollarSign, Smartphone, Heart } from "lucide-react";

export default function WhyReachPage() {
  const problems = [
    {
      icon: "📊",
      title: "Too Many Disconnected Tools",
      description: "Juggling separate platforms for giving, events, volunteers, and communication wastes time and creates data silos."
    },
    {
      icon: "📝",
      title: "Manual Spreadsheets & Paper Tracking",
      description: "Outdated attendance sheets, paper visitor cards, and Excel spreadsheets lead to errors and lost information."
    },
    {
      icon: "📢",
      title: "Poor Communication with Members",
      description: "Email-only communication results in low engagement. Members miss important updates and events."
    },
    {
      icon: "💰",
      title: "Complicated or Outdated Giving Systems",
      description: "Checks and cash only? No mobile giving? You're missing out on donations from younger generations."
    },
    {
      icon: "📉",
      title: "Difficulty Tracking Engagement & Attendance",
      description: "Without clear data, you can't identify at-risk members or measure ministry effectiveness."
    }
  ];

  const comparison = [
    {
      feature: "SMS Messaging (1,000/mo)",
      reach: true,
      planningCenter: "$100/mo extra",
      tithely: "$75/mo extra",
      subsplash: "$99/mo extra"
    },
    {
      feature: "Video Meetings (up to 200)",
      reach: true,
      planningCenter: "Not available",
      tithely: "Not available",
      subsplash: "$200/mo extra"
    },
    {
      feature: "Kids Check-In System",
      reach: true,
      planningCenter: true,
      tithely: "$50/mo extra",
      subsplash: true
    },
    {
      feature: "PWA Mobile App",
      reach: true,
      planningCenter: "Not available",
      tithely: "$100/mo extra",
      subsplash: "$149/mo extra"
    },
    {
      feature: "Coffee Shop POS & Inventory",
      reach: true,
      planningCenter: false,
      tithely: false,
      subsplash: false
    },
    {
      feature: "Engagement Scoring & At-Risk Alerts",
      reach: true,
      planningCenter: "Limited",
      tithely: "Not available",
      subsplash: "Not available"
    },
    {
      feature: "Text-to-Give",
      reach: true,
      planningCenter: "$100/mo extra",
      tithely: true,
      subsplash: true
    },
    {
      feature: "Monthly Cost (Growth Plan)",
      reach: "$119",
      planningCenter: "$229+",
      tithely: "$244+",
      subsplash: "$468+"
    }
  ];

  const differentiators = [
    {
      icon: Zap,
      title: "Simplicity & Ease of Use",
      description: "REACH is designed for non-technical church staff. No complicated setup, no training required. If you can use email, you can use REACH."
    },
    {
      icon: DollarSign,
      title: "All-in-One, One Price",
      description: "Stop paying for multiple subscriptions. REACH replaces 3-5 tools with one affordable platform—saving you $110-349/month."
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Manage your church from anywhere with native mobile apps for leaders and members. PWA technology means no App Store required."
    },
    {
      icon: Heart,
      title: "Built for Small & Growing Churches",
      description: "We're not enterprise software pretending to work for small churches. REACH is purpose-built for congregations of 50-1,500 members."
    }
  ];

  return (
    <>
      <SEO 
        title="Why Choose REACH Church Management Software | Compare ChMS Platforms"
        description="See why REACH is the best church management software for small and growing churches. Compare features, pricing, and benefits vs Planning Center, Tithe.ly, and Subsplash."
        keywords="why choose REACH CMS, church management software comparison, best church software for small churches, ChMS comparison"
        url="/why-reach"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <Badge className="bg-white text-blue-600 px-4 py-2 mb-6 text-sm font-semibold">
              Why REACH Church Connect
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              The Church Management Platform Built for Your Ministry
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Simpler, more affordable, and more powerful than other church management systems. 
              See why hundreds of churches are switching to REACH.
            </p>
          </div>
        </section>

        {/* Problems We Solve */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Common Church Management Problems We Solve
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Does your church struggle with any of these issues?
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {problems.map((problem, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{problem.icon}</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{problem.title}</h3>
                    <p className="text-sm text-slate-600">{problem.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-2xl font-bold text-slate-900 mb-6">
                REACH Church Connect is the unified solution.
              </p>
              <Link to={createPageUrl('SubscriptionPlans')}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-10 py-6 text-lg">
                  Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                How REACH Compares to Other Church Management Systems
              </h2>
              <p className="text-xl text-slate-600">
                Features others charge extra for—we include by default.
              </p>
            </div>

            <Card className="border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700">Feature</th>
                        <th className="text-center py-4 px-4 font-bold text-blue-600">REACH</th>
                        <th className="text-center py-4 px-4 text-slate-600">Planning Center</th>
                        <th className="text-center py-4 px-4 text-slate-600">Tithe.ly</th>
                        <th className="text-center py-4 px-4 text-slate-600">Subsplash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="py-4 px-6 font-medium text-slate-900">{row.feature}</td>
                          <td className="text-center py-4 px-4">
                            {row.reach === true ? (
                              <CheckCircle className="w-6 h-6 text-green-600 inline" />
                            ) : typeof row.reach === 'string' ? (
                              <span className="font-bold text-blue-600">{row.reach}</span>
                            ) : (
                              <X className="w-6 h-6 text-red-400 inline" />
                            )}
                          </td>
                          <td className="text-center py-4 px-4 text-sm">
                            {row.planningCenter === true ? (
                              <CheckCircle className="w-5 h-5 text-green-600 inline" />
                            ) : row.planningCenter === false ? (
                              <X className="w-5 h-5 text-red-400 inline" />
                            ) : (
                              <span className="text-slate-500">{row.planningCenter}</span>
                            )}
                          </td>
                          <td className="text-center py-4 px-4 text-sm">
                            {row.tithely === true ? (
                              <CheckCircle className="w-5 h-5 text-green-600 inline" />
                            ) : row.tithely === false ? (
                              <X className="w-5 h-5 text-red-400 inline" />
                            ) : (
                              <span className="text-slate-500">{row.tithely}</span>
                            )}
                          </td>
                          <td className="text-center py-4 px-4 text-sm">
                            {row.subsplash === true ? (
                              <CheckCircle className="w-5 h-5 text-green-600 inline" />
                            ) : row.subsplash === false ? (
                              <X className="w-5 h-5 text-red-400 inline" />
                            ) : (
                              <span className="text-slate-500">{row.subsplash}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-lg font-semibold text-slate-900">
                💰 Save $110-349/month with REACH compared to competitors with ALL features included.
              </p>
            </div>
          </div>
        </section>

        {/* Differentiators */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                What Makes REACH Different
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {differentiators.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                          <p className="text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Experience the REACH Difference?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of churches managing smarter with REACH Church Connect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('SubscriptionPlans')}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 px-10 py-6 text-lg font-semibold">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/10 px-10 py-6 text-lg font-semibold"
                onClick={() => window.location.href = 'mailto:support@reachchurchMS.com?subject=Schedule a Demo'}
              >
                Schedule Demo
              </Button>
            </div>
            <p className="text-sm text-blue-200 mt-4">
              14 days free • No credit card required • Setup in 10 minutes
            </p>
          </div>
        </section>
      </div>
    </>
  );
}