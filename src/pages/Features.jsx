import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import SEO from "../components/shared/SEO";
import {
  Users,
  Heart,
  Calendar,
  UserPlus,
  MessageSquare,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Video,
  Baby,
  Coffee,
  Shield
} from "lucide-react";

export default function FeaturesPage() {
  const coreFeatures = [
    {
      icon: Users,
      title: "Church Member Management (CRM)",
      description: "Complete member directory with families, engagement tracking, lifecycle stages, and custom fields. Know who's at risk and follow up automatically.",
      benefits: [
        "Centralized member profiles with photos and family details",
        "Attendance tracking across all services and events",
        "Engagement scoring and at-risk member alerts",
        "Custom fields for ministry-specific data",
        "Member groups and segmentation"
      ],
      forWho: "Perfect for churches of any size looking to replace spreadsheets and disconnected databases.",
      link: createPageUrl("FeatureMemberManagement")
    },
    {
      icon: Heart,
      title: "Church Giving & Text-to-Give Platform",
      description: "Accept donations 6 ways: kiosk stations, text-to-give, online portal, mobile app, QR codes, and check scanning. Automated receipts and year-end statements included.",
      benefits: [
        "Text-to-Give: Donors text a keyword to give instantly",
        "Mobile & online giving with saved payment methods",
        "Kiosk giving stations for in-person donations",
        "QR code giving for bulletins and displays",
        "Check scanning for fast deposit processing",
        "Automated donation receipts and tax statements"
      ],
      forWho: "Ideal for churches wanting to increase giving and offer modern donation options.",
      link: createPageUrl("FeatureGiving")
    },
    {
      icon: Calendar,
      title: "Church Event Management Software",
      description: "Create events with QR check-ins, online registration, volunteer sign-ups, and automated reminders. Track attendance and collect feedback seamlessly.",
      benefits: [
        "Event creation with registration forms",
        "QR code tickets for contactless check-in",
        "Volunteer role assignments and scheduling",
        "Automated event reminders via SMS and email",
        "Attendance tracking and reporting",
        "Post-event feedback collection"
      ],
      forWho: "Essential for churches running multiple programs, small groups, and special events.",
      link: createPageUrl("FeatureEvents")
    },
    {
      icon: UserPlus,
      title: "Church Volunteer Management System",
      description: "Recruit, schedule, and coordinate volunteers with ease. Track hours, send reminders, and manage roles across all ministries from one dashboard.",
      benefits: [
        "Volunteer opportunity posting and sign-ups",
        "Shift scheduling and role assignments",
        "Automated volunteer reminders and confirmations",
        "Hours tracking and reporting",
        "Background check management",
        "Volunteer appreciation tracking"
      ],
      forWho: "Perfect for churches with worship teams, kids ministry, outreach programs, and hospitality.",
      link: createPageUrl("FeatureVolunteers")
    },
    {
      icon: MessageSquare,
      title: "Church Communication & Messaging Tools",
      description: "Send SMS, email, and push notifications to your entire church or targeted groups. 1,000 SMS and 10 MMS included monthly. Automate visitor follow-up sequences.",
      benefits: [
        "Bulk SMS, email, and push notifications",
        "Targeted messaging by groups, roles, or tags",
        "1,000 SMS + 10 MMS per month included",
        "Text keywords for automated responses",
        "7-step automated visitor follow-up",
        "Giving thank-you automation"
      ],
      forWho: "Great for churches wanting better member engagement and first-time visitor retention.",
      link: createPageUrl("FeatureCommunication")
    },
    {
      icon: BarChart3,
      title: "Church Attendance & Reporting",
      description: "Track attendance across services, events, and small groups. Generate reports on giving trends, member engagement, and volunteer hours.",
      benefits: [
        "Service and event attendance tracking",
        "Giving reports by date, category, and donor",
        "Member engagement dashboards",
        "Volunteer hours and participation reports",
        "Exportable reports for finance teams",
        "Predictive analytics for donor retention"
      ],
      forWho: "Useful for leadership teams making data-driven ministry decisions.",
      link: createPageUrl("FeatureReporting")
    }
  ];

  const uniqueFeatures = [
    {
      icon: Smartphone,
      title: "Progressive Web App (PWA)",
      description: "Install-to-home-screen app for iOS and Android—no App Store needed. Push notifications, offline mode, and mobile navigation."
    },
    {
      icon: Coffee,
      title: "Coffee Shop & Bookstore POS",
      description: "Full point-of-sale system with inventory management, stock alerts, loyalty programs. Unique to REACH!"
    },
    {
      icon: Video,
      title: "Built-In Video Meetings",
      description: "HD video conferencing for 25-200 participants with breakout rooms and recording. No Zoom subscription needed."
    },
    {
      icon: Baby,
      title: "Kids Check-In System",
      description: "Secure check-in/out with label printing, parent SMS alerts, and allergy tracking for children's ministry."
    }
  ];

  return (
    <>
      <SEO 
        title="Church Management Software Features | Member, Giving, Events & More"
        description="Explore REACH Church Management features: member CRM, text-to-give, event management, volunteer coordination, communication tools, and reporting—all in one platform."
        keywords="church management software features, church CRM, text to give for churches, church event management, church volunteer management, church communication tools"
        url="/features"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <Badge className="bg-white text-blue-600 px-4 py-2 mb-6 text-sm font-semibold">
              Complete Feature Set
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Everything Your Church Needs in One Platform
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Replace multiple disconnected tools with one powerful church management system. 
              Manage members, giving, volunteers, events, and communication seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('SubscriptionPlans')}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 px-10 py-6 text-lg font-semibold">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-10 py-6 text-lg font-semibold">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Core Church Management Features
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to run your church efficiently—no technical expertise required.
              </p>
            </div>

            <div className="space-y-12">
              {coreFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all">
                    <CardContent className="p-8">
                      <div className="grid lg:grid-cols-2 gap-8 items-start">
                        <div>
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                              <p className="text-slate-600">{feature.description}</p>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-blue-900 mb-1">👥 Who It's For:</p>
                            <p className="text-sm text-blue-800">{feature.forWho}</p>
                          </div>

                          <Link to={feature.link}>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              Learn More <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3">Key Benefits:</h4>
                          <ul className="space-y-3">
                            {feature.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-700">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Unique Features */}
        <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <Badge className="bg-amber-600 text-white px-4 py-2 mb-4">
                <Shield className="w-4 h-4 inline mr-2" />
                REACH Exclusives
              </Badge>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Features You Won't Find Elsewhere
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Unique capabilities that set REACH apart from other church management systems.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {uniqueFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="border-2 border-amber-300 bg-white">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Simplify Your Ministry Operations?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of churches managing smarter with REACH Church Connect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('SubscriptionPlans')}>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 px-10 py-6 text-lg font-semibold">
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-200 mt-4">
              No credit card required • Setup in 10 minutes • Cancel anytime
            </p>
          </div>
        </section>
      </div>
    </>
  );
}