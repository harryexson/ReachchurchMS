import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Edit, Trash2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ResourceList({ resources, bookings, onRefetch, onBook }) {
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => {
      toast.success("Resource deleted");
      onRefetch();
    }
  });

  const statusColors = {
    available: "bg-green-100 text-green-700",
    in_use: "bg-blue-100 text-blue-700",
    maintenance: "bg-orange-100 text-orange-700",
    retired: "bg-slate-100 text-slate-700"
  };

  const typeIcons = {
    room: "🏠",
    equipment: "🎤",
    vehicle: "🚐",
    instrument: "🎹",
    technology: "💻"
  };

  const getUpcomingBooking = (resourceId) => {
    return bookings.find(b => 
      b.resource_id === resourceId && 
      new Date(b.start_datetime) > new Date() &&
      b.status !== 'cancelled'
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map(resource => {
        const upcomingBooking = getUpcomingBooking(resource.id);
        
        return (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeIcons[resource.resource_type]}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{resource.name}</h3>
                    <p className="text-sm text-slate-600">{resource.category}</p>
                  </div>
                </div>
                <Badge className={statusColors[resource.status]}>
                  {resource.status}
                </Badge>
              </div>

              {resource.description && (
                <p className="text-sm text-slate-600 mb-3">{resource.description}</p>
              )}

              {resource.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{resource.location}</span>
                </div>
              )}

              {upcomingBooking && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>Next: {new Date(upcomingBooking.start_datetime).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  onClick={() => onBook(resource)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={resource.status !== 'available'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(resource.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}