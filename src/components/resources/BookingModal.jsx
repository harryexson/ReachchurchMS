import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function BookingModal({ resource, existingBookings, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    resource_id: resource?.id || "",
    resource_name: resource?.name || "",
    booking_type: "other",
    booked_by: "",
    booked_by_email: "",
    start_datetime: "",
    end_datetime: "",
    purpose: "",
    setup_notes: "",
    status: "confirmed"
  });
  const [loading, setLoading] = useState(false);
  const [conflict, setConflict] = useState(null);

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
    enabled: !resource
  });

  const { data: servicePlans = [] } = useQuery({
    queryKey: ['servicePlans'],
    queryFn: () => base44.entities.ServicePlan.list(),
  });

  useEffect(() => {
    if (formData.start_datetime && formData.end_datetime && formData.resource_id) {
      checkConflict();
    }
  }, [formData.start_datetime, formData.end_datetime, formData.resource_id]);

  const checkConflict = () => {
    const start = new Date(formData.start_datetime);
    const end = new Date(formData.end_datetime);

    const conflicting = existingBookings.find(booking => {
      if (booking.resource_id !== formData.resource_id || booking.status === 'cancelled') return false;
      
      const bookingStart = new Date(booking.start_datetime);
      const bookingEnd = new Date(booking.end_datetime);
      
      return (start < bookingEnd && end > bookingStart);
    });

    setConflict(conflicting || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (conflict) {
      toast.error("Cannot book - time slot conflicts with existing booking");
      return;
    }

    setLoading(true);

    try {
      await base44.entities.ResourceBooking.create(formData);
      toast.success("Resource booked successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create booking");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">Book Resource</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!resource && (
            <div>
              <Label>Resource *</Label>
              <select
                value={formData.resource_id}
                onChange={(e) => {
                  const selected = resources.find(r => r.id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    resource_id: e.target.value,
                    resource_name: selected?.name || ""
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select a resource</option>
                {resources.filter(r => r.status === 'available').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>Booking Type *</Label>
            <select
              value={formData.booking_type}
              onChange={(e) => setFormData({ ...formData, booking_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="service">Service</option>
              <option value="event">Event</option>
              <option value="meeting">Meeting</option>
              <option value="rehearsal">Rehearsal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {formData.booking_type === 'service' && (
            <div>
              <Label>Link to Service Plan</Label>
              <select
                value={formData.service_plan_id}
                onChange={(e) => setFormData({ ...formData, service_plan_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select service plan</option>
                {servicePlans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Booked By *</Label>
              <Input
                value={formData.booked_by}
                onChange={(e) => setFormData({ ...formData, booked_by: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.booked_by_email}
                onChange={(e) => setFormData({ ...formData, booked_by_email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                required
              />
            </div>
          </div>

          {conflict && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Booking Conflict</p>
                  <p className="text-sm text-red-700 mt-1">
                    This resource is already booked from {new Date(conflict.start_datetime).toLocaleString()} 
                    to {new Date(conflict.end_datetime).toLocaleString()}
                  </p>
                  <p className="text-sm text-red-600 mt-1">Purpose: {conflict.purpose}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Purpose *</Label>
            <Input
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="What is this booking for?"
              required
            />
          </div>

          <div>
            <Label>Setup Notes</Label>
            <Textarea
              value={formData.setup_notes}
              onChange={(e) => setFormData({ ...formData, setup_notes: e.target.value })}
              placeholder="Any special setup requirements"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !!conflict} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Booking..." : "Book Resource"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}