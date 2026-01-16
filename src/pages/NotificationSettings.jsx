import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Loader2, Save, MessageSquare, Calendar, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettings() {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            const prefs = await base44.entities.NotificationPreference.filter({
                user_email: user.email
            });

            if (prefs.length > 0) {
                setPreferences(prefs[0]);
            } else {
                setPreferences({
                    user_email: user.email,
                    user_name: user.full_name,
                    event_notifications: true,
                    message_notifications: true,
                    announcement_notifications: true,
                    sermon_notifications: true,
                    donation_notifications: true,
                    reminder_notifications: true,
                    reply_notifications: true,
                    event_reminder_hours: 24,
                    email_notifications: true,
                    digest_frequency: 'realtime'
                });
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (preferences.id) {
                await base44.entities.NotificationPreference.update(preferences.id, preferences);
            } else {
                const created = await base44.entities.NotificationPreference.create(preferences);
                setPreferences(created);
            }
            toast.success('Notification preferences saved successfully!');
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (field) => {
        setPreferences({ ...preferences, [field]: !preferences[field] });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const notificationTypes = [
        { key: 'announcement_notifications', label: 'Church Announcements', icon: '📢', description: 'Important church-wide announcements and updates' },
        { key: 'sermon_notifications', label: 'New Sermons', icon: '🎙️', description: 'Get notified when new sermons are posted' },
        { key: 'event_notifications', label: 'Event Updates', icon: '📅', description: 'Upcoming events, registrations, and changes' },
        { key: 'message_notifications', label: 'New Messages', icon: '✉️', description: 'New messages in Reach Messenger' },
        { key: 'reply_notifications', label: 'Message Replies', icon: '💬', description: 'When someone replies to your messages' },
        { key: 'donation_notifications', label: 'Giving Receipts', icon: '💝', description: 'Donation receipts and giving statements' },
        { key: 'reminder_notifications', label: 'Event Reminders', icon: '⏰', description: 'Reminders before events start' }
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Notification Settings</h1>
                    <p className="text-slate-600 mt-1">Manage how you receive notifications</p>
                </div>
            </div>

            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle>In-App Notifications</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {notificationTypes.map(type => (
                        <div key={type.key} className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3 flex-1">
                                <span className="text-2xl">{type.icon}</span>
                                <div>
                                    <Label className="text-base font-semibold">{type.label}</Label>
                                    <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                                </div>
                            </div>
                            <Switch
                                checked={preferences[type.key]}
                                onCheckedChange={() => handleToggle(type.key)}
                            />
                        </div>
                    ))}

                    {/* Event Reminder Timing */}
                    {preferences.reminder_notifications && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Label className="mb-2 block">Event Reminder Timing</Label>
                            <Select
                                value={preferences.event_reminder_hours?.toString() || '24'}
                                onValueChange={(val) => setPreferences({ ...preferences, event_reminder_hours: parseInt(val) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 hour before</SelectItem>
                                    <SelectItem value="3">3 hours before</SelectItem>
                                    <SelectItem value="6">6 hours before</SelectItem>
                                    <SelectItem value="24">24 hours before</SelectItem>
                                    <SelectItem value="48">2 days before</SelectItem>
                                    <SelectItem value="168">1 week before</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div>
                            <Label className="text-base font-semibold">Email Notifications</Label>
                            <p className="text-sm text-slate-600 mt-1">
                                Also send notifications to your email address: {currentUser?.email}
                            </p>
                        </div>
                        <Switch
                            checked={preferences.email_notifications}
                            onCheckedChange={() => handleToggle('email_notifications')}
                        />
                    </div>

                    <div>
                        <Label>Email Digest Frequency</Label>
                        <Select
                            value={preferences.digest_frequency}
                            onValueChange={(val) => setPreferences({ ...preferences, digest_frequency: val })}
                        >
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="realtime">Real-time (as they happen)</SelectItem>
                                <SelectItem value="daily">Daily Digest</SelectItem>
                                <SelectItem value="weekly">Weekly Summary</SelectItem>
                                <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Preferences
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}