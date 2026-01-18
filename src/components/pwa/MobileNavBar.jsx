import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Calendar, Heart, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";

export default function MobileNavBar({ userRole = "member" }) {
  const location = useLocation();

  const memberNav = [
    { icon: Home, label: "Home", url: createPageUrl("MemberDashboard") },
    { icon: Calendar, label: "Events", url: createPageUrl("PublicEventsCalendar") },
    { icon: Heart, label: "Give", url: createPageUrl("PublicGiving") },
    { icon: MessageSquare, label: "Messages", url: createPageUrl("Messages") },
    { icon: User, label: "Profile", url: createPageUrl("MyProfile") }
  ];

  const adminNav = [
    { icon: Home, label: "Dashboard", url: createPageUrl("Dashboard") },
    { icon: Calendar, label: "Events", url: createPageUrl("Events") },
    { icon: Heart, label: "Giving", url: createPageUrl("Giving") },
    { icon: MessageSquare, label: "Messages", url: createPageUrl("AdminMessaging") },
    { icon: User, label: "Members", url: createPageUrl("Members") }
  ];

  const navItems = userRole === "admin" ? adminNav : memberNav;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40 md:hidden">
      <div className="flex justify-around items-center h-20 relative">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.url;
          const isGiveButton = item.label === "Give";

          // Center button (Give) gets special styling
          if (isGiveButton) {
            return (
              <Link
                key={item.url}
                to={item.url}
                className="absolute left-1/2 -translate-x-1/2 -top-5 z-50"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl border-4 border-white"
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex-1 flex flex-col items-center justify-center relative ${
                index === 2 ? 'invisible' : ''
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-50"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-6 h-6 mb-1 ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-blue-600" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}