
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Donation } from "@/entities/Donation";
import { Announcement } from "@/entities/Announcement";
import { MMSCampaign } from "@/entities/MMSCampaign";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, MessageSquare, DollarSign, Users, BookOpen } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function MemberDashboard() {
    const [currentUser, setCurrentUser] = useState(null);
    const [myDonations, setMyDonations] = useState([]);
    const [recentAnnouncements, setRecentAnnouncements] = useState([]);
    const [recentCampaigns, setRecentCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMemberData();
    }, []);

    const loadMemberData = async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            // Load only MY donations
            const [donations, announcements, campaigns] = await Promise.all([
                Donation.filter({ 
                    donor_email: user.donor_email || user.email 
                }),
                Announcement.filter({ 
                    status: 'published' 
                }, '-publish_date', 5),
                MMSCampaign.filter({ 
                    status: 'sent' 
                }, '-sent_date', 3)
            ]);

            setMyDonations(donations);
            setRecentAnnouncements(announcements);
            setRecentCampaigns(campaigns);
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
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Welcome, {currentUser?.full_name}!
                        </h1>
                        <p className="text-slate-600 mt-1">Stay connected with your church community</p>
                    </div>
                    <Button 
                        onClick={() => {
                            // Open in same tab for authenticated users
                            window.location.href = createPageUrl('PublicGiving');
                        }}
                        className="bg-green-600 hover:bg-green-700 shadow-lg"
                    >
                        <Heart className="w-5 h-5 mr-2" />
                        Give Now
                    </Button>
                </div>

                {/* My Giving Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
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
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
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
