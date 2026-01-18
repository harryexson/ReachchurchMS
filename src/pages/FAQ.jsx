import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import SEO from "../components/shared/SEO";
import { ChevronDown, ChevronUp, HelpCircle, ArrowRight } from "lucide-react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is church management software?",
      answer: "Church management software (ChMS) is a digital platform that helps churches organize and streamline their ministry operations. It replaces spreadsheets, paper records, and disconnected tools with one unified system for managing members, volunteers, giving, events, and communication. Think of it as a CRM specifically designed for churches—helping you track attendance, coordinate volunteers, accept donations, send messages, and report on engagement—all from one central dashboard."
    },
    {
      question: "How does REACH Church Management Software help churches?",
      answer: "REACH helps churches in three main ways: (1) Save Time: Automate repetitive tasks like visitor follow-ups, donation receipts, and volunteer reminders. (2) Increase Giving: Offer modern donation options including text-to-give, mobile giving, QR codes, and kiosk stations. (3) Improve Engagement: Track member involvement, identify at-risk members, and communicate effectively through SMS, email, and push notifications. Everything is accessible via web and mobile apps, so your team can manage ministry operations from anywhere."
    },
    {
      question: "Is REACH CMS suitable for small churches?",
      answer: "Absolutely! REACH is designed for small and growing churches. Our Starter plan supports up to 150 members for just $49/month, making it affordable for smaller congregations. The platform is intentionally simple and easy to use—no technical knowledge required. Many small churches choose REACH because it replaces 3-5 separate tools (giving platform, SMS service, event software, etc.) with one affordable subscription. You get enterprise-level features at a price point that makes sense for small ministry budgets."
    },
    {
      question: "Does REACH CMS support text-to-give and mobile giving?",
      answer: "Yes! REACH offers 6 ways to give, including text-to-give (donors text a keyword to donate instantly), mobile app giving, online portal, QR codes, kiosk stations, and check scanning. Text-to-give is included in Growth and Premium plans. You'll also get automated donation receipts, year-end tax statements, and detailed giving reports. All transactions are processed securely through Stripe with standard 2.9% + 30¢ fees—no hidden charges from REACH."
    },
    {
      question: "Can we manage volunteers and events in the same system?",
      answer: "Yes, absolutely. REACH is an all-in-one platform, so you can manage volunteers and events seamlessly together. Create events, add volunteer roles, allow sign-ups, send automated reminders, track attendance with QR check-ins, and collect feedback—all within the same system. You'll never have to switch between multiple tools or export/import spreadsheets. Everything is connected, so volunteer hours, event attendance, and member engagement are all tracked in one place."
    },
    {
      question: "Is there a mobile app for church leaders and members?",
      answer: "Yes! REACH includes both admin and member mobile apps. The admin app (Progressive Web App - PWA) lets church leaders manage operations on the go: check-in attendees, view giving reports, send messages, and coordinate volunteers—all from your phone. The member app allows your congregation to give, RSVP to events, view announcements, access sermons, and stay connected. The PWA installs directly to the home screen (no App Store needed) and works on both iOS and Android."
    },
    {
      question: "How secure is church data and giving information?",
      answer: "Security is our top priority. All data is encrypted in transit and at rest. Donations are processed through Stripe, a PCI-DSS Level 1 certified payment processor trusted by millions of businesses worldwide. We never store full credit card numbers. Member data, financial records, and giving history are protected with bank-level security. You control user permissions through role-based access, so only authorized staff can view sensitive information. We also perform regular security audits and backups to ensure your church data is safe."
    },
    {
      question: "Can REACH CMS replace multiple church tools?",
      answer: "Yes, that's exactly what we're designed to do. Most churches use 3-7 separate tools: a giving platform (like Pushpay or Tithe.ly), an SMS service (like Twilio), event software, volunteer scheduling, a member database, and more. REACH consolidates all of these into one platform, saving you $110-349/month compared to competitors. You'll have one login, one database, one bill, and one support team—making church management dramatically simpler."
    },
    {
      question: "How easy is it to get started?",
      answer: "Very easy! Most churches are up and running in 10-15 minutes. Here's how it works: (1) Sign up for a 14-day free trial (no credit card required). (2) Follow our simple onboarding wizard to set up your church profile. (3) Import your members via CSV or add them manually. (4) Connect Stripe to accept donations (takes 5 minutes). (5) Start using features like event creation, volunteer sign-ups, and messaging immediately. We also offer migration assistance if you're switching from another platform, and our support team is available to help via email and chat."
    },
    {
      question: "Do members need technical knowledge to use the app?",
      answer: "Not at all. REACH is designed to be simple enough for anyone to use—even members who aren't tech-savvy. The member app has a clean, intuitive interface similar to social media apps they already know. They can give with just a few taps, RSVP to events with one click, and view announcements without any training. Most members find it easier than logging into their email. And if someone needs help, we provide quick video tutorials and in-app guidance."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "You always own your data. If you decide to cancel, you can export all your member records, giving history, attendance reports, and other data in CSV format before your subscription ends. We provide a 30-day grace period after cancellation, so you have plenty of time to download everything. We'll never hold your data hostage or charge fees to access it. Our goal is to serve your church well, and that includes a smooth exit process if you ever need it."
    },
    {
      question: "Can REACH handle multiple campuses or locations?",
      answer: "Yes! Our Premium plan includes multi-campus support. You can manage multiple locations from one central dashboard while maintaining separate attendance, giving, and event tracking for each campus. Each location can have its own staff with custom permissions, and you can generate consolidated reports across all campuses or view them individually. This is perfect for churches with satellite locations, church plants, or regional ministries."
    },
    {
      question: "Do you offer training and customer support?",
      answer: "Absolutely. We offer multiple support channels: (1) Email and chat support for all users. (2) Help Center with articles, video tutorials, and step-by-step guides. (3) Onboarding assistance for new churches. (4) Phone support for Premium plan customers. (5) Migration help if you're switching from another platform. Our team is genuinely invested in your church's success, and we respond quickly to support requests—typically within a few hours."
    },
    {
      question: "Can we customize features for our church's unique needs?",
      answer: "Yes! REACH includes custom fields for member profiles, allowing you to track ministry-specific information like spiritual gifts, serving preferences, or small group participation. You can also create custom member groups and tags for targeted communication. While we don't offer full white-label customization on lower-tier plans, Premium customers can access API integrations and advanced permissions to tailor the platform to their specific workflows."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <SEO 
        title="Church Management Software FAQ | REACH CMS Questions Answered"
        description="Get answers to common questions about REACH Church Management Software. Learn about features, pricing, security, mobile apps, text-to-give, and how to get started."
        keywords="church management software FAQ, church software questions, ChMS help, text to give FAQ, church CRM questions"
        url="/faq"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section */}
        <section className="py-20 bg-white border-b">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <HelpCircle className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to know about REACH Church Management Software. 
              Can't find your answer? <a href="mailto:support@reachchurchMS.com" className="text-blue-600 hover:text-blue-700 underline">Contact our team</a>.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-slate-900 pr-4">
                        {faq.question}
                      </h3>
                      {openIndex === index ? (
                        <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
                      )}
                    </button>
                    {openIndex === index && (
                      <div className="px-6 pb-6">
                        <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Still Have Questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our team is here to help. Schedule a demo or start your free trial today.
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
          </div>
        </section>
      </div>
    </>
  );
}