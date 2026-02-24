import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";
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
                                Zap,
                                Moon,
                                Sun
                              } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import FloatingChat from "@/components/messaging/FloatingChat";
import PWAInstaller from "@/components/pwa/PWAInstaller";
import PushNotificationManager from "@/components/pwa/PushNotificationManager";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import MobileNavBar from "@/components/pwa/MobileNavBar";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import AIChatbot from "@/components/support/AIChatbot";
import NativeHeader from "@/components/mobile/NativeHeader";
import PullToRefresh from "@/components/mobile/PullToRefresh";
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
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [churchBranding, setChurchBranding] = useState(null);

  const toggleTheme = () => setIsDark(!isDark);

  // CRITICAL: Define isPublicPage early - needed by useEffect hooks
  const isPublicPage = React.useMemo(() => 
    PUBLIC_PATHS.some(path => 
      location.pathname.toLowerCase().includes(path.toLowerCase()) || 
      currentPageName?.toLowerCase().includes(path.toLowerCase())
    ) || 
    currentPageName?.toLowerCase() === 'publicgiving' ||
    location.pathname.toLowerCase().includes('publicgiving') ||
    location.pathname.toLowerCase() === '/publicgiving',
    [location.pathname, currentPageName]
  );

  // CRITICAL: All hooks must be called before any conditional returns
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1e293b' : '#ffffff');
    }
  }, [isDark]);

  // CRITICAL: Fetch user data - must be called before any conditional rendering
  useEffect(() => {
    const fetchUser = async () => {
      const pathLower = location.pathname.toLowerCase();
      const pageLower = currentPageName?.toLowerCase() || '';

      // CRITICAL: Enhanced public page detection for donation pages
      const isPublicPageCheck = PUBLIC_PATHS.some(path => 
        pathLower.includes(path.toLowerCase()) || 
        pageLower.includes(path.toLowerCase())
      ) || 
      pageLower === 'publicgiving' ||
      pathLower.includes('publicgiving') ||
      pathLower === '/publicgiving';

      console.log('🔍 Auth Check:', { 
        path: location.pathname, 
        pageName: currentPageName, 
        isPublic: isPublicPageCheck 
      });

      try {
        const user = await base44.auth.me();
        console.log('✅ User authenticated:', user?.email, 'Role:', user?.role);

        // CRITICAL: Real-time updates for church settings changes made in back office
        if (user) {
          base44.entities.ChurchSettings.subscribe((event) => {
            if (event.data.church_admin_email === user.email) {
              console.log('🔄 Church settings updated in real-time:', event.type);
              setChurchBranding({
                logo_url: event.data.logo_url || "",
                church_name: event.data.church_name || "REACH Church Connect",
                primary_color: event.data.primary_color || "#3b82f6",
                secondary_color: event.data.secondary_color || "#10b981"
              });
            }
          });
        }

        if (user) {
          // CRITICAL: Check for developer/owner access IMMEDIATELY before ANYTHING else
          // harryexson@hotmail.com and david@base44.app are owner accounts with perpetual non-paying access
          const isDeveloper = user.email === "david@base44.app" || 
                         user.email === "harryexson@hotmail.com" || 
                         user.developer_access;

          if (isDeveloper) {
            console.log('👨‍💻 DEVELOPER/OWNER ACCOUNT:', user.email, '- FULL ACCESS GRANTED - SKIPPING ALL CHECKS');
            setCurrentUser(user);
            setAuthError(null);
            setIsLoadingUser(false);
            
            // Load church branding for developer
            try {
              const settings = await base44.entities.ChurchSettings.filter({
                created_by: user.email
              });
              if (settings.length > 0) {
                setChurchBranding({
                  logo_url: settings[0].logo_url,
                  church_name: settings[0].church_name,
                  primary_color: settings[0].primary_color || "#3b82f6",
                  secondary_color: settings[0].secondary_color || "#10b981"
                });
              }
            } catch (brandingError) {
              console.log('⚠️ Could not load branding, continuing anyway');
            }
            return; // EXIT IMMEDIATELY - NO FURTHER CHECKS
          }

          const urlParams = new URLSearchParams(location.search);
          const isUpgradeFlow = urlParams.get('upgrade') === 'true' || urlParams.get('expired') === 'true';

          // Update last login silently - don't block on this
          base44.auth.updateMe({
            last_login: new Date().toISOString()
          }).catch(() => {});

          // Allow subscription plans page if in upgrade flow
          if ((currentPageName?.toLowerCase() === 'subscriptionplans' || 
              location.pathname.toLowerCase().includes('subscriptionplans')) && isUpgradeFlow) {
            console.log('✅ Allowing subscription page access during upgrade flow');
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

              // If user has valid access, check onboarding (but NOT Stripe Connect to avoid redirect loops)
              if (hasValidAccess && user.role === 'admin' && !pageLower.includes('onboarding') && !pageLower.includes('adminonboarding')) {
                try {
                  // Check onboarding status only
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
                } catch (setupError) {
                  console.log('⚠️ Could not check onboarding status:', setupError.message);
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

          // Load church branding for authenticated users
          try {
            const settings = await base44.entities.ChurchSettings.filter({
              created_by: user.email
            });
            if (settings.length > 0) {
              console.log('✅ Church branding loaded:', settings[0].church_name);
              setChurchBranding({
                logo_url: settings[0].logo_url,
                church_name: settings[0].church_name,
                primary_color: settings[0].primary_color || "#3b82f6",
                secondary_color: settings[0].secondary_color || "#10b981"
              });
            } else {
              console.log('⚠️ No church settings found for:', user.email);
            }
          } catch (brandingError) {
            console.error('❌ Could not load church branding:', brandingError);
          }
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
        if (isPublicPageCheck) {
          console.log('✅ Public page - no authentication required');
          setCurrentUser(null);
          setAuthError(null);
          setIsLoadingUser(false);
          return;
        }

        console.error('❌ Auth error:', error.message, 'Path:', location.pathname);
        setAuthError(error.message || 'Authentication failed');
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    fetchUser();
  }, [location.pathname, currentPageName]);

  // Redirect authenticated users away from public pages
  React.useEffect(() => {
    if (currentUser && !isLoadingUser) {
      const isOnLandingPage = currentPageName?.toLowerCase() === 'landingpage' || location.pathname === '/';
      const isOnSubscriptionPage = currentPageName?.toLowerCase() === 'subscriptionplans' || location.pathname.toLowerCase().includes('subscriptionplans');
      const urlParams = new URLSearchParams(location.search);
      const isUpgradeFlow = urlParams.get('upgrade') === 'true' || urlParams.get('expired') === 'true';
      
      console.log('🔍 Redirect Check:', {
        isOnLandingPage,
        isOnSubscriptionPage,
        isUpgradeFlow,
        currentPath: location.pathname,
        userEmail: currentUser.email,
        userRole: currentUser.role
      });
      
      // Redirect authenticated users away from landing page
      if (isOnLandingPage) {
        console.log('🔀 Authenticated user on landing page - redirecting to dashboard');
        const dashboardUrl = currentUser.role === 'admin' ? createPageUrl('Dashboard') : createPageUrl('MemberDashboard');
        console.log('📍 Redirect target:', dashboardUrl);
        window.location.href = dashboardUrl;
        return;
      }
      // Allow subscription page only during upgrade flow
      else if (isOnSubscriptionPage && !isUpgradeFlow) {
        console.log('🔀 Authenticated user on subscription page without upgrade flow - redirecting to dashboard');
        const dashboardUrl = currentUser.role === 'admin' ? createPageUrl('Dashboard') : createPageUrl('MemberDashboard');
        console.log('📍 Redirect target:', dashboardUrl);
        window.location.href = dashboardUrl;
        return;
      }
      
      console.log('✅ No redirect needed - user on appropriate page');
    }
  }, [currentUser, isLoadingUser, currentPageName, location.pathname, location.search]);

  // CRITICAL: Handle login redirect - must be at top level before any conditional returns
  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const hasAuthParams = urlParams.has('code') || urlParams.has('state');
    const hasStripeParams = urlParams.has('session_id') || urlParams.has('checkout_session_id');
    
    console.log('🔐 Login Redirect Check:', {
      hasUser: !!currentUser,
      hasAuthError: !!authError,
      isLoading: isLoadingUser,
      isPublic: isPublicPage,
      hasAuthParams,
      hasStripeParams,
      currentPath: location.pathname
    });
    
    // CRITICAL: Only redirect if we're absolutely sure the user is not authenticated
    // AND we've finished loading AND we're not in the middle of an auth callback
    if (!currentUser && !authError && !isLoadingUser && !isPublicPage && !hasAuthParams && !hasStripeParams) {
      console.log('❌ User not authenticated - initiating login redirect');
      const timeoutId = setTimeout(() => {
        const currentPath = location.pathname;
        const nextUrl = window.location.origin + currentPath;
        console.log('🔀 Redirecting to login with next URL:', nextUrl);
        base44.auth.redirectToLogin(nextUrl);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentUser, authError, isLoadingUser, isPublicPage, location.pathname, location.search]);

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

  const handleRefresh = async () => {
    window.location.reload();
  };

  // Define primary dashboard routes (no back button on these)
  const primaryDashboardRoutes = [
    createPageUrl("Dashboard"),
    createPageUrl("MemberDashboard"),
    createPageUrl("LandingPage"),
    "/"
  ];

  const isPrimaryRoute = React.useMemo(() => 
    primaryDashboardRoutes.some(route => 
      location.pathname === route || location.pathname.toLowerCase() === route.toLowerCase()
    ), [location.pathname]
  );

  const getPageTitle = React.useCallback(() => {
    const pageName = currentPageName || "REACH Church Connect";
    return pageName.replace(/([A-Z])/g, ' $1').trim();
  }, [currentPageName]);

  const adminPages = React.useMemo(() => [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: Church,
    },
    {
      title: "Role Management",
      url: createPageUrl("RoleManagement"),
      icon: Shield,
    },
    {
      title: "User Role Assignment",
      url: createPageUrl("UserRoleAssignment"),
      icon: Shield,
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
    ], []);

  const superAdminPages = React.useMemo(() => [
    {
      title: "Back Office",
      url: createPageUrl("BackOffice"),
      icon: Shield,
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
  ], []);

  const memberPages = React.useMemo(() => [
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
    ], []);

  const pages = React.useMemo(() => {
    if (currentUser) {
      if (currentUser.role === "admin") {
        const isDeveloper = currentUser.email === "david@base44.app" || 
                           currentUser.email === "harryexson@hotmail.com" || 
                           currentUser.developer_access;
        const developerOnlyPages = [
          "ServicePlanning",
          "ServiceCalendar", 
          "SongLibrary",
          "ServiceTemplates",
          "ServiceNotificationTemplates",
          "VolunteerScheduling"
        ];
        
        let adminPagesFiltered = isDeveloper 
          ? [...adminPages]
          : adminPages.filter(p => !developerOnlyPages.some(dev => p.url.includes(dev)));
        
        if (isDeveloper) {
          adminPagesFiltered = [...adminPagesFiltered, ...superAdminPages];
        }
        return adminPagesFiltered;
      } else {
        return memberPages;
      }
    } else {
      return publicPages;
    }
  }, [currentUser, adminPages, superAdminPages, memberPages]);

  // All hooks MUST be called before any conditional returns
  // Conditional rendering starts here
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

  if (!currentUser && !authError && !isLoadingUser && !isPublicPage) {
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

  // CRITICAL: Ensure we have currentUser before rendering sidebar
  if (!currentUser) {
    console.log('⚠️ Rendering without currentUser - showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <Church className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering authenticated layout with sidebar for:', currentUser.email);

  return (
    <>
      <Helmet>
        <meta name="google-site-verification" content="your-google-verification-code" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Mobile Menu Toggle - Only visible on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* LEFT SIDEBAR NAVIGATION - Always visible on desktop, toggleable on mobile */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <Link
              to={currentUser?.role === 'admin' ? createPageUrl("Dashboard") : createPageUrl("MemberDashboard")}
              className="flex items-center gap-3 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {churchBranding?.logo_url ? (
                <img 
                  src={churchBranding.logo_url}
                  alt={churchBranding.church_name || "Church Logo"}
                  className="w-full max-w-[384px] h-auto max-h-32 object-contain group-hover:scale-105 transition-transform"
                />
              ) : (
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/e2e85f6c7_REACHLOGOGIFF.png"
                  alt="REACH Church Connect Logo"
                  className="w-full max-w-[384px] h-auto group-hover:scale-105 transition-transform"
                />
              )}
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
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{page.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sticky bottom-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-300 font-semibold">
                    {currentUser.full_name ? currentUser.full_name[0].toUpperCase() : "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{currentUser.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Member'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-slate-600 dark:text-slate-300"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <NotificationBell />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={confirmLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content area - offset by sidebar width on desktop */}
      <main className="min-h-screen transition-colors duration-200 lg:ml-64">
        {/* Mobile Native Header */}
        <div className="lg:hidden">
          <NativeHeader 
            title={getPageTitle()}
            showBack={!isPrimaryRoute}
            rightAction={<NotificationBell />}
          />
        </div>

        {/* Animated Page Transitions with Pull to Refresh */}
        <PullToRefresh onRefresh={handleRefresh}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
              className="page-enter-active"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </PullToRefresh>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Confirm Logout</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Are you sure you want to logout?</p>
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          />
          )}

          {/* AI Chatbot - Available to everyone (public and authenticated) */}
          <AIChatbot />

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