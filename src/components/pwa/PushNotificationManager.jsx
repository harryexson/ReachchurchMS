import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff, CheckCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function PushNotificationManager() {
  const [permission, setPermission] = useState('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Check if already prompted
      const prompted = localStorage.getItem('notification-prompted');
      if (!prompted && Notification.permission === 'default') {
        // Show prompt after 30 seconds
        setTimeout(() => {
          setShowPrompt(true);
        }, 30000);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      alert('Push notifications are not supported in your browser');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowPrompt(false);
      localStorage.setItem('notification-prompted', 'true');

      if (result === 'granted') {
        // Save preference to user profile
        try {
          const user = await base44.auth.me();
          if (user) {
            await base44.entities.NotificationPreference.create({
              user_email: user.email,
              push_notifications_enabled: true,
              browser: navigator.userAgent,
              enabled_date: new Date().toISOString()
            });
          }
        } catch (e) {
          console.log('Could not save notification preference:', e);
        }

        // Show test notification
        new Notification('REACH Church Connect', {
          body: 'You will now receive important updates and announcements!',
          icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/2ca3c03b0_ReachLOGOEdited08_44_18AM.png',
          badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/2ca3c03b0_ReachLOGOEdited08_44_18AM.png',
          tag: 'welcome',
          requireInteraction: false
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompted', 'true');
  };

  if (!isSupported || permission === 'denied' || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <Card className="shadow-2xl border-2 border-purple-500">
          <CardContent className="p-6">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Stay Updated</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Get instant notifications for announcements, events, and messages
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={requestPermission}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Enable Notifications
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                  >
                    Not Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}