import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, X, Check, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadNotifications();
            const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    const loadUser = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const loadNotifications = async () => {
        try {
            const allNotifications = await base44.entities.Notification.filter({
                recipient_email: currentUser.email
            });

            const now = new Date();
            const validNotifications = allNotifications.filter(n => {
                if (!n.expires_at) return true;
                return new Date(n.expires_at) > now;
            }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 20);

            setNotifications(validNotifications);
            setUnreadCount(validNotifications.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const handleMarkAsRead = async (notification) => {
        try {
            await base44.entities.Notification.update(notification.id, {
                is_read: true,
                read_date: new Date().toISOString()
            });

            if (notification.action_url) {
                window.location.href = notification.action_url;
            }

            await loadNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.is_read);
            await Promise.all(
                unreadNotifications.map(n =>
                    base44.entities.Notification.update(n.id, {
                        is_read: true,
                        read_date: new Date().toISOString()
                    })
                )
            );
            await loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (notification, e) => {
        e.stopPropagation();
        try {
            await base44.entities.Notification.delete(notification.id);
            await loadNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            event: '📅',
            message: '✉️',
            subscription: '💳',
            announcement: '📢',
            donation: '💝',
            system: '⚙️',
            reminder: '⏰'
        };
        return icons[type] || '🔔';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'text-slate-600',
            normal: 'text-blue-600',
            high: 'text-orange-600',
            urgent: 'text-red-600'
        };
        return colors[priority] || 'text-slate-600';
    };

    if (!currentUser) return null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button size="sm" variant="ghost" onClick={handleMarkAllAsRead}>
                                <Check className="w-4 h-4 mr-1" />
                                Mark all read
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => window.location.href = createPageUrl('NotificationSettings')}>
                            <Settings className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                                        !notification.is_read ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => handleMarkAsRead(notification)}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={`font-medium text-sm ${getPriorityColor(notification.priority)}`}>
                                                    {notification.title}
                                                </h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                                    onClick={(e) => handleDelete(notification, e)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-2">
                                                {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}