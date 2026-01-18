import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, MessageSquare, DollarSign, Users, BookOpen, FileText, Download } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function MemberDashboard() {
    const [currentUser, setCurrentUser] = useState(null);
    const [myDonations, setMyDonations] = useState([]);
    const [recentAnnouncements, setRecentAnnouncements] = useState([]);
    const [recentCampaigns, setRecentCampaigns] = useState([]);
    const [yearEndStatements, setYearEndStatements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMemberData();
    }, []);

    const loadMemberData = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Load MY donations, announcements, campaigns, and statements
            const [donations, announcements, campaigns, statements] = await Promise.all([
                base44.entities.Donation.filter({ 
                    donor_email: user.email 
                }),
                base44.entities.Announcement.filter({ 
                    status: 'published' 
                }, '-publish_date', 5),
                base44.entities.MMSCampaign.filter({ 
                    status: 'sent' 
                }, '-sent_date', 3),
                base44.entities.DonationStatement.filter({
                    donor_email: user.email
                }, '-statement_year', 3)
            ]);

            setMyDonations(donations);
            setRecentAnnouncements(announcements);
            setRecentCampaigns(campaigns);
            setYearEndStatements(statements);
        } catch (error) {
            console.error("Failed to load member data:", error);
        }
        setIsLoading(false);
    };

    const totalGiving = myDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const thisYearGiving = myDonations.filter(d => {
        const year = new Date(d.donation_date).getFullYear();
        return year === new Date().getFullYear();
    }).reduce((sum, d) => sum + (d.amount || 0), 0);

    return (
        <div className="pb-20 md:pb-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Mobile-Optimized Header */}
                <div className="bg-white border-b border-slate-200 px-4 py-4 md:rounded-t-2xl md:mt-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {currentUser?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">REACH Church Connect</p>
                            <p className="text-sm font-semibold text-slate-900">My Church</p>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">
                        Hi {currentUser?.full_name?.split(' ')[0] || 'there'}!
                    </h1>
                    <p className="text-slate-600 text-sm">What would you like to do today?</p>
                </div>

                <div className="px-4 py-6 space-y-6">
                    {/* Quick Give Section - Prominent */}
                    <Button 
                        onClick={() => {
                            window.location.href = createPageUrl('PublicGiving');
                        }}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                    >
                        <Heart className="w-5 h-5 mr-2" />
                        Give Now
                    </Button>

                    {/* Quick Give Amount - If user has donated before */}
                    {myDonations.length > 0 && (
                        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-purple-50">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Quick Give</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            ${myDonations[0]?.amount?.toFixed(2) || '0.00'}
                                        </p>
                                        <p className="text-xs text-slate-500">Based on last gift</p>
                                    </div>
                                    <Button 
                                        onClick={() => {
                                            window.location.href = createPageUrl('PublicGiving');
                                        }}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Give
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Explore Section - Card-Based Actions */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700">Explore</h3>
                        
                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                                        <Heart className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 mb-1">Ready to make a lasting impact?</h4>
                                        <p className="text-sm text-slate-600 mb-3">Add recurring gifts.</p>
                                        <Link to={createPageUrl('DonorPortal')}>
                                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                                                Add Recurring Gift →
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                                        <DollarSign className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 mb-1">Adding payment method is easy and convenient.</h4>
                                        <p className="text-sm text-slate-600 mb-3">Save your card for faster giving.</p>
                                        <Link to={createPageUrl('PublicGiving')}>
                                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                                                Add payment method →
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 mb-1">Check out upcoming events</h4>
                                        <p className="text-sm text-slate-600 mb-3">Register and stay connected.</p>
                                        <Link to={createPageUrl('PublicEventsCalendar')}>
                                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                                                View Events →
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 mb-1">Join a group</h4>
                                        <p className="text-sm text-slate-600 mb-3">Connect with others in the community.</p>
                                        <Link to={createPageUrl('MyGroups')}>
                                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                                                Browse Groups →
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* My Giving Stats - Hidden on mobile, shown on desktop */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">My Total Giving</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        ${totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <Heart className="w-12 h-12 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">This Year's Giving</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        ${thisYearGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <DollarSign className="w-12 h-12 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Year-End Statements */}
                {yearEndStatements.length > 0 && (
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50 mx-4">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    Year End Giving Statements
                                </span>
                                <Badge className="bg-green-600 text-white">Tax Deductible</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {yearEndStatements.map(statement => (
                                    <div key={statement.id} className="p-4 bg-white rounded-lg border shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-bold text-slate-900">{statement.statement_year} Year-End Statement</p>
                                            <p className="text-sm text-slate-600">
                                                Total: ${statement.total_amount.toFixed(2)} • {statement.donation_count} donations
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Generated: {format(new Date(statement.statement_date), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => window.open(statement.statement_pdf_url, '_blank')}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            PDF
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Link to={createPageUrl('MyDonations')}>
                                <Button variant="outline" className="w-full mt-4">
                                    View All Statements & Donations →
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Messages Preview */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mx-4">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                Messages
                            </span>
                            <Link to={createPageUrl('Messages')}>
                                <Button variant="ghost" size="sm">View All →</Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link to={createPageUrl('Messages')}>
                            <div className="text-center py-8 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-blue-600 opacity-70" />
                                <p className="text-slate-600 mb-2">Check your messages</p>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Open Messages
                                </Button>
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-4">
                    <Link to={createPageUrl('MemberSermons')}>
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer">
                            <CardContent className="p-6 text-center">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                                <h3 className="font-semibold text-slate-900 mb-1">Watch Sermons</h3>
                                <p className="text-sm text-slate-600">View our sermon library</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to={createPageUrl('MemberAnnouncements')}>
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer">
                            <CardContent className="p-6 text-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                                <h3 className="font-semibold text-slate-900 mb-1">Announcements</h3>
                                <p className="text-sm text-slate-600">Stay updated with church news</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to={createPageUrl('MyDonations')}>
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer">
                            <CardContent className="p-6 text-center">
                                <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-600" />
                                <h3 className="font-semibold text-slate-900 mb-1">My Donations</h3>
                                <p className="text-sm text-slate-600">View giving history & statements</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Recent Announcements */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mx-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Recent Announcements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentAnnouncements.length > 0 ? (
                            <div className="space-y-4">
                                {recentAnnouncements.map(announcement => (
                                    <div key={announcement.id} className="p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-semibold text-slate-900 mb-1">{announcement.title}</h4>
                                        <p className="text-sm text-slate-700">{announcement.message}</p>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {new Date(announcement.publish_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 py-8">No recent announcements</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Campaigns */}
                {recentCampaigns.length > 0 && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mx-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                Recent Updates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentCampaigns.map(campaign => (
                                    <div key={campaign.id} className="p-4 bg-purple-50 rounded-lg">
                                        <h4 className="font-semibold text-slate-900 mb-1">{campaign.title}</h4>
                                        <p className="text-sm text-slate-700">{campaign.description}</p>
                                        {campaign.public_link && (
                                            <Link to={campaign.public_link} className="text-sm text-purple-600 hover:text-purple-700 mt-2 inline-block">
                                                View Details →
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}