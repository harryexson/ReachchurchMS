import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SEO from "../components/shared/SEO";
import { Users, Heart, Calendar, UserCheck, TrendingUp, DollarSign, AlertCircle, ExternalLink, ArrowUpRight, ArrowDownRight, Tablet, Settings, Plus, Megaphone, MessageSquare, Activity, CheckCircle, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek } from "date-fns";
import { createPageUrl } from "@/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useUserOrganization } from "@/components/hooks/useUserOrganization";

export default function Dashboard() {
  const { user, isLoading: orgLoading } = useUserOrganization();
  const [stats, setStats] = useState({
    totalMembers: 0,
    monthlyGiving: 0,
    upcomingEvents: 0,
    activeVolunteers: 0,
    newVisitorsThisWeek: 0
  });
  const [donationsByCategory, setDonationsByCategory] = useState([]);
  const [donorRiskSegments, setDonorRiskSegments] = useState({
    high_risk: 0,
    mid_risk: 0,
    low_risk: 0,
    no_risk: 0
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [givingTrend, setGivingTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthHelp, setShowAuthHelp] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    if (!orgLoading && user) {
      loadDashboardData(abortController.signal);
    }
    
    return () => {
      abortController.abort();
    };
  }, [orgLoading, user]);

  const loadDashboardData = async (signal) => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // First check authentication
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setShowAuthHelp(false);
      } catch (authError) {
        // Ignore transient WebSocket/connection errors
        if (authError.message && (
          authError.message.includes('WebSocket') || 
          authError.message.includes('closed') ||
          authError.message.includes('aborted')
        )) {
          console.log("Transient connection error, retrying...");
          if (!signal?.aborted) {
            setTimeout(() => loadDashboardData(signal), 1000);
          }
          return;
        }
        console.error("Authentication issue:", authError);
        setShowAuthHelp(true);
        setIsLoading(false);
        return;
      }

      // Check if request was aborted
      if (signal?.aborted) {
        console.log("Dashboard load was aborted");
        return;
      }

      // Load data with individual error handling
      let members = [];
      let donations = [];
      let events = [];
      let volunteers = [];
      let visitors = [];

      try {
        // Filter members by current user's organization
        members = await base44.entities.Member.filter(
          { created_by: currentUser.email },
          "-created_date"
        );
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Error loading members:", error);
        }
      }

      if (signal?.aborted) return;

      try {
        // Filter donations by current user's organization
        donations = await base44.entities.Donation.filter(
          { created_by: currentUser.email },
          "-donation_date",
          200
        );
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Error loading donations:", error);
        } else {
          console.log("Donation load aborted (component unmounted)");
        }
      }

      if (signal?.aborted) return;

      try {
        // Filter events by current user's organization
        events = await base44.entities.Event.filter(
          { created_by: currentUser.email },
          "-start_datetime",
          20
        );
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Error loading events:", error);
        }
      }

      if (signal?.aborted) return;

      try {
        // Filter volunteers by current user's organization
        volunteers = await base44.entities.Volunteer.filter({ 
          status: 'active',
          created_by: currentUser.email
        });
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Error loading volunteers:", error);
        }
      }

      if (signal?.aborted) return;

      try {
        // Filter visitors by current user's organization
        visitors = await base44.entities.Visitor.filter(
          { created_by: currentUser.email },
          "-visit_date"
        );
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Error loading visitors:", error);
        }
      }

      if (signal?.aborted) return;

      // Process data
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const lastMonthStart = startOfMonth(subMonths(currentMonth, 1));
      const lastMonthEnd = endOfMonth(subMonths(currentMonth, 1));
      
      const monthlyDonations = donations.filter(d => {
        const donationDate = new Date(d.donation_date);
        return donationDate >= monthStart && donationDate <= monthEnd;
      });

      const lastMonthDonations = donations.filter(d => {
        const donationDate = new Date(d.donation_date);
        return donationDate >= lastMonthStart && donationDate <= lastMonthEnd;
      });

      const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const lastMonthTotal = lastMonthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const givingGrowth = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;

      const upcoming = events.filter(e => new Date(e.start_datetime) > new Date()).slice(0, 5);
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const newVisitors = visitors.filter(v => new Date(v.visit_date) >= weekStart).length;

      // Group donations by category
      const categoryGroups = {};
      donations.forEach(d => {
        const cat = d.donation_type || 'other';
        if (!categoryGroups[cat]) {
          categoryGroups[cat] = { category: cat, total: 0, count: 0 };
        }
        categoryGroups[cat].total += d.amount || 0;
        categoryGroups[cat].count += 1;
      });
      const categoryArray = Object.values(categoryGroups).sort((a, b) => b.total - a.total);

      // Calculate donor risk segments
      const donorMap = {};
      donations.forEach(d => {
        if (!donorMap[d.donor_email]) {
          donorMap[d.donor_email] = { email: d.donor_email, donations: [], lastDonation: null, totalAmount: 0 };
        }
        donorMap[d.donor_email].donations.push(d);
        donorMap[d.donor_email].totalAmount += d.amount || 0;
        const donDate = new Date(d.donation_date);
        if (!donorMap[d.donor_email].lastDonation || donDate > new Date(donorMap[d.donor_email].lastDonation)) {
          donorMap[d.donor_email].lastDonation = d.donation_date;
        }
      });

      const riskSegments = { high_risk: 0, mid_risk: 0, low_risk: 0, no_risk: 0 };
      const now = new Date();
      Object.values(donorMap).forEach(donor => {
        if (!donor.lastDonation) return;
        const daysSinceLastDonation = (now - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastDonation > 90) riskSegments.high_risk++;
        else if (daysSinceLastDonation > 60) riskSegments.mid_risk++;
        else if (daysSinceLastDonation > 30) riskSegments.low_risk++;
        else riskSegments.no_risk++;
      });

      // Giving trend (last 6 months)
      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(currentMonth, i);
        const monthStartIter = startOfMonth(monthDate);
        const monthEndIter = endOfMonth(monthDate);
        
        const monthDonations = donations.filter(d => {
          const donationDate = new Date(d.donation_date);
          return donationDate >= monthStartIter && donationDate <= monthEndIter;
        });
        
        const total = monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
        
        trendData.push({
          month: format(monthDate, 'MMM'),
          amount: total
        });
      }

      if (signal?.aborted) return;

      setStats({
        totalMembers: members.length,
        monthlyGiving: monthlyTotal,
        upcomingEvents: upcoming.length,
        activeVolunteers: volunteers.length,
        newVisitorsThisWeek: newVisitors,
        givingGrowth: givingGrowth
      });

      setDonationsByCategory(categoryArray);
      setDonorRiskSegments(riskSegments);
      setRecentDonations(donations.slice(0, 5));
      setUpcomingEvents(upcoming);
      setGivingTrend(trendData);

      // Build recent activity feed
      const activityFeed = [];
      
      // Recent donations (last 5)
      donations.slice(0, 5).forEach(donation => {
        activityFeed.push({
          type: 'donation',
          icon: DollarSign,
          title: `${donation.donor_name} gave $${donation.amount?.toFixed(2)}`,
          time: new Date(donation.donation_date),
          badge: 'Donation',
          badgeColor: 'bg-green-600'
        });
      });

      // Recent members (last 5)
      const recentMembers = members
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 5);
      recentMembers.forEach(member => {
        activityFeed.push({
          type: 'member',
          icon: Users,
          title: `${member.first_name} ${member.last_name} joined`,
          time: new Date(member.created_date),
          badge: 'New Member',
          badgeColor: 'bg-blue-600'
        });
      });

      // Upcoming events (next 5)
      upcoming.forEach(event => {
        const daysUntil = Math.ceil((new Date(event.start_datetime) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 7) {
          activityFeed.push({
            type: 'event',
            icon: Calendar,
            title: `${event.title} starts in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
            time: new Date(event.start_datetime),
            badge: 'Event',
            badgeColor: 'bg-purple-600'
          });
        }
      });

      // Sort all activity by time (most recent first)
      activityFeed.sort((a, b) => b.time - a.time);
      setRecentActivity(activityFeed.slice(0, 10));
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Error loading dashboard data:", error);
        setLoadError(error.message || "Failed to load dashboard data");
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  if (showAuthHelp) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
        <div className="max-w-3xl mx-auto mt-12">
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-lg font-semibold text-yellow-900">Authentication Setup Required</AlertTitle>
            <AlertDescription className="mt-3 text-yellow-800 space-y-4">
              <p>You're seeing this message because Google OAuth authentication isn't properly configured for this app.</p>
              
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-3">How to Fix This:</h3>
                <ol className="space-y-2 text-sm list-decimal ml-5">
                  <li>Open the <strong>base44 Dashboard</strong> (where you manage this app)</li>
                  <li>Click <strong>Settings</strong> → <strong>Authentication</strong></li>
                  <li>Configure <strong>Google OAuth</strong> with your credentials</li>
                  <li>Add your email to <strong>Test Users</strong> if in development mode</li>
                  <li>Save changes and try signing in again</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-800 mb-3">Contact base44 support for assistance with OAuth configuration.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('mailto:support@base44.app', '_blank')}
                  className="text-blue-700 border-blue-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
              </div>

              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                I've Fixed It - Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
        <div className="max-w-3xl mx-auto mt-12">
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-lg font-semibold text-red-900">Error Loading Dashboard</AlertTitle>
            <AlertDescription className="mt-3 text-red-800 space-y-4">
              <p>{loadError}</p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Retry
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = createPageUrl("Settings")}
                >
                  Go to Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

      return (
      <>
          <SEO 
              title="Dashboard - REACH Church Connect"
              description="Manage your church operations from your dashboard. View giving, members, events, and more."
              url="/dashboard"
          />
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-600 mt-2">Welcome back! Here's your ministry overview.</p>
          </div>
        </div>

        {/* Quick Actions Widget */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-blue-100 hover:border-blue-400"
              onClick={() => window.location.href = createPageUrl('Events')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Create Event</p>
                    <p className="text-xs text-slate-500">Schedule new</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-purple-100 hover:border-purple-400"
              onClick={() => window.location.href = createPageUrl('CommunicationHub')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Send Announcement</p>
                    <p className="text-xs text-slate-500">Notify members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-green-100 hover:border-green-400"
              onClick={() => window.location.href = createPageUrl('Members')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Add Member</p>
                    <p className="text-xs text-slate-500">Register new</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-amber-100 hover:border-amber-400"
              onClick={() => window.location.href = createPageUrl('TextMessaging')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Send SMS</p>
                    <p className="text-xs text-slate-500">Text church</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ministry Health Widget */}
        {!isLoading && (
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <CardHeader className="border-b border-blue-100">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Ministry Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Member Engagement */}
                <div className="bg-white rounded-xl p-5 shadow-md border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-600">Member Engagement</p>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {stats.totalMembers}
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-600 font-medium">Active members</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {stats.newVisitorsThisWeek} new visitors this week
                  </p>
                </div>

                {/* Giving Trends */}
                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-600">Giving Trends</p>
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    ${stats.monthlyGiving.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    {stats.givingGrowth >= 0 ? (
                      <>
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-green-600 font-medium">
                          +{stats.givingGrowth}% vs last month
                        </p>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                        <p className="text-sm text-red-600 font-medium">
                          {stats.givingGrowth}% vs last month
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Volunteer Participation */}
                <div className="bg-white rounded-xl p-5 shadow-md border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-600">Volunteer Participation</p>
                    <Heart className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    {stats.activeVolunteers}
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-600 font-medium">Active volunteers</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Serving this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-0 shadow-lg animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Monthly Giving */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      {stats.givingGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(stats.givingGrowth)}%
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Monthly Giving</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ${stats.monthlyGiving.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">vs last month</p>
                </CardContent>
              </Card>

              {/* Total Members */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Members</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalMembers}</p>
                  <p className="text-xs text-slate-500 mt-2">Active congregation</p>
                </CardContent>
              </Card>

              {/* New Visitors */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">New Visitors</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.newVisitorsThisWeek}</p>
                  <p className="text-xs text-slate-500 mt-2">This week</p>
                </CardContent>
              </Card>

              {/* Active Volunteers */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Active Volunteers</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.activeVolunteers}</p>
                  <p className="text-xs text-slate-500 mt-2">Serving this month</p>
                </CardContent>
              </Card>
            </div>

            {/* Giving Analytics Row */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Giving Trend Chart */}
              <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Giving Trend (6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={givingTrend}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
                          fill="url(#colorAmount)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Donor Risk Segments */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-slate-900">Donor Engagement</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Active (0-30 days)</span>
                        <span className="text-sm font-bold text-green-700">{donorRiskSegments.no_risk}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                          style={{ width: `${(donorRiskSegments.no_risk / (donorRiskSegments.no_risk + donorRiskSegments.low_risk + donorRiskSegments.mid_risk + donorRiskSegments.high_risk) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Low Risk (31-60 days)</span>
                        <span className="text-sm font-bold text-blue-700">{donorRiskSegments.low_risk}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                          style={{ width: `${(donorRiskSegments.low_risk / (donorRiskSegments.no_risk + donorRiskSegments.low_risk + donorRiskSegments.mid_risk + donorRiskSegments.high_risk) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Mid Risk (61-90 days)</span>
                        <span className="text-sm font-bold text-orange-700">{donorRiskSegments.mid_risk}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-600 rounded-full"
                          style={{ width: `${(donorRiskSegments.mid_risk / (donorRiskSegments.no_risk + donorRiskSegments.low_risk + donorRiskSegments.mid_risk + donorRiskSegments.high_risk) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">High Risk (90+ days)</span>
                        <span className="text-sm font-bold text-red-700">{donorRiskSegments.high_risk}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-pink-600 rounded-full"
                          style={{ width: `${(donorRiskSegments.high_risk / (donorRiskSegments.no_risk + donorRiskSegments.low_risk + donorRiskSegments.mid_risk + donorRiskSegments.high_risk) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Total Donors: {donorRiskSegments.no_risk + donorRiskSegments.low_risk + donorRiskSegments.mid_risk + donorRiskSegments.high_risk}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Giving by Category & Recent Activity Feed */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity Feed Widget */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Activity className="w-5 h-5 text-slate-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {recentActivity.map((activity, index) => {
                        const Icon = activity.icon;
                        const timeAgo = (() => {
                          const seconds = Math.floor((new Date() - activity.time) / 1000);
                          if (seconds < 60) return 'just now';
                          const minutes = Math.floor(seconds / 60);
                          if (minutes < 60) return `${minutes}m ago`;
                          const hours = Math.floor(minutes / 60);
                          if (hours < 24) return `${hours}h ago`;
                          const days = Math.floor(hours / 24);
                          if (days < 7) return `${days}d ago`;
                          return activity.time.toLocaleDateString();
                        })();

                        return (
                          <div key={index} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${activity.badgeColor}`}>
                                  {activity.badge}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {timeAgo}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Giving by Category */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-slate-900">Giving by Category</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {donationsByCategory.slice(0, 6).map((cat, idx) => {
                      const colors = [
                        'from-blue-500 to-indigo-600',
                        'from-green-500 to-emerald-600',
                        'from-purple-500 to-pink-600',
                        'from-orange-500 to-amber-600',
                        'from-red-500 to-rose-600',
                        'from-cyan-500 to-teal-600'
                      ];
                      const bgColors = [
                        'from-blue-50 to-indigo-50',
                        'from-green-50 to-emerald-50',
                        'from-purple-50 to-pink-50',
                        'from-orange-50 to-amber-50',
                        'from-red-50 to-rose-50',
                        'from-cyan-50 to-teal-50'
                      ];
                      
                      return (
                        <div key={cat.category} className={`p-4 rounded-xl bg-gradient-to-br ${bgColors[idx % bgColors.length]} border border-slate-100`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-slate-700 capitalize">
                                {cat.category.replace('_', ' ')}
                              </p>
                              <p className="text-2xl font-bold text-slate-900 mt-1">
                                ${cat.total.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">{cat.count} donations</p>
                            </div>
                          </div>
                          <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full`}
                              style={{ width: `${(cat.total / donationsByCategory[0].total * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500 cursor-pointer"
                onClick={() => window.location.href = createPageUrl('Giving')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">View Donations</h3>
                      <p className="text-sm text-slate-600">Track all giving</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 cursor-pointer"
                onClick={() => window.location.href = createPageUrl('KioskGivingSetup')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Tablet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Kiosk Setup</h3>
                      <p className="text-sm text-slate-600">iPad & Android guide</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 cursor-pointer"
                onClick={() => window.location.href = createPageUrl('Settings')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Settings</h3>
                      <p className="text-sm text-slate-600">Configure your app</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}