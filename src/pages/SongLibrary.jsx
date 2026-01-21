import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Music, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AddSongModal from "@/components/servicePlanning/AddSongModal";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function SongLibrary() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['songLibrary'],
    queryFn: () => base44.entities.SongLibrary.list('-times_used'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SongLibrary.delete(id),
    onSuccess: () => {
      toast.success("Song deleted");
      queryClient.invalidateQueries(['songLibrary']);
    }
  });

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Song Library</h1>
            <p className="text-slate-600">Manage songs and arrangements</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Add Song
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSongs.map(song => (
            <Card key={song.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{song.title}</h3>
                      {song.artist && (
                        <p className="text-sm text-slate-600">{song.artist}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {song.default_key && (
                    <Badge variant="outline" className="text-xs">Key: {song.default_key}</Badge>
                  )}
                  {song.tempo && (
                    <Badge variant="outline" className="text-xs">{song.tempo}</Badge>
                  )}
                  {song.default_duration_minutes && (
                    <Badge variant="outline" className="text-xs">{song.default_duration_minutes} min</Badge>
                  )}
                </div>

                {song.tags && song.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {song.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-slate-500 mb-3">
                  Used {song.times_used || 0} times
                  {song.last_used_date && ` • Last: ${new Date(song.last_used_date).toLocaleDateString()}`}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingSong(song);
                      setShowAddModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(song.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showAddModal && (
        <AddSongModal
          editingSong={editingSong}
          onClose={() => {
            setShowAddModal(false);
            setEditingSong(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingSong(null);
            queryClient.invalidateQueries(['songLibrary']);
          }}
        />
      )}
    </div>
  );
}