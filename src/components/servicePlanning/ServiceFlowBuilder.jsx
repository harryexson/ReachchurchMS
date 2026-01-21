import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@antml/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, GripVertical, Trash2, Edit, Music, Mic, Book, DollarSign, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import AddServiceItemModal from "./AddServiceItemModal";

export default function ServiceFlowBuilder({ servicePlanId, serviceItems, totalDuration }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const sortedItems = [...serviceItems].sort((a, b) => a.order_index - b.order_index);

  const deleteMutation = useMutation({
    mutationFn: (itemId) => base44.entities.ServiceItem.delete(itemId),
    onSuccess: () => {
      toast.success("Item removed");
      queryClient.invalidateQueries(['serviceItems', servicePlanId]);
    }
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(sortedItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all items
    for (let i = 0; i < items.length; i++) {
      await base44.entities.ServiceItem.update(items[i].id, { order_index: i + 1 });
    }

    queryClient.invalidateQueries(['serviceItems', servicePlanId]);
    toast.success("Order updated");
  };

  const iconMap = {
    song: Music,
    prayer: Mic,
    sermon: Book,
    offering: DollarSign,
    announcement: MessageSquare,
    scripture_reading: Book,
    communion: DollarSign,
    baptism: DollarSign,
    special_music: Music,
    video: MessageSquare,
    testimony: Mic,
    children_dismissal: MessageSquare,
    greeting: MessageSquare,
    benediction: Mic
  };

  const actualDuration = sortedItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
  const isOverTime = actualDuration > totalDuration;

  return (
    <div className="space-y-6">
      {/* Duration Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Service Duration</span>
            <span className={`text-sm font-semibold ${isOverTime ? 'text-red-600' : 'text-green-600'}`}>
              {actualDuration} / {totalDuration} minutes
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${isOverTime ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((actualDuration / totalDuration) * 100, 100)}%` }}
            ></div>
          </div>
          {isOverTime && (
            <p className="text-xs text-red-600 mt-1">⚠️ Service is running {actualDuration - totalDuration} minutes over time</p>
          )}
        </CardContent>
      </Card>

      {/* Service Items */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          {sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No items in service flow yet</h3>
              <p className="text-slate-600 mb-4">Add songs, prayers, sermons, and other elements</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="service-items">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {sortedItems.map((item, index) => {
                        const Icon = iconMap[item.item_type] || MessageSquare;
                        return (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-4 bg-white border-2 rounded-lg transition-all group ${
                                  snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'border-slate-200 hover:border-blue-300'
                                }`}
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                                  {index + 1}
                                </div>
                                <Icon className="w-5 h-5 text-slate-600" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                                    {item.song_key && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                        Key: {item.song_key}
                                      </span>
                                    )}
                                    {item.assigned_to && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                        {item.assigned_to}
                                      </span>
                                    )}
                                    {item.notes && (
                                      <FileText className="w-4 h-4 text-slate-400" title="Has notes" />
                                    )}
                                  </div>
                                  {item.notes && (
                                    <p className="text-sm text-slate-600 mt-1 bg-amber-50 p-2 rounded border border-amber-200">
                                      <strong>Notes:</strong> {item.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="text-sm font-medium text-slate-700">
                                  {item.duration_minutes} min
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingItem(item)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => deleteMutation.mutate(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
                className="w-full border-dashed border-2 py-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Item
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {(showAddModal || editingItem) && (
        <AddServiceItemModal
          servicePlanId={servicePlanId}
          editingItem={editingItem}
          nextOrderIndex={sortedItems.length + 1}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingItem(null);
            queryClient.invalidateQueries(['serviceItems', servicePlanId]);
          }}
        />
      )}
    </div>
  );
}