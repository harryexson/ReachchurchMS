import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ThumbsUp, Send } from "lucide-react";

export default function EventFeedbackForm({ event, onSubmitted }) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState("");
    const [likedMost, setLikedMost] = useState("");
    const [suggestions, setSuggestions] = useState("");
    const [wouldAttendAgain, setWouldAttendAgain] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    React.useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);
        } catch (error) {
            console.error("Error loading user:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rating || !currentUser) {
            alert("Please provide a rating");
            return;
        }

        setIsSubmitting(true);
        try {
            await base44.entities.EventFeedback.create({
                event_id: event.id,
                event_title: event.title,
                attendee_name: currentUser.full_name,
                attendee_email: currentUser.email,
                rating,
                feedback_text: feedbackText,
                would_attend_again: wouldAttendAgain,
                liked_most: likedMost,
                suggestions,
                feedback_date: new Date().toISOString(),
                anonymous: false
            });

            // Update event's average rating
            const currentTotal = (event.average_rating || 0) * (event.total_feedback_count || 0);
            const newCount = (event.total_feedback_count || 0) + 1;
            const newAverage = (currentTotal + rating) / newCount;

            await base44.entities.Event.update(event.id, {
                average_rating: newAverage,
                total_feedback_count: newCount
            });

            alert("Thank you for your feedback!");
            if (onSubmitted) onSubmitted();
        } catch (error) {
            console.error("Error submitting feedback:", error);
            alert("Failed to submit feedback");
        }
        setIsSubmitting(false);
    };

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b">
                <CardTitle>Event Feedback</CardTitle>
                <p className="text-sm text-slate-600">Help us improve by sharing your experience</p>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div>
                        <Label className="mb-2 block">How would you rate this event? *</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${
                                            star <= (hoveredRating || rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-slate-300'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Overall Feedback */}
                    <div>
                        <Label htmlFor="feedback_text">Overall Feedback</Label>
                        <Textarea
                            id="feedback_text"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Share your thoughts about the event..."
                            rows={4}
                        />
                    </div>

                    {/* What did you like most */}
                    <div>
                        <Label htmlFor="liked_most">What did you like most?</Label>
                        <Textarea
                            id="liked_most"
                            value={likedMost}
                            onChange={(e) => setLikedMost(e.target.value)}
                            placeholder="e.g., the worship, message, atmosphere..."
                            rows={2}
                        />
                    </div>

                    {/* Suggestions */}
                    <div>
                        <Label htmlFor="suggestions">Suggestions for Improvement</Label>
                        <Textarea
                            id="suggestions"
                            value={suggestions}
                            onChange={(e) => setSuggestions(e.target.value)}
                            placeholder="How can we make this better?"
                            rows={2}
                        />
                    </div>

                    {/* Would Attend Again */}
                    <div>
                        <Label className="mb-2 block">Would you attend a similar event again?</Label>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant={wouldAttendAgain === true ? "default" : "outline"}
                                onClick={() => setWouldAttendAgain(true)}
                            >
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Yes
                            </Button>
                            <Button
                                type="button"
                                variant={wouldAttendAgain === false ? "default" : "outline"}
                                onClick={() => setWouldAttendAgain(false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={!rating || isSubmitting}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}