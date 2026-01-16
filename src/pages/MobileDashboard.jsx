import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import MobileNavBar from "@/components/pwa/MobileNavBar";
import PWAInstaller from "@/components/pwa/PWAInstaller";
import PushNotificationManager from "@/components/pwa/PushNotificationManager";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import {
  Heart,
  Calendar,
  BookOpen,
  MessageSquare,
  User,
  DollarSign,
  Bell,
  TrendingUp,
  Users,
  ChevronRight
} from "lucide-react";

export default function MobileDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    newSermons: 0,
    unreadMessages: 0,
    totalDonations: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load upcoming events
      const events = await base44.entities.Event.filter({
        status: 'confirmed',
        start_datetime: { $gte: new Date().toISOString() }
      });

      // Load recent sermons
      const sermons = await base44.entities.Sermon.list('-created_date', 5);

      // Load unread messages
      const messages = await base44.entities.InAppMessage.filter({
        recipient_emails: currentUser.email,
        read_by: { $ne: currentUser.email }
      });

      // Load donations if member
      let donations = [];
      if (currentUser.role !== 'admin') {
        donations = await base44.entities.Donation.filter({
          donor_email: currentUser.email
        });
      }

      setStats({
        upcomingEvents: events.length,
        newSermons: sermons.length,
        unreadMessages: messages.length,
        totalDonations: donations.reduce((sum, d) => sum + (d.amount || 0), 0)
      });

      // Build recent activity
      const activity = [
        ...events.slice(0, 3).map(e => ({
          type: 'event',
          title: e.title,
          date: e.start_datetime,
          icon: Calendar
        })),
        ...sermons.slice(0, 2).map(s => ({
          type: 'sermon',
          title: s.title,
          date: s.sermon_date,
          icon: BookOpen
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome back!</h1>
              <p className="text-blue-100">{user?.full_name}</p>
            </div>
            <Link to={createPageUrl('NotificationSettings')}>
              <div className="relative">
                <Bell className="w-6 h-6" />
                {stats.unreadMessages > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5">
                    {stats.unreadMessages}
                  </Badge>
                )}
              </div>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <Calendar className="w-5 h-5 mb-2" />
              <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
              <div className="text-xs text-blue-100">Upcoming Events</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <BookOpen className="w-5 h-5 mb-2" />
              <div className="text-2xl font-bold">{stats.newSermons}</div>
              <div className="text-xs text-blue-100">New Sermons</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 -mt-6 mb-6">
          <Card className="shadow-xl border-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <Link to={createPageUrl('PublicGiving')} className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs text-slate-600 text-center">Give</span>
                </Link>
                <Link to={createPageUrl('PublicEventsCalendar')} className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs text-slate-600 text-center">Events</span>
                </Link>
                <Link to={createPageUrl('MemberSermons')} className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs text-slate-600 text-center">Sermons</span>
                </Link>
                <Link to={createPageUrl('Messages')} className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-xs text-slate-600 text-center">Chat</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <Link to={createPageUrl('PublicEventsCalendar')}>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <Card key={index} className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === 'event' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          activity.type === 'event' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm">{activity.title}</h3>
                        <p className="text-xs text-slate-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Giving Summary (for members) */}
        {user?.role !== 'admin' && stats.totalDonations > 0 && (
          <div className="px-6 mb-6">
            <Card className="bg-gradient-to-br from-green-600 to-emerald-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm mb-1">Total Giving This Year</p>
                    <h3 className="text-3xl font-bold">${stats.totalDonations.toFixed(2)}</h3>
                  </div>
                  <Heart className="w-12 h-12 text-green-200" />
                </div>
                <Link to={createPageUrl('MyDonations')}>
                  <Button variant="outline" size="sm" className="mt-4 bg-white/20 border-white/30 text-white hover:bg-white/30">
                    View History
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* PWA Components */}
      <PWAInstaller />
      <PushNotificationManager />
      <OfflineIndicator />
      <MobileNavBar userRole={user?.role} />
    </>
  );
}