import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Event } from "@/entities/Event";
import { EventRegistration } from "@/entities/EventRegistration";
import { Volunteer } from "@/entities/Volunteer";
import { Announcement } from "@/entities/Announcement"; // Added Announcement entity
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, PlusCircle, UserCheck, QrCode, ExternalLink, Copy, Megaphone, HandHeart, Mail, Download, MessageSquare, Star, Bell } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { createPageUrl } from "@/utils";
import EventForm from "../components/events/EventForm";
import AnnouncementForm from "../components/communications/AnnouncementForm"; // Import AnnouncementForm
import EventCalendar from "../components/events/EventCalendar";
import EventCheckIn from "../components/events/EventCheckIn";
import NameTagPrinter from "../components/events/NameTagPrinter";
import BulkEmailModal from "../components/contacts/BulkEmailModal";
import ReportExportModal from "../components/reports/ReportExportModal";
import EventPromotion from "../components/events/EventPromotion";
import EventDiscussionBoard from "../components/events/EventDiscussionBoard";
import EventFeedbackForm from "../components/events/EventFeedbackForm";
import EventCommunicationManager from "../components/events/EventCommunicationManager";
import EventInvitationManager from "../components/events/EventInvitationManager";
import EventQRCodeGenerator from "../components/events/EventQRCodeGenerator";

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [activeTab, setActiveTab] = useState("upcoming");
    
    // State for announcement form
    const [isAnnouncementFormOpen, setIsAnnouncementFormOpen] = useState(false);
    const [announcementToCreate, setAnnouncementToCreate] = useState(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState([]);
    const [emailSubject, setEmailSubject] = useState(""); // New state for email subject
    const [emailBody, setEmailBody] = useState("");     // New state for email body
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [showDiscussion, setShowDiscussion] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [discussionEvent, setDiscussionEvent] = useState(null);
    const [feedbackEvent, setFeedbackEvent] = useState(null);

    const [showCommunications, setShowCommunications] = useState(false);
    const [communicationsEvent, setCommunicationsEvent] = useState(null);
    const [showInvitationManager, setShowInvitationManager] = useState(false);
    const [selectedEventForInvite, setSelectedEventForInvite] = useState(null);
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeEvent, setQRCodeEvent] = useState(null);

    useEffect(() => {
        loadData();

        // CRITICAL: Real-time updates when events are added/modified in back office
        let unsubscribeEvents = null;
        let unsubscribeRegistrations = null;
        
        base44.auth.me().then(user => {
            if (user) {
                unsubscribeEvents = base44.entities.Event.subscribe((event) => {
                    if (event.data.created_by === user.email) {
                        console.log('🔄 Event updated in real-time:', event.type);
                        loadData();
                    }
                });

                unsubscribeRegistrations = base44.entities.EventRegistration.subscribe((event) => {
                    console.log('🔄 Event registration updated in real-time:', event.type);
                    loadData();
                });
            }
        }).catch(err => console.error('Error setting up event listeners:', err));

        return () => {
            if (unsubscribeEvents) unsubscribeEvents();
            if (unsubscribeRegistrations) unsubscribeRegistrations();
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Get current user to filter by organization
            const user = await base44.auth.me();
            
            const [eventsList, volunteersList, registrationsList] = await Promise.all([
                base44.entities.Event.filter({ created_by: user.email }, "-start_datetime"),
                base44.entities.Volunteer.filter({ created_by: user.email }),
                base44.entities.EventRegistration.list() // Keep all registrations for now
            ]);
            setEvents(eventsList);
            setVolunteers(volunteersList);
            setRegistrations(registrationsList);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const createRecurringEvents = async (templateData) => {
        const startDate = new Date(templateData.start_datetime);
        const endDate = new Date(templateData.recurrence_end_date);
        const events = [];
        
        // Calculate duration between start and end datetime
        const duration = templateData.end_datetime 
            ? new Date(templateData.end_datetime).getTime() - startDate.getTime()
            : 2 * 60 * 60 * 1000; // Default 2 hours if end_datetime not provided or invalid

        let currentDate = new Date(startDate); // Start from the initial event's start date
        let instanceCount = 0;
        const maxInstances = 52; // Safety limit (e.g., 1 year of weekly events)

        // Important: Reset time components of endDate to compare only dates for consistency
        endDate.setHours(23, 59, 59, 999);

        while (currentDate.getTime() <= endDate.getTime() && instanceCount < maxInstances) {
            // Ensure the instance's start date doesn't go past the recurrence end date
            if (currentDate.getTime() > endDate.getTime()) {
                break;
            }

            const eventData = {
                ...templateData,
                // Override specific fields for instances
                start_datetime: currentDate.toISOString(),
                end_datetime: new Date(currentDate.getTime() + duration).toISOString(),
                is_recurring: false, // Individual instances are not recurring
                parent_event_id: null, // As per outline, instances don't have a parent ID reference here.
                recurrence_pattern: 'none', // Instances are single events
                recurrence_end_date: null, // Instances don't have a recurrence end date
            };
            
            events.push(eventData);
            instanceCount++;

            // Calculate next occurrence based on pattern
            // Clone currentDate to modify for the next iteration without affecting the current eventData
            let nextDate = new Date(currentDate);

            switch (templateData.recurrence_pattern) {
                case 'every_sunday': // Sunday is 0
                    nextDate.setDate(nextDate.getDate() + 7); // Move to next week
                    while (nextDate.getDay() !== 0) nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'every_monday': // Monday is 1
                    nextDate.setDate(nextDate.getDate() + 7);
                    while (nextDate.getDay() !== 1) nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'every_tuesday': // Tuesday is 2
                    nextDate.setDate(nextDate.getDate() + 7);
                    while (nextDate.getDay() !== 2) nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'every_wednesday': // Wednesday is 3
                    nextDate.setDate(nextDate.getDate() + 7);
                    while (nextDate.getDay() !== 3) nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'every_thursday': // Thursday is 4
                    nextDate.setDate(nextDate.getDate() + 7);
                    while (nextDate.getDay() !== 4) nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'every_friday': // Friday is 5
                    nextDate.setDate(nextDate.getDate() + 7);
                    while (nextDate.getDay() !== 5) nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'every_saturday': // Saturday is 6
                    nextDate.setDate(nextDate.getDate() + 7);
                    while (nextDate.getDay() !== 6) nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'biweekly':
                    nextDate.setDate(nextDate.getDate() + 14);
                    break;
                case 'monthly':
                    // This method handles month rollovers correctly (e.g., Jan 31 + 1 month = Mar 2)
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
                default:
                    // If pattern is unknown or 'none' but is_recurring was true, default to weekly
                    nextDate.setDate(nextDate.getDate() + 7);
            }
            currentDate = nextDate; // Update currentDate for the next loop iteration
        }

        if (events.length > 0) {
            console.log(`Creating ${events.length} recurring event instances...`);
            await base44.entities.Event.bulkCreate(events);
            alert(`Successfully created ${events.length} recurring events!`);
        } else {
            alert('No recurring events were generated based on the pattern and end date.');
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            // Check if this is a recurring event
            if (data.is_recurring && data.recurrence_pattern !== 'none' && data.recurrence_end_date) {
                // Create multiple event instances
                await createRecurringEvents(data);
                await loadData();
            } else {
                // Create single event
                let savedEvent;
                if (selectedEvent && selectedEvent.id) {
                    savedEvent = await base44.entities.Event.update(selectedEvent.id, data);
                    alert('Event updated successfully!');
                } else {
                    savedEvent = await base44.entities.Event.create(data);
                    alert('Event created successfully!');
                }
                
                // Reload data immediately
                await loadData();
                
                // After creating/updating, prompt to create an announcement
                if (savedEvent && savedEvent.registration_required) {
                    const regUrl = `${window.location.origin}${createPageUrl('EventRegistration')}?eventId=${savedEvent.id}`;
                    const formattedDate = savedEvent.start_datetime ? format(new Date(savedEvent.start_datetime), 'MMMM d, yyyy') : 'N/A date';
                    const formattedTime = savedEvent.start_datetime ? format(new Date(savedEvent.start_datetime), 'h:mm a') : 'N/A time';
                    setAnnouncementToCreate({
                        title: `Upcoming Event: ${savedEvent.title}`,
                        message: `${savedEvent.description}\n\nJoin us on ${formattedDate} at ${formattedTime}.\n\nRegister here: ${regUrl}`,
                        category: 'event',
                        target_audience: 'all_members',
                    });
                    setIsAnnouncementFormOpen(true);
                }
            }

        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Error creating event: " + error.message);
        } finally {
            setIsFormOpen(false);
            setSelectedEvent(null);
        }
    };

    const handleEdit = (event) => {
        setSelectedEvent(event);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedEvent(null);
        setIsFormOpen(true);
    };

    const handleDuplicate = (eventToDuplicate) => {
        if (!eventToDuplicate) return;
        const { id, actual_attendance, ...restOfEvent } = eventToDuplicate;
        const newEventData = {
            ...restOfEvent,
            title: `${eventToDuplicate.title} (Copy)`,
            start_datetime: "",
            end_datetime: "",
            status: "planned",
        };
        setSelectedEvent(newEventData);
        setIsFormOpen(true);
    };

    const copyRegistrationLink = (eventId, type = 'attendee') => {
        if (!eventId) return;
        const page = type === 'volunteer' ? 'VolunteerRegistration' : 'EventRegistration';
        const url = `${window.location.origin}${createPageUrl(page)}?eventId=${eventId}`;
        navigator.clipboard.writeText(url);
        alert(`${type === 'volunteer' ? 'Volunteer sign-up' : 'Attendee registration'} link copied to clipboard!`);
    };

    const handleEmailEventInvites = async (event) => {
        // Get all registrations for this event
        const eventRegs = registrations.filter(r => r.event_id === event.id);
        const emails = eventRegs.map(r => r.registrant_email).filter(Boolean);
        const eventDate = event.start_datetime ? format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy') : 'soon';
        const eventTime = event.start_datetime ? format(new Date(event.start_datetime), 'h:mm a') : '';
        
        setEmailRecipients(emails);
        setEmailSubject(`Upcoming Event: ${event.title}`);
        setEmailBody(`Dear Friend,

We're excited to remind you about our upcoming event: ${event.title}

📅 When: ${eventDate}${eventTime ? ` at ${eventTime}` : ''}
📍 Where: ${event.location || 'Church Campus'}

${event.description || ''}

We're looking forward to seeing you there! If you have any questions, please don't hesitate to reach out.

Blessings,
REACH Church Team`);
        setIsEmailModalOpen(true);
    };

    const handleViewDiscussion = (event) => {
        setDiscussionEvent(event);
        setShowDiscussion(true);
    };

    const handleViewFeedback = (event) => {
        setFeedbackEvent(event);
        setShowFeedback(true);
    };

    const handleManageCommunications = (event) => {
        setCommunicationsEvent(event);
        setShowCommunications(true);
    };

    const now = new Date();
    const upcomingEvents = events.filter(event => event.start_datetime && isAfter(new Date(event.start_datetime), now)).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
    const pastEvents = events.filter(event => event.start_datetime && isBefore(new Date(event.start_datetime), now)).sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime));

    const eventTypeColors = {
        sunday_service: "bg-blue-100 text-blue-800",
        sunday_school: "bg-yellow-100 text-yellow-800", // Added
        kids_zone: "bg-pink-100 text-pink-800",       // Added
        bible_study: "bg-green-100 text-green-800",
        prayer_meeting: "bg-purple-100 text-purple-800",
        fellowship: "bg-orange-100 text-orange-800",
        outreach: "bg-red-100 text-red-800",
        special_event: "bg-pink-100 text-pink-800",
        conference: "bg-indigo-100 text-indigo-800",
        wedding: "bg-rose-100 text-rose-800",
        funeral: "bg-gray-100 text-gray-800",
        baptism: "bg-cyan-100 text-cyan-800"
    };

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Event Planning Center</h1>
                        <p className="text-slate-600 mt-1">Manage services, events, and registration coordination.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setIsExportModalOpen(true)} 
                            variant="outline"
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Schedule Event
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Upcoming Events</p>
                                    <p className="text-2xl font-bold text-slate-900">{upcomingEvents.length}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Active Volunteers</p>
                                    <p className="text-2xl font-bold text-slate-900">{volunteers.filter(v => v.status === 'active').length}</p>
                                </div>
                                <UserCheck className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Registrations</p>
                                    <p className="text-2xl font-bold text-slate-900">{registrations.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                        <TabsTrigger value="checkin">Event Check-in</TabsTrigger>
                        <TabsTrigger value="past">Past Events</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upcoming">
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Upcoming Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="p-4 rounded-lg border border-slate-100">
                                                <Skeleton className="h-4 w-1/3 mb-2" />
                                                <Skeleton className="h-3 w-1/2 mb-1" />
                                                <Skeleton className="h-3 w-1/4" />
                                            </div>
                                        ))
                                    ) : upcomingEvents.length > 0 ? (
                                        upcomingEvents.map((event) => {
                                            const eventRegistrations = registrations.filter(r => r.event_id === event.id);
                                            const checkedInCount = eventRegistrations.filter(r => r.checked_in).length;
                                            const regUrl = `${window.location.origin}${createPageUrl('EventRegistration')}?eventId=${event.id}`;
                                            
                                            return (
                                                <div key={event.id} className="p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors duration-200">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-slate-900">{event.title}</h3>
                                                            {event.linked_sermon_title && (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                                        📺 Linked to: {event.linked_sermon_title}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap">
                                                            <Badge className={eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-800'}>
                                                                {event.event_type?.replace('_', ' ')}
                                                            </Badge>
                                                            {event.average_rating && (
                                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                                                    ⭐ {event.average_rating.toFixed(1)}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-1 text-sm text-slate-600 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{event.start_datetime ? format(new Date(event.start_datetime), 'EEE, MMM d • h:mm a') : 'N/A'}</span>
                                                        </div>
                                                        {event.location && (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>{event.location}</span>
                                                            </div>
                                                        )}
                                                        {eventRegistrations.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4" />
                                                                <span>{eventRegistrations.length} registered • {checkedInCount} checked in</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                                                            Edit
                                                        </Button>
                                                        
                                                        {event.registration_required && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setQRCodeEvent(event);
                                                                        setShowQRCode(true);
                                                                    }}
                                                                    className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                                                >
                                                                    <QrCode className="w-4 h-4 mr-1" />
                                                                    QR Code & Share
                                                                </Button>

                                                                <EventPromotion event={event} registrationUrl={regUrl} />

                                                                {/* NEW: Communications Button */}
                                                                {eventRegistrations.length > 0 && (
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm"
                                                                        onClick={() => handleManageCommunications(event)}
                                                                        className="text-purple-700 border-purple-200 hover:bg-purple-50"
                                                                    >
                                                                        <Bell className="w-4 h-4 mr-1" />
                                                                        Communications
                                                                    </Button>
                                                                )}

                                                                {eventRegistrations.length > 0 && (
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm"
                                                                        onClick={() => handleEmailEventInvites(event)}
                                                                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                                                    >
                                                                        <Mail className="w-4 h-4 mr-1" />
                                                                        Email Registrants ({eventRegistrations.length})
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}

                                                         {event.require_volunteers && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => copyRegistrationLink(event.id, 'volunteer')}
                                                                className="text-orange-700 border-orange-200 hover:bg-orange-50 hover:text-orange-800"
                                                            >
                                                                <HandHeart className="w-4 h-4 mr-1" />
                                                                Copy Volunteer Link
                                                            </Button>
                                                        )}
                                                        {event.registration_required && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    const regUrl = `${window.location.origin}${createPageUrl('EventRegistration')}?eventId=${event.id}`;
                                                                    const formattedDate = event.start_datetime ? format(new Date(event.start_datetime), 'MMMM d, yyyy') : 'N/A date';
                                                                    const formattedTime = event.start_datetime ? format(new Date(event.start_datetime), 'h:mm a') : 'N/A time';
                                                                    setAnnouncementToCreate({
                                                                        title: `Reminder: ${event.title}`,
                                                                        message: `${event.description || 'No description provided.'}\n\nDon't forget to join us on ${formattedDate} at ${formattedTime}!\n\nRegister here if you haven't already: ${regUrl}`,
                                                                        category: 'event',
                                                                    });
                                                                    setIsAnnouncementFormOpen(true);
                                                                }}
                                                            >
                                                                <Megaphone className="w-4 h-4 mr-1" />
                                                                Create Announcement
                                                            </Button>
                                                        )}
                                                        {(eventRegistrations.length > 0 || event.require_volunteers) && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedEvent(event);
                                                                    setActiveTab("checkin");
                                                                }}
                                                            >
                                                                <QrCode className="w-4 h-4 mr-1" />
                                                                Check-in
                                                            </Button>
                                                        )}
                                                        {event.enable_discussion && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => handleViewDiscussion(event)}
                                                                className="text-purple-700 border-purple-200 hover:bg-purple-50"
                                                            >
                                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                                Discussion
                                                            </Button>
                                                        )}

                                                        {event.status === 'completed' && event.allow_feedback && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => handleViewFeedback(event)}
                                                                className="text-green-700 border-green-200 hover:bg-green-50"
                                                            >
                                                                <Star className="w-4 h-4 mr-1" />
                                                                Feedback {event.total_feedback_count ? `(${event.total_feedback_count})` : ''}
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleDuplicate(event)}
                                                        >
                                                            <Copy className="w-4 h-4 mr-1" />
                                                            Duplicate
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedEventForInvite(event);
                                                                setShowInvitationManager(true);
                                                            }}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                                        >
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            Send Invitations
                                                        </Button>
                                                    </div>

                                                    {event.description && (
                                                        <p className="text-sm text-slate-700 mt-2">{event.description}</p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p>No upcoming events scheduled</p>
                                            <p className="text-sm">Schedule your first event to get started</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="calendar">
                        <EventCalendar events={events} onEventSelect={handleEdit} />
                    </TabsContent>
                    
                    <TabsContent value="checkin">
                        {selectedEvent ? (
                            <div className="space-y-6">
                                <EventCheckIn event={selectedEvent} />
                                <NameTagPrinter event={selectedEvent} />
                            </div>
                        ) : (
                            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <CardContent className="text-center py-12">
                                    <QrCode className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500">Select an event from the "Upcoming Events" list to manage check-ins</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                    
                <TabsContent value="past">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Past Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pastEvents.length > 0 ? (
                                    pastEvents.map((event) => (
                                        <div key={event.id} className="p-4 rounded-lg border border-slate-100 opacity-80 hover:opacity-100 transition-opacity">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-slate-900">{event.title}</h3>
                                                <div className="flex gap-2">
                                                    <Badge className={eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-800'}>
                                                        {event.event_type?.replace('_', ' ')}
                                                    </Badge>
                                                    {event.actual_attendance && (
                                                        <Badge variant="outline">{event.actual_attendance} attended</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1 text-sm text-slate-600 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{event.start_datetime ? format(new Date(event.start_datetime), 'EEE, MMM d • h:mm a') : 'N/A'}</span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleDuplicate(event)}>
                                                <Copy className="w-4 h-4 mr-1" />
                                                Duplicate
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>No past events</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

                {isFormOpen && (
                    <EventForm
                        isOpen={isFormOpen}
                        setIsOpen={setIsFormOpen}
                        onSubmit={handleFormSubmit}
                        event={selectedEvent}
                        volunteers={volunteers}
                    />
                )}

                {isAnnouncementFormOpen && (
                    <AnnouncementForm
                        isOpen={isAnnouncementFormOpen}
                        setIsOpen={setIsAnnouncementFormOpen}
                        onSubmit={async (announcementData) => {
                            await base44.entities.Announcement.create(announcementData);
                            setIsAnnouncementFormOpen(false);
                            // Optionally, refresh communications data or show a success message
                        }}
                        announcement={announcementToCreate}
                    />
                )}
                {isEmailModalOpen && (
                    <BulkEmailModal
                        isOpen={isEmailModalOpen}
                        setIsOpen={setIsEmailModalOpen}
                        recipients={emailRecipients}
                        defaultSubject={emailSubject} // Added defaultSubject prop
                        defaultBody={emailBody}       // Added defaultBody prop
                        onSent={loadData}
                    />
                )}
                {isExportModalOpen && (
                    <ReportExportModal
                        isOpen={isExportModalOpen}
                        setIsOpen={setIsExportModalOpen}
                        reportType="events"
                    />
                )}
                
                {/* Discussion Board Modal */}
                {showDiscussion && discussionEvent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-semibold">{discussionEvent.title} - Discussion</h2>
                                <Button variant="outline" onClick={() => setShowDiscussion(false)}>Close</Button>
                            </div>
                            <div className="p-6">
                                <EventDiscussionBoard event={discussionEvent} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {showFeedback && feedbackEvent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-semibold">{feedbackEvent.title} - Feedback</h2>
                                <Button variant="outline" onClick={() => setShowFeedback(false)}>Close</Button>
                            </div>
                            <div className="p-6">
                                <EventFeedbackForm 
                                    event={feedbackEvent} 
                                    onSubmitted={() => {
                                        setShowFeedback(false);
                                        loadData();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Communications Manager Modal */}
                {showCommunications && communicationsEvent && (
                    <EventCommunicationManager
                        event={communicationsEvent}
                        registrations={registrations.filter(r => r.event_id === communicationsEvent.id)}
                        onClose={() => {
                            setShowCommunications(false);
                            loadData();
                        }}
                    />
                )}

                {/* Invitation Manager Modal */}
                {showInvitationManager && selectedEventForInvite && (
                    <EventInvitationManager
                        event={selectedEventForInvite}
                        onClose={() => {
                            setShowInvitationManager(false);
                            setSelectedEventForInvite(null);
                        }}
                    />
                )}

                {/* QR Code Modal */}
                {showQRCode && qrCodeEvent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-semibold">Registration QR Code & Sharing</h2>
                                <Button variant="outline" onClick={() => setShowQRCode(false)}>Close</Button>
                            </div>
                            <div className="p-6">
                                <EventQRCodeGenerator 
                                    event={qrCodeEvent}
                                    registrationUrl={`${window.location.origin}${createPageUrl('EventRegistration')}?eventId=${qrCodeEvent.id}`}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}