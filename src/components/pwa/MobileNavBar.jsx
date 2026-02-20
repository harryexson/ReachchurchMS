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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-700/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 md:hidden safe-area-inset-bottom">
      <div className="flex justify-around items-center h-20 relative px-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.url;
          const isGiveButton = item.label === "Give";

          // Center button (Give) gets special styling with pulse animation
          if (isGiveButton) {
            return (
              <Link
                key={item.url}
                to={item.url}
                className="absolute left-1/2 -translate-x-1/2 -top-6 z-50"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-green-400 opacity-30"
                  />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.4)] border-4 border-white">
                    <Icon className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex-1 flex flex-col items-center justify-center relative py-2 ${
                index === 2 ? 'invisible' : ''
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative z-10 flex flex-col items-center gap-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-1 bg-blue-600 rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <motion.div
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`p-2 rounded-xl transition-all ${
                    isActive ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                </motion.div>
                <motion.span
                  animate={{ 
                    fontSize: isActive ? "0.75rem" : "0.7rem",
                    fontWeight: isActive ? 600 : 500
                  }}
                  className={`transition-colors ${
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.label}
                </motion.span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}