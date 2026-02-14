import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
                                Church,
                                Users,
                                Calendar,
                                DollarSign,
                                UserPlus,
                                Megaphone,
                                BarChart3,
                                BookOpen,
                                Settings,
                                LogOut,
                                Menu,
                                X,
                                CreditCard,
                                UserCog,
                                MessageSquare,
                                Video,
                                Mail,
                                Image,
                                Shield,
                                UserCheck,
                                User as UserIcon,
                                Heart,
                                Baby,
                                Coffee,
                                Book,
                                Monitor,
                                Package,
                                ShoppingCart,
                                Printer,
                                Radio,
                                Wifi,
                                Bell,
                                Loader2,
                                Palette,
                                Zap
                              } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import FloatingChat from "@/components/messaging/FloatingChat";
import PWAInstaller from "@/components/pwa/PWAInstaller";
import PushNotificationManager from "@/components/pwa/PushNotificationManager";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import MobileNavBar from "@/components/pwa/MobileNavBar";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import { Button } from "@/components/ui/button";

const publicPages = [
  {
    title: "Home",
    url: createPageUrl("LandingPage"),
    icon: Church,
  },
  {
    title: "Plans & Pricing",
    url: createPageUrl("SubscriptionPlans"),
    icon: CreditCard,
  },
  {
    title: "Events Calendar",
    url: createPageUrl("PublicEventsCalendar"),
    icon: Calendar,
  },
];

// Pages that should be accessible without authentication
const PUBLIC_PATHS = [
  'landingpage',
  'subscriptionplans',
  'publiceventscalendar',
  'viewmmscampaign',
  'publicmemberregistration',
  'publicvisitorregistration',
  'visitorqrdisplay',
  'publicgiving',
  'public/giving',
  'public/member-registration',
  'public/visitor-card',
  '/publicgiving',
  '/public/giving',
  'kiosksetupinstructions',
  'kiosk-setup-instructions',
  'kioskgivingsetup',
  'kiosk-giving-setup',
  'kioskgiving',
  'marketstrategy',
  'competitiveanalysis',
  'careers',
  'support',
  'helpcenter',
  'documentation',
  'resources',
  'privacypolicy',
  'termsofservice'
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const pathLower = location.pathname.toLowerCase();
      const pageLower = currentPageName?.toLowerCase() || '';

      const isPublicPage = PUBLIC_PATHS.some(path => 
        pathLower.includes(path.toLowerCase()) || 
        pageLower.includes(path.toLowerCase()) ||
        pageLower === 'publicgiving'
      );

      try {
        const user = await base44.auth.me();

        if (user) {
          // CRITICAL: Check if on subscription plans page with upgrade/expired params - ALLOW ACCESS
          const urlParams = new URLSearchParams(location.search);
          const isUpgradeFlow = urlParams.get('upgrade') === 'true' || urlParams.get('expired') === 'true';

          // CRITICAL: Redirect authenticated users away from landing/signup pages IMMEDIATELY
          // BUT allow subscription plans page during upgrade flow
          if ((currentPageName?.toLowerCase() === 'landingpage' || 
              location.pathname === '/') && !isUpgradeFlow) {
            const dashboardUrl = user.role === 'admin' 
              ? createPageUrl('Dashboard') 
              : createPageUrl('MemberDashboard');
            console.log('🔀 Authenticated user on public page - redirecting to:', dashboardUrl);
            window.location.href = dashboardUrl;
            return;
          }

          // Allow subscription plans page if in upgrade flow
          if ((currentPageName?.toLowerCase() === 'subscriptionplans' || 
              location.pathname.toLowerCase().includes('subscriptionplans')) && isUpgradeFlow) {
            console.log('✅ Allowing subscription page access during upgrade flow');
            setCurrentUser(user);
            setAuthError(null);
            setIsLoadingUser(false);
            return;
          }

          // Update last login silently - don't block on this
          base44.auth.updateMe({
            last_login: new Date().toISOString()
          }).catch(() => {});

          // Skip subscription check for developers
          if (user.email === "david@base44.app" || user.developer_access) {
            console.log('👨‍💻 Developer account - skipping subscription checks');
            setCurrentUser(user);
            setAuthError(null);
            setIsLoadingUser(false);
            return;
          }

          // Members don't need their own subscription - they're covered by church's subscription
          if (user.role !== 'admin') {
            console.log('✅ Member account - no subscription check needed');
            setCurrentUser(user);
            setAuthError(null);
            setIsLoadingUser(false);
            return;
          }

          // Check subscription status (only for admin users)
          let hasValidAccess = false;
          let shouldRedirectToUpgrade = false;

          try {
            const subscriptions = await base44.entities.Subscription.filter({
              church_admin_email: user.email
            });

            if (subscriptions.length > 0) {
              const subscription = subscriptions[0];
              console.log('📋 Subscription found:', {
                status: subscription.status,
                tier: subscription.subscription_tier,
                trial_end: subscription.trial_end_date
              });

              // Check subscription status
              if (subscription.status === 'active') {
                hasValidAccess = true;
                console.log('✅ Active paid subscription - access granted');
              } else if (subscription.status === 'trial') {
                if (subscription.trial_end_date) {
                  const trialEnd = new Date(subscription.trial_end_date);
                  const now = new Date();

                  if (now <= trialEnd) {
                    hasValidAccess = true;
                    console.log('✅ Trial valid until:', subscription.trial_end_date);
                  } else {
                    shouldRedirectToUpgrade = true;
                    console.log('❌ Trial expired on:', subscription.trial_end_date);
                  }
                } else {
                  // Trial without end date - treat as valid
                  hasValidAccess = true;
                  console.log('✅ Trial active (no end date set)');
                }
              } else if (subscription.status === 'past_due') {
                shouldRedirectToUpgrade = true;
                console.log('❌ Subscription past due - payment required');
              } else if (subscription.status === 'cancelled' || subscription.status === 'suspended') {
                shouldRedirectToUpgrade = true;
                console.log('❌ Subscription cancelled/suspended');
              } else {
                // Unknown status - allow access to be safe
                hasValidAccess = true;
                console.log('⚠️ Unknown subscription status:', subscription.status);
              }

              // If user has valid access, check onboarding status
              if (hasValidAccess && user.role === 'admin' && !pageLower.includes('onboarding') && !pageLower.includes('adminonboarding')) {
                try {
                  const onboardingRecords = await base44.entities.OnboardingProgress.filter({
                    user_email: user.email
                  });

                  if (onboardingRecords.length === 0 || !onboardingRecords[0].onboarding_completed) {
                    console.log('🎯 First-time admin - redirecting to onboarding');
                    window.location.href = createPageUrl('AdminOnboarding');
                    return;
                  } else {
                    console.log('✅ Onboarding already completed');
                  }
                } catch (onboardingError) {
                  console.log('⚠️ Could not check onboarding status:', onboardingError.message);
                }
              }
            } else {
              // No subscription found - only redirect to subscription if not on public pages or onboarding
              if (!pageLower.includes('onboarding') && !pageLower.includes('subscriptionplans')) {
                shouldRedirectToUpgrade = true;
                console.log('❌ No subscription found - user must subscribe');
              }
            }
          } catch (subError) {
            console.error('❌ Error checking subscription:', subError.message);
            // On error, check if user just signed up (within last 5 minutes)
            const userCreated = new Date(user.created_date || 0);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            if (userCreated > fiveMinutesAgo) {
              // New user - allow access, they might be in signup flow
              hasValidAccess = true;
              console.log('⚠️ New user - allowing access during signup');
            } else {
              // Existing user with error - safer to require subscription
              shouldRedirectToUpgrade = true;
              console.log('⚠️ Subscription check error for existing user');
            }
          }

          // Redirect to subscription page with upgrade message if trial expired
          if (shouldRedirectToUpgrade && !pageLower.includes('subscriptionplans')) {
            console.log('🔀 Redirecting to subscription upgrade page');
            window.location.href = createPageUrl('SubscriptionPlans') + '?upgrade=true&expired=true';
            return;
          }

          // User is authenticated - set them as current user
          setCurrentUser(user);
          setAuthError(null);
        }
      } catch (error) {
        // Ignore aborted requests and WebSocket errors (transient connection issues)
        if (error.message && (
          error.message.includes('aborted') || 
          error.message.includes('WebSocket') ||
          error.message.includes('closed')
        )) {
          console.log('Connection issue (will retry):', error.message);
          setAuthError(null);
          setIsLoadingUser(false);
          return;
        }

        // On public pages, authentication failure is normal - just show public content
        if (isPublicPage) {
          console.log('Public page - no authentication required');
          setCurrentUser(null);
          setAuthError(null);
          setIsLoadingUser(false);
          return;
        }

        console.error('Auth error:', error);
        setAuthError(error.message || 'Authentication failed');
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    fetchUser();
  }, [location.pathname, currentPageName]);

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.href = createPageUrl("LandingPage");
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = createPageUrl("LandingPage");
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
    setShowLogout(false);
  };

  const handleLogin = async () => {
    // Redirect to Base44 login page - let Layout redirect to appropriate page after auth
    await base44.auth.redirectToLogin();
  };

  const handleRetry = () => {
    setAuthError(null);
    setIsLoadingUser(true);
    window.location.reload();
  };

  const isPublicPage = PUBLIC_PATHS.some(path => 
    location.pathname.toLowerCase().includes(path.toLowerCase()) || 
    currentPageName?.toLowerCase().includes(path.toLowerCase()) ||
    currentPageName?.toLowerCase() === 'publicgiving'
  );

  const adminPages = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: Church,
    },

    {
      title: "User Management",
      url: createPageUrl("UserManagement"),
      icon: UserCog,
    },
    {
      title: "Role Management",
      url: createPageUrl("RoleManagement"),
      icon: Shield,
    },
    {
      title: "User Role Assignment",
      url: createPageUrl("UserRoleAssignment"),
      icon: UserCog,
    },
    {
      title: "Members",
      url: createPageUrl("Members"),
      icon: Users,
    },
    {
      title: "Member Registration QR",
      url: createPageUrl("MemberRegistrationQR"),
      icon: UserPlus,
    },
    {
      title: "Visitors",
      url: createPageUrl("Visitors"),
      icon: UserCheck,
    },
    {
      title: "People Engagement",
      url: createPageUrl("VisitorFollowUp"),
      icon: Heart,
    },
    {
      title: "Visitor QR Code",
      url: createPageUrl("VisitorQRCode"),
      icon: UserCheck,
    },
    {
      title: "Events",
      url: createPageUrl("Events"),
      icon: Calendar,
    },
    {
      title: "Kids Check-In",
      url: createPageUrl("KidsCheckIn"),
      icon: Baby,
    },
    {
      title: "Kids Check-Out",
      url: createPageUrl("KidsCheckOut"),
      icon: UserCheck,
    },
    {
      title: "Giving",
      url: createPageUrl("Giving"),
      icon: DollarSign,
    },
    {
      title: "QR Code Donations",
      url: createPageUrl("QRCodeDonation"),
      icon: Heart,
    },
    {
      title: "Financial Management",
      url: createPageUrl("FinancialManagement"),
      icon: BarChart3,
    },
    {
      title: "Giving Messages",
      url: createPageUrl("GivingMessages"),
      icon: Heart,
    },
    {
      title: "Donor Communications",
      url: createPageUrl("DonorCommunications"),
      icon: Mail,
    },
    {
      title: "Financial Reports",
      url: createPageUrl("FinancialReports"),
      icon: BarChart3,
    },
    {
      title: "Giving Categories",
      url: createPageUrl("GivingCategoryManagement"),
      icon: DollarSign,
    },
    {
      title: "Service Planning",
      url: createPageUrl("ServicePlanning"),
      icon: Calendar,
    },
    {
      title: "Service Calendar",
      url: createPageUrl("ServiceCalendar"),
      icon: Calendar,
    },
    {
      title: "Song Library",
      url: createPageUrl("SongLibrary"),
      icon: BookOpen,
    },
    {
      title: "Service Templates",
      url: createPageUrl("ServiceTemplates"),
      icon: Calendar,
    },
    {
      title: "Notification Templates",
      url: createPageUrl("ServiceNotificationTemplates"),
      icon: Mail,
    },
    {
      title: "Volunteer Scheduling",
      url: createPageUrl("VolunteerScheduling"),
      icon: UserCheck,
    },
    {
      title: "Volunteers",
      url: createPageUrl("Volunteers"),
      icon: UserPlus,
    },
    {
      title: "Volunteer Portal",
      url: createPageUrl("VolunteerPortal"),
      icon: Heart,
    },
    {
      title: "Communication Hub",
      url: createPageUrl("CommunicationHub"),
      icon: Megaphone,
    },
    {
      title: "Text Messaging",
      url: createPageUrl("TextMessaging"),
      icon: MessageSquare,
    },
    {
      title: "SMS Giving",
      url: createPageUrl("SMSGivingSetup"),
      icon: MessageSquare,
    },
    {
      title: "Multimedia Messaging",
      url: createPageUrl("MultimediaMessaging"),
      icon: Image,
    },
    {
      title: "Contact Directory",
      url: createPageUrl("ContactDirectory"),
      icon: Mail,
    },
    {
      title: "Video Meetings",
      url: createPageUrl("VideoMeetings"),
      icon: Video,
    },
    {
      title: "Reports",
      url: createPageUrl("Reports"),
      icon: BarChart3,
    },
    {
      title: "Analytics Dashboard",
      url: createPageUrl("AnalyticsDashboard"),
      icon: BarChart3,
    },
    {
      title: "Sermons",
      url: createPageUrl("Sermons"),
      icon: BookOpen,
    },
    {
      title: "Stream Scheduler",
      url: createPageUrl("StreamScheduler"),
      icon: Radio,
    },
    {
      title: "Community Library",
      url: createPageUrl("Community"),
      icon: Users,
    },
    {
      title: "Bookstore",
      url: createPageUrl("Bookstore"),
      icon: Book,
    },
    {
      title: "Coffee Shop Kiosk",
      url: createPageUrl("CoffeeShopKiosk"),
      icon: Coffee,
    },
    {
      title: "Kitchen Display",
      url: createPageUrl("KitchenDisplay"),
      icon: Monitor,
    },
    {
      title: "Product Management",
      url: createPageUrl("ProductManagement"),
      icon: Package,
    },
    {
      title: "Inventory Management",
      url: createPageUrl("InventoryManagement"),
      icon: Package,
    },
    {
      title: "Kiosk Giving",
      url: createPageUrl("KioskGiving"),
      icon: CreditCard,
    },
    {
      title: "Printer Setup",
      url: createPageUrl("PrinterSetup"),
      icon: Printer,
    },
    {
      title: "Network Printers",
      url: createPageUrl("NetworkPrinterSetup"),
      icon: Wifi,
    },
    {
      title: "Hardware Setup Wizard",
      url: createPageUrl("HardwareSetupWizard"),
      icon: Settings,
    },
    {
      title: "System Diagnostics",
      url: createPageUrl("SystemDiagnostics"),
      icon: Settings,
    },
    {
        title: "Device Management",
        url: createPageUrl("DeviceManagement"),
        icon: Monitor,
      },
      {
          title: "Auto Device Setup",
          url: createPageUrl("AutoDeviceSetup"),
          icon: Wifi,
        },
        {
          title: "Display Content",
          url: createPageUrl("DisplayContentManager"),
          icon: Monitor,
        },
    {
      title: "Quick Expense",
      url: createPageUrl("QuickExpense"),
      icon: DollarSign,
    },
    {
      title: "Member Groups",
      url: createPageUrl("MemberGroups"),
      icon: Users,
    },
    {
      title: "Group Requests",
      url: createPageUrl("GroupJoinRequests"),
      icon: UserCheck,
    },
    {
      title: "Admin Messaging",
      url: createPageUrl("AdminMessaging"),
      icon: MessageSquare,
    },
    {
      title: "People Engagement",
      url: createPageUrl("PeopleEngagement"),
      icon: Users,
    },
    {
      title: "Workflow Automation",
      url: createPageUrl("WorkflowBuilder"),
      icon: Zap,
    },
    {
      title: "Church Settings",
      url: createPageUrl("ChurchSettings"),
      icon: Church,
    },
    {
      title: "Theme Settings",
      url: createPageUrl("ThemeSettings"),
      icon: Palette,
    },
    {
      title: "Technical Settings",
      url: createPageUrl("Settings"),
      icon: Settings,
    },
    ];

  const superAdminPages = [
    {
      title: "Back Office",
      url: createPageUrl("BackOffice"),
      icon: Shield,
    },
    {
      title: "User Management",
      url: createPageUrl("UserManagement"),
      icon: UserCog,
    },
    {
      title: "Hardware Recommendations",
      url: createPageUrl("HardwareRecommendations"),
      icon: Package,
    },
    {
      title: "Testing Tasks",
      url: createPageUrl("TestingTasks"),
      icon: Shield,
    },
    {
      title: "Market Strategy",
      url: createPageUrl("MarketStrategy"),
      icon: BarChart3,
    },
    {
      title: "Competitive Analysis",
      url: createPageUrl("CompetitiveAnalysis"),
      icon: BarChart3,
    },
  ];

  const memberPages = [
    {
      title: "My Dashboard",
      url: createPageUrl("MemberDashboard"),
      icon: Church,
    },
    {
      title: "My Profile",
      url: createPageUrl("MyProfile"),
      icon: UserIcon,
    },
    {
      title: "My Donations",
      url: createPageUrl("MyDonations"),
      icon: DollarSign,
    },
    {
      title: "Manage Recurring Giving",
      url: createPageUrl("DonorPortal"),
      icon: Heart,
    },
    {
      title: "Announcements",
      url: createPageUrl("MemberAnnouncements"),
      icon: Megaphone,
    },
    {
      title: "Sermons",
      url: createPageUrl("MemberSermons"),
      icon: BookOpen,
    },
    {
      title: "Community Library",
      url: createPageUrl("Community"),
      icon: Users,
    },
    {
      title: "My Groups",
      url: createPageUrl("MyGroups"),
      icon: Users,
    },
    {
      title: "ReachMessager",
      url: createPageUrl("Messages"),
      icon: MessageSquare,
    },
    {
      title: "Forum",
      url: createPageUrl("Forum"),
      icon: MessageSquare,
    },
    {
      title: "Church Contacts",
      url: createPageUrl("MemberContacts"),
      icon: Mail,
    },
    {
      title: "Notification Settings",
      url: createPageUrl("NotificationSettings"),
      icon: Bell,
    },
    {
      title: "My Orders",
      url: createPageUrl("MyOrders"),
      icon: ShoppingCart,
    },
    ];

  let pages = [];
  if (currentUser) {
    if (currentUser.role === "admin") {
      // Filter out developer-only service planning pages for non-developers
      const isDeveloper = currentUser.email === "david@base44.app" || currentUser.developer_access;
      const developerOnlyPages = [
        "ServicePlanning",
        "ServiceCalendar", 
        "SongLibrary",
        "ServiceTemplates",
        "ServiceNotificationTemplates",
        "VolunteerScheduling"
      ];
      
      pages = isDeveloper 
        ? [...adminPages]
        : adminPages.filter(p => !developerOnlyPages.some(dev => p.url.includes(dev)));
      
      if (isDeveloper) {
        pages = [...pages, ...superAdminPages];
      }
    } else {
      pages = memberPages;
    }
  } else {
    pages = publicPages;
  }

  if (isLoadingUser && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <Church className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isPublicPage) {
    return (
      <>
        <Helmet>
          <meta name="google-site-verification" content="your-google-verification-code" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Public Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-[15.68px]">
              <Link to={createPageUrl("LandingPage")} className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/e2e85f6c7_REACHLOGOGIFF.png"
                  alt="REACH Church Connect Logo"
                  className="h-[154px] w-auto max-w-[480px] object-contain"
                />
              </Link>
              <div className="flex items-center gap-4">
                <Link to={createPageUrl("SubscriptionPlans")}>
                  <Button variant="ghost">Pricing</Button>
                </Link>
                {!currentUser && (
                  <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
                    Sign In
                  </Button>
                )}
                {currentUser && (
                  <Link to={currentUser.role === 'admin' ? createPageUrl("Dashboard") : createPageUrl("MemberDashboard")}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main>{children}</main>
        </div>
        </>
        );
        }

  if (!currentUser && !authError) {
        // User is not authenticated - redirect to login page with current page as next URL
        React.useEffect(() => {
          const currentPath = location.pathname;
          const nextUrl = window.location.origin + currentPath;
          base44.auth.redirectToLogin(nextUrl);
        }, [location.pathname]);

        // Show loading while redirecting
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="text-center space-y-6 p-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/e2e85f6c7_REACHLOGOGIFF.png"
                alt="REACH Church Connect Logo"
                className="h-32 w-auto max-w-[400px] mx-auto mb-4 object-contain"
              />
              <div>
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Redirecting to Sign In...</h1>
                <p className="text-slate-600">Please wait</p>
              </div>
            </div>
          </div>
        );
      }

  if (authError && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center space-y-6 p-8 max-w-md">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/e2e85f6c7_REACHLOGOGIFF.png"
            alt="REACH Church Connect Logo"
            className="h-32 w-auto max-w-[400px] mx-auto mb-4 object-contain"
          />
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Connection Issue</h2>
            <p className="text-red-700 mb-4">{authError}</p>
            <div className="space-y-3">
              <Button 
                onClick={handleRetry} 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Retry Connection
              </Button>
              <Button 
                onClick={() => window.location.href = createPageUrl("LandingPage")} 
                variant="outline"
                className="w-full"
              >
                Go to Home Page
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              If this problem persists, please check your internet connection or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="google-site-verification" content="your-google-verification-code" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-slate-200 shadow-xl
          transition-transform duration-300 ease-in-out z-40
          w-64
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200 flex-shrink-0">
            <Link
              to={currentUser?.role === 'admin' ? createPageUrl("Dashboard") : createPageUrl("MemberDashboard")}
              className="flex items-center gap-3 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/e2e85f6c7_REACHLOGOGIFF.png"
                alt="REACH Church Connect Logo"
                className="w-full max-w-[384px] h-auto group-hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1 pb-0">
            {currentUser.role !== 'admin' && (
              <Button
                onClick={() => {
                  const giveUrl = createPageUrl('PublicGiving');
                  window.open(giveUrl, '_blank');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full mb-4 bg-green-600 hover:bg-green-700"
              >
                <Heart className="w-5 h-5 mr-2" />
                Give Now
              </Button>
            )}
            
            {pages.map((page) => {
              const Icon = page.icon;
              const isActive = location.pathname === page.url;
              return (
                <Link
                  key={page.url}
                  to={page.url}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{page.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sticky bottom-0 p-4 border-t border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">
                    {currentUser.full_name ? currentUser.full_name[0].toUpperCase() : "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{currentUser.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Member'}
                  </p>
                </div>
              </div>
              <NotificationBell />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={confirmLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Logout</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={cancelLogout}>
                Cancel
              </Button>
              <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          />
          )}

          {/* Support Chat - Available to all authenticated users */}
          {currentUser && <SupportChatWidget />}

          {/* Floating Chat - Available on all authenticated pages */}
          {currentUser && <FloatingChat />}

          {/* PWA Features */}
          <PWAInstaller />
          <PushNotificationManager />
          <OfflineIndicator />
          <MobileNavBar userRole={currentUser?.role} />
          </div>
          </>
          );
          }