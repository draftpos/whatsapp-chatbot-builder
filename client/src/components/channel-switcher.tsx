import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Check, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useChannelContext } from "@/contexts/channel-context";
import type { Channel } from "@shared/schema";

export function ChannelSwitcher() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setSelectedChannel } = useChannelContext();

  // Fetch channels
  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  // Fetch active channel
  const { data: activeChannel } = useQuery<Channel>({
    queryKey: ["/api/channels/active"],
    retry: false,
  });

  // Set selected channel on mount and update context
  useEffect(() => {
    if (activeChannel && !selectedChannelId) {
      setSelectedChannelId(activeChannel.id);
      setSelectedChannel(activeChannel);
    }
  }, [activeChannel, selectedChannelId, setSelectedChannel]);

  // Update context when channel changes
  useEffect(() => {
    const channel = channels.find(c => c.id === selectedChannelId);
    if (channel) {
      setSelectedChannel(channel);
    }
  }, [selectedChannelId, channels, setSelectedChannel]);

  // Update channel mutation
  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // First, set all channels to inactive
      if (isActive) {
        await Promise.all(
          channels.map(async (channel) => {
            const response = await fetch(`/api/channels/${channel.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isActive: false }),
            });
            if (!response.ok) throw new Error("Failed to update channel");
            return response.json();
          })
        );
      }
      
      // Then set the selected channel as active
      const response = await fetch(`/api/channels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update channel");
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate and refetch all queries to refresh data for the new channel
      await queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/channels/active"] });
      
      // Force refetch all data-related queries
      queryClient.refetchQueries({ queryKey: ["/api/contacts"] });
      queryClient.refetchQueries({ queryKey: ["/api/campaigns"] });
      queryClient.refetchQueries({ queryKey: ["/api/templates"] });
      queryClient.refetchQueries({ queryKey: ["/api/conversations"] });
      queryClient.refetchQueries({ queryKey: ["/api/automations"] });
      queryClient.refetchQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/analytics"] });
      queryClient.refetchQueries({ queryKey: ["/api/templates"] });
      queryClient.refetchQueries({ queryKey: ["/api/conversations"] });
      queryClient.refetchQueries({ queryKey: ["/api/analytics"] });
      queryClient.refetchQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/automations"] });
      queryClient.refetchQueries({ queryKey: ["/api/messages"] });
      
      // Also invalidate any queries with these prefixes
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0] as string;
        return !!(key && (
          key.startsWith('/api/contacts') ||
          key.startsWith('/api/campaigns') ||
          key.startsWith('/api/templates') ||
          key.startsWith('/api/conversations') ||
          key.startsWith('/api/analytics') ||
          key.startsWith('/api/dashboard') ||
          key.startsWith('/api/automations') ||
          key.startsWith('/api/messages')
        ));
      }});
      
      toast({
        title: "Channel switched",
        description: "Active channel has been updated successfully.",
      });
    },
  });



  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId);
    updateChannelMutation.mutate({ id: channelId, isActive: true });
  };

  if (isLoading) {
    return <div className="w-48 h-9 bg-gray-100 animate-pulse rounded" />;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={selectedChannelId || ""} onValueChange={handleChannelChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select channel">
              {selectedChannelId && channels.find(c => c.id === selectedChannelId) ? (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="truncate">
                    {channels.find(c => c.id === selectedChannelId)?.name}
                  </span>
                </div>
              ) : (
                "Select channel"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{channel.name}</span>
                  {channel.isActive && <Check className="w-3 h-3 text-green-600 ml-auto" />}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLocation("/settings?tab=whatsapp")}
          title="Add new channel"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>


    </>
  );
}