
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";

export default function PricingTable() {
    const plans = [
        {
            name: "Essential",
            price: "$69",
            period: "/month",
            description: "Perfect for small churches (up to 100 members)",
            features: [
                { name: "Up to 100 members", included: true },
                { name: "Event management & registration", included: true },
                { name: "Basic giving tracking", included: true },
                { name: "Volunteer coordination", included: true },
                { name: "Email communications", included: true },
                { name: "Basic reports", included: true },
                { name: "Email support", included: true },
                { name: "SMS Keywords", included: false, note: "Growth+ only" },
                { name: "Multimedia Campaigns", included: false, note: "Growth+ only" },
                { name: "Video Meetings", included: false, note: "Growth+ only" },
                { name: "API access", included: false },
                { name: "Phone support", included: false }
            ]
        },
        {
            name: "Growth",
            price: "$149",
            period: "/month",
            description: "Most popular for growing churches (up to 500 members)",
            popular: true,
            features: [
                { name: "Up to 500 members", included: true },
                { name: "Advanced event management", included: true },
                { name: "Complete giving platform", included: true },
                { name: "Volunteer management", included: true },
                { name: "Communications hub", included: true },
                { name: "Member portal", included: true },
                { name: "Sermon library", included: true },
                { name: "Email & chat support", included: true },
                { name: "SMS Keywords (1,000 msgs/month)", included: true, premium: true },
                { name: "Multimedia Campaigns (10/month)", included: true, premium: true },
                { name: "Video Meetings (25 participants)", included: true, premium: true },
                { name: "Custom branding", included: true },
                { name: "API access", included: false },
                { name: "Phone support", included: false }
            ]
        },
        {
            name: "Premium",
            price: "$299",
            period: "/month",
            description: "Enterprise solution for large churches (unlimited members)",
            features: [
                { name: "Unlimited members", included: true },
                { name: "Multi-campus support", included: true },
                { name: "Advanced giving & campaigns", included: true },
                { name: "Advanced volunteer tools", included: true },
                { name: "Unlimited communications", included: true },
                { name: "Member portal + mobile app", included: true },
                { name: "Sermon library + streaming", included: true },
                { name: "24/7 phone support", included: true },
                { name: "Unlimited SMS Keywords & Messages", included: true, premium: true },
                { name: "Unlimited Multimedia Campaigns", included: true, premium: true },
                { name: "Video Meetings (200 participants)", included: true, premium: true },
                { name: "Video recording & cloud storage", included: true, premium: true },
                { name: "White-label branding", included: true },
                { name: "Full API access", included: true },
                { name: "Dedicated account manager", included: true }
            ]
        }
    ];

    return (
        <div className="space-y-6">
            {/* Market Comparison */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Why We're Still 40-60% Cheaper Than Competitors
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <h4 className="font-semibold text-purple-900 mb-2">Church Management</h4>
                            <ul className="space-y-1 text-slate-600">
                                <li>• Planning Center: $199/mo (all modules)</li>
                                <li>• CCB: $79-279/mo</li>
                                <li>• Pushpay: $199-500/mo</li>
                                <li>• Our Essential: $69/mo</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-pink-900 mb-2">With SMS + MMS</h4>
                            <ul className="space-y-1 text-slate-600">
                                <li>• Subsplash: $299/mo + SMS fees</li>
                                <li>• Tithely: $119/mo + SMS fees</li>
                                <li>• SimpleTexting: $99-500/mo</li>
                                <li>• Our Growth: $149/mo (all included)</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-2">Full Suite Value</h4>
                            <ul className="space-y-1 text-slate-600">
                                <li>• ChMS: $150/mo</li>
                                <li>• SMS/MMS: $100/mo</li>
                                <li>• Video (Zoom): $65/mo</li>
                                <li>• = $315/mo separately</li>
                                <li>• <strong>Our Premium: $299/mo</strong></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-sm font-semibold text-green-900 text-center">
                            💰 Churches save $200-500/month with our all-in-one platform vs. buying separately!
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                    <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : 'border-slate-200'}`}>
                        {plan.popular && (
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                                Most Popular
                            </Badge>
                        )}
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                            <div className="flex items-baseline justify-center gap-1 mt-2">
                                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                                <span className="text-slate-500">{plan.period}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">{plan.description}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {plan.features.map((feature, featureIndex) => (
                                    <div key={featureIndex} className="flex items-start gap-2">
                                        {feature.included ? (
                                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <X className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                        )}
                                        <span className={`text-sm flex-1 ${feature.included ? 'text-slate-900' : 'text-slate-500'} ${feature.premium ? 'font-semibold' : ''}`}>
                                            {feature.name}
                                            {feature.premium && <Sparkles className="w-3 h-3 inline ml-1 text-purple-600" />}
                                            {feature.note && <span className="text-xs text-slate-500 block mt-0.5">({feature.note})</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="text-center text-sm text-slate-600 space-y-1">
                <p>All plans include SSL security, daily backups, and 99.9% uptime guarantee.</p>
                <p>14-day free trial • No credit card required • Cancel anytime</p>
                <p className="font-semibold mt-2">Custom enterprise solutions available upon request.</p>
            </div>
        </div>
    );
}
