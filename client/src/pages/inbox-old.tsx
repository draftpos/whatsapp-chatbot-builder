import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageSquare, 
  Search, 
  Send,
  Paperclip,
  MoreVertical,
  Edit,
  User,
  UserPlus,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  Smile,
  FileText,
  X,
  Phone,
  Video,
  Ban,
  Archive,
  Trash2,
  Star,
  Filter,
  MessageCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Conversation, Message, Contact, TeamMember } from "@shared/schema";

// Helper function to format last seen time
const formatLastSeen = (date: Date | string | null) => {
  if (!date) return "Never";
  
  const lastSeenDate = new Date(date);
  const now = new Date();
  const minutes = differenceInMinutes(now, lastSeenDate);
  const hours = differenceInHours(now, lastSeenDate);
  const days = differenceInDays(now, lastSeenDate);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return format(lastSeenDate, "MMM d, yyyy");
};

// Template Dialog Component
const TemplateDialog = ({ channelId, onSelectTemplate }: { 
  channelId?: string; 
  onSelectTemplate: (template: any) => void 
}) => {
  const { data: templates } = useQuery({
    queryKey: ["/api/templates", channelId],
    queryFn: () => api.getTemplates(channelId),
    enabled: !!channelId,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Send template">
          <FileText className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
          <DialogDescription>
            Choose a template to send to this contact
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {templates && Array.isArray(templates) && templates.length > 0 ? (
            <div className="space-y-3">
              {templates.filter((t: any) => t.status === 'approved').map((template: any) => (
                <Card 
                  key={template.id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    {template.header && (
                      <p className="text-sm font-medium text-gray-700">{template.header}</p>
                    )}
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.body}</p>
                    {template.footer && (
                      <p className="text-xs text-gray-500">{template.footer}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No templates available"
              description="Create approved templates to use them here"
              className="py-8"
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Team Assignment Dropdown Component
const TeamAssignDropdown = ({ conversationId, currentAssignee, onAssign }: {
  conversationId: string;
  currentAssignee?: string;
  onAssign: (assignedTo: string, assignedToName: string) => void;
}) => {
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          {currentAssignee ? "Reassign" : "Assign"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Assign to team member</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currentAssignee && (
          <>
            <DropdownMenuItem onClick={() => onAssign("", "")}>
              <User className="w-4 h-4 mr-2" />
              Unassign
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {users?.map((user: any) => (
          <DropdownMenuItem 
            key={user.id} 
            onClick={() => onAssign(user.id, `${user.firstName} ${user.lastName}`.trim() || user.username)}
          >
            <User className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>{user.firstName} {user.lastName}</span>
              <span className="text-xs text-gray-500">@{user.username}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function Inbox() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateParams, setTemplateParams] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activeChannel } = useQuery({
    queryKey: ["/api/channels/active"],
    queryFn: async () => {
      const response = await fetch("/api/channels/active");
      if (!response.ok) return null;
      return await response.json();
    },
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations", activeChannel?.id],
    queryFn: async () => {
      const response = await api.getConversations(activeChannel?.id);
      return await response.json();
    },
    enabled: !!activeChannel,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const response = await api.getMessages(selectedConversation.id);
      return await response.json();
    },
    enabled: !!selectedConversation?.id,
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts", activeChannel?.id],
    queryFn: async () => {
      const response = await api.getContacts(undefined, activeChannel?.id);
      return await response.json();
    },
    enabled: !!activeChannel,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      // Send message through conversation endpoint which uses WhatsApp API
      const response = await fetch(`/api/conversations/${data.conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content, fromUser: true }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setMessageText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendTemplateMutation = useMutation({
    mutationFn: async (data: { 
      conversationId: string; 
      templateName: string; 
      templateBody: string;
      phoneNumber: string;
    }) => {
      // Send template via WhatsApp API
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.phoneNumber,
          templateName: data.templateName,
          channelId: selectedConversation?.channelId
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send template");
      }
      
      // Refresh messages to show the sent template
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", data.conversationId, "messages"] });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Success",
        description: "Template sent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send template",
        variant: "destructive",
      });
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await fetch(`/api/conversations/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error('Failed to update conversation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Success",
        description: "Conversation updated successfully",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: messageText.trim(),
    });
  };

  const handleAssignConversation = (assignedTo: string, assignedToName: string) => {
    if (!selectedConversation) return;
    
    updateConversationMutation.mutate({
      id: selectedConversation.id,
      updates: { 
        assignedTo, 
        assignedToName,
        assignedAt: new Date().toISOString(),
        status: assignedTo ? "assigned" : "open" 
      }
    });
  };

  const filteredConversations = conversations?.filter((conv: Conversation) => {
    const statusMatch = filterStatus === "all" || conv.status === filterStatus;
    const contact = contacts?.find((c: Contact) => c.id === conv.contactId);
    const searchMatch = !searchQuery || 
      contact?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact?.phone.includes(searchQuery);
    return statusMatch && searchMatch;
  }) || [];

  const getContactInfo = (contactId: string) => {
    return contacts?.find((c: Contact) => c.id === contactId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  // Check if 24-hour window has passed
  const is24HourWindowExpired = (messages: Message[]) => {
    const lastIncomingMessage = messages
      .filter(m => m.direction === 'inbound' || m.direction === 'incoming')
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
    
    if (!lastIncomingMessage || !lastIncomingMessage.createdAt) return true;
    
    const lastMessageTime = new Date(lastIncomingMessage.createdAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceLastMessage = (currentTime - lastMessageTime) / (1000 * 60 * 60);
    
    return hoursSinceLastMessage > 24;
  };

  const getMessageStatus = (message: Message) => {
    if (!message.status || message.direction === 'inbound') return null;
    
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-green-100" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-green-100" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-300" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-300" />;
      default:
        return <Clock className="w-3 h-3 text-green-100" />;
    }
  };

  // Auto scroll to bottom on new messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark conversation as read when opening
  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.unreadCount && selectedConversation.unreadCount > 0) {
      fetch(`/api/conversations/${selectedConversation.id}/read`, {
        method: 'PUT',
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] });
      });
    }
  }, [selectedConversation?.id, selectedConversation?.unreadCount, queryClient]);

  // WebSocket connection for real-time messages
  useEffect(() => {
    if (!selectedConversation) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({
        type: 'join-conversation',
        conversationId: selectedConversation.id
      }));
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new-message') {
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations", selectedConversation.id, "messages"] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations"] 
        });
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [selectedConversation, queryClient]);

  if (conversationsLoading) {
    return (
      <div className="flex-1 dots-bg">
        <Header title="Team Inbox" subtitle="Loading conversations..." />
        <div className="p-6">
          <Loading size="lg" text="Loading inbox..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 dots-bg min-h-screen">
      <Header 
        title="Team Inbox" 
        subtitle="Real-time customer conversations"
      />

      <main className="p-6">
        <div className="h-[calc(100vh-200px)] flex gap-6">
          {/* Conversations List */}
          <Card className="w-96 flex flex-col">
            <CardHeader className="pb-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter conversations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conversations</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                {!filteredConversations.length ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No conversations"
                    description="Start chatting when customers message you"
                    className="py-12"
                  />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map((conversation: Conversation) => {
                      const contact = getContactInfo(conversation.contactId);
                      const isSelected = selectedConversation?.id === conversation.id;
                      
                      return (
                        <div
                          key={conversation.id}
                          className={cn(
                            "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                            isSelected && "bg-green-50 border-l-4 border-green-500"
                          )}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {contact?.name?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm truncate">
                                  {contact?.name || conversation.contactPhone || "Unknown"}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {conversation.lastMessageAt ? 
                                    format(new Date(conversation.lastMessageAt), "HH:mm") : ""}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {conversation.contactPhone}
                              </p>
                              {conversation.unreadCount && conversation.unreadCount > 0 && (
                                <Badge className="mt-1 bg-green-600 text-white text-xs">
                                  {conversation.unreadCount} new
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          {selectedConversation ? (
            <Card className="flex-1 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getContactInfo(selectedConversation.contactId)?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold">
                        {getContactInfo(selectedConversation.contactId)?.name || selectedConversation.contactPhone}
                      </h2>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">{selectedConversation.contactPhone}</p>
                        {selectedConversation.status === 'active' && (
                          <span className="text-xs text-green-600 font-medium">• Online</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TeamAssignDropdown
                      conversationId={selectedConversation.id}
                      currentAssignee={selectedConversation.assignedTo || undefined}
                      onAssign={handleAssignConversation}
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contact Information</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {getContactInfo(selectedConversation.contactId)?.name?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{getContactInfo(selectedConversation.contactId)?.name || "Unknown"}</h3>
                              <p className="text-sm text-gray-500">{selectedConversation.contactPhone}</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Email</span>
                              <span className="text-sm">{getContactInfo(selectedConversation.contactId)?.email || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Group</span>
                              <span className="text-sm">{getContactInfo(selectedConversation.contactId)?.group || "None"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Tags</span>
                              <span className="text-sm">{getContactInfo(selectedConversation.contactId)?.tags?.join(", ") || "None"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Created</span>
                              <span className="text-sm">
                                {getContactInfo(selectedConversation.contactId)?.createdAt ? 
                                  format(new Date(getContactInfo(selectedConversation.contactId)!.createdAt!), "MMM d, yyyy") : "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden" style={{ 
                backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACQSURBVHgBrZLBDYAgDEVbEkcwnuQGjmY2cAJHMBu4ATeQG3ADNpAbwA0kxRL5aYgx8ZKm/fd/S0sBwHuP2XzBYrVmEVLKSClFlFLYYDHGBJxzJIQgzjm0tonaWruOcpZl9yiKgkKI+3VdkyH43hhjKAzDpwfLskyapqnVQVVViOM4tqZpkuu6l23b3h6qqvoDXDpLPAKlE1cAAAAASUVORK5CYII=")',
                backgroundColor: '#e5ddd5'
              }}>
                <ScrollArea className="h-full p-4">
                  {messagesLoading ? (
                    <Loading text="Loading messages..." />
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-2">
                      {messages.map((message: Message, index: number) => {
                        const isAgent = message.fromUser === true;
                        const currentMessageDate = message.createdAt ? new Date(message.createdAt).toDateString() : '';
                        const previousMessageDate = index > 0 && messages[index - 1].createdAt 
                          ? new Date(messages[index - 1].createdAt).toDateString() 
                          : '';
                        const showDateSeparator = index === 0 || currentMessageDate !== previousMessageDate;
                        
                        return (
                          <div key={message.id}>
                            {showDateSeparator && message.createdAt && (
                              <div className="flex justify-center my-4">
                                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                  {format(new Date(message.createdAt), "MMMM d, yyyy")}
                                </span>
                              </div>
                            )}
                            <div
                              className={cn(
                                "flex",
                                message.direction === 'outbound' || message.direction === 'outgoing' ? "justify-end" : "justify-start"
                              )}
                            >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                                message.direction === 'outbound' || message.direction === 'outgoing'
                                  ? "bg-green-500 text-white rounded-br-sm" 
                                  : "bg-white text-gray-900 rounded-bl-sm border border-gray-200"
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                              <div className={cn(
                                "flex items-center gap-1 mt-1",
                                message.direction === 'outbound' || message.direction === 'outgoing' ? "justify-end" : "justify-start"
                              )}>
                                <span className={cn(
                                  "text-[10px]",
                                  message.direction === 'outbound' || message.direction === 'outgoing' ? "text-green-100" : "text-gray-500"
                                )}>
                                  {message.createdAt ? format(new Date(message.createdAt), "HH:mm") : ""}
                                </span>
                                {(message.direction === 'outbound' || message.direction === 'outgoing') && getMessageStatus(message)}
                              </div>
                            </div>
                          </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <EmptyState
                      icon={MessageSquare}
                      title="No messages yet"
                      description="Start a conversation with this contact"
                      className="h-full"
                    />
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                {messages && is24HourWindowExpired(messages) ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-800">24-hour window expired</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          You can only send template messages after 24 hours of customer's last message.
                          Use the template button to send approved WhatsApp templates.
                        </p>
                        <div className="mt-3">
                          <TemplateDialog 
                            channelId={selectedConversation.channelId || undefined}
                            onSelectTemplate={(template) => {
                              sendTemplateMutation.mutate({
                                conversationId: selectedConversation.id,
                                templateName: template.name,
                                templateBody: template.body || '',
                                phoneNumber: selectedConversation.contactPhone || '',
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <TemplateDialog 
                      channelId={selectedConversation.channelId || undefined}
                      onSelectTemplate={(template) => {
                        sendTemplateMutation.mutate({
                          conversationId: selectedConversation.id,
                          templateName: template.name,
                          templateBody: template.body || '',
                          phoneNumber: selectedConversation.contactPhone || '',
                        });
                      }}
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Add emoji"
                      onClick={() => {
                        // Simple emoji insertion
                        const emojis = ['😊', '👍', '❤️', '🎉', '👋'];
                        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                        setMessageText(prev => prev + emoji);
                      }}
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                    
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 resize-none"
                      rows={1}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation from the list to start chatting"
              />
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
