import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Search, 
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Ban,
  Archive,
  Trash2,
  Star,
  Filter,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  FileText,
  Smile,
  Mic,
  Image,
  X,
  Users,
  UserPlus,
  User as UserIcon,
  ChevronDown,
  Calendar,
  Tag,
  Forward,
  Reply,
  Download,
  Volume2
} from "lucide-react";
import { api } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMinutes, differenceInHours, differenceInDays, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Conversation, Contact, User } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

// Helper functions
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

const formatMessageDate = (date: Date | string) => {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) return "Today";
  if (isYesterday(messageDate)) return "Yesterday";
  return format(messageDate, "MMMM d, yyyy");
};

const getMessageStatusIcon = (status: string) => {
  switch (status) {
    case "sent":
      return <Check className="w-3 h-3 text-gray-400" />;
    case "delivered":
      return <CheckCheck className="w-3 h-3 text-gray-400" />;
    case "read":
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    default:
      return <Clock className="w-3 h-3 text-gray-400" />;
  }
};

// Conversation List Item Component
const ConversationListItem = ({ 
  conversation, 
  isSelected, 
  onClick ,
  user
}: { 
  conversation: Conversation & { contact?: Contact };
  isSelected: boolean;
  onClick: () => void;
}) => {
  const lastMessageTime = conversation.lastMessageAt 
    ? formatLastSeen(conversation.lastMessageAt)
    : "";


    function getMessagePreview(message: string | null | undefined): string {
      if (!message) {
        return ''; // or return 'No message' if you want a placeholder
      }
    
      if (message.length <= 40) {
        return message;
      } else {
        return message.substring(0, 40) + '...';
      }
    }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-colors border-b",
        isSelected 
          ? "bg-green-50 border-l-4 border-l-green-600" 
          : "hover:bg-gray-50"
      )}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-gray-200">
          {conversation.contactName?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-900 truncate">
            {user?.username === 'demouser'
              ? (
                  (conversation.contactName
                    ? conversation.contactName.slice(0, -1).replace(/./g, "*") +
                    conversation.contactName.slice(-1)
                    : conversation.contactPhone
                    ? conversation.contactPhone.slice(0, -4).replace(/\d/g, "*") +
                    conversation.contactPhone.slice(-4)
                    : "Unknown")
                )
              : (
                conversation.contactName ||
                conversation.contactPhone ||
                  "Unknown"
                )}
          </h4>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {lastMessageTime}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 truncate">
            {getMessagePreview(conversation.lastMessageText) || "No messages yet"}
          </p>
          {conversation.unreadCount && conversation.unreadCount > 0 && (
            <Badge className="ml-2 bg-green-600 text-white">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

interface Message {
  id: string;
  conversationId: string;
  whatsappMessageId?: string;
  fromUser: boolean;
  direction: string;
  content: string;
  type: string;
  messageType: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  status?: string;
  metadata?: {
    filePath?: string;
    fileSize?: number;
    mimeType?: string;
    originalName?: string;
  };
  createdAt: string;
}

const MessageItem = ({ 
  message, 
  showDate 
}: { 
  message: Message;
  showDate: boolean;
}) => {
  const isOutbound = message.direction === "outbound";
  
  const renderMediaContent = () => {
    // Check if message has media content
    const hasMedia = message.mediaId || message.mediaUrl;
    const messageType = message.messageType || message.type;
    
    // Use backend proxy for Facebook/WhatsApp URLs, direct URL for others
    const needsProxy = hasMedia && message.mediaUrl && message.mediaUrl.includes('lookaside.fbsbx.com');
    const mediaUrl = hasMedia 
      ? (needsProxy 
          ? `/api/messages/media-proxy?messageId=${message.id}` 
          : message.mediaUrl)
      : null;
    const downloadUrl = hasMedia 
      ? (needsProxy 
          ? `/api/messages/media-proxy?messageId=${message.id}&download=true` 
          : message.mediaUrl)
      : null;
    
    // Helper function to render text content
    const renderTextContent = () => {
      if (!message.content || 
          message.content === '[image]' || 
          message.content === '[video]' || 
          message.content === '[audio]' || 
          message.content === '[document]') {
        return null;
      }
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    };

    // Handle different message types
    switch (messageType) {
      case 'image':
        return (
          <div className="space-y-2">
            {hasMedia && (
              <div className="relative group">
                <button 
                  onClick={() => mediaUrl && window.open(mediaUrl, '_blank')}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      mediaUrl && window.open(mediaUrl, '_blank');
                    }
                  }}
                  className="max-w-[250px] max-h-[300px] rounded-lg object-cover cursor-pointer transition-opacity group-hover:opacity-90"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  <img 
                    src={mediaUrl || ''}
                    alt=""
                    className="max-w-[250px] max-h-[300px] rounded-lg object-cover"
                    onError={(e) => {
                      console.error('Failed to load image:', mediaUrl);
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                    }}
                  />
                </button>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}
            {renderTextContent()}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            {hasMedia && (
              <div className="relative">
                <video 
                  controls 
                  className="max-w-[250px] max-h-[300px] rounded-lg"
                  preload="metadata"
                  onError={(e) => {
                    console.error('Failed to load video:', mediaUrl);
                  }}
                >
                  <source src={`${mediaUrl}#t=0.1`} type={message.mediaMimeType} />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                  <Video className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
            {renderTextContent()}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-2">
            {hasMedia && (
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg min-w-[200px]",
                isOutbound ? "bg-green-700" : "bg-gray-200"
              )}>
                <div className={cn(
                  "p-2 rounded-full",
                  isOutbound ? "bg-green-800" : "bg-gray-300"
                )}>
                  <Volume2 className={cn(
                    "w-4 h-4",
                    isOutbound ? "text-white" : "text-gray-600"
                  )} />
                </div>
                <div className="flex-1">
                  <audio 
                    controls 
                    className="w-full h-8"
                    style={{ 
                      filter: isOutbound ? 'invert(1)' : 'none'
                    }}
                    onError={(e) => {
                      console.error('Failed to load audio:', mediaUrl);
                    }}
                  >
                    <source src={mediaUrl || ''} type={message.mediaMimeType} />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              </div>
            )}
            {renderTextContent()}
          </div>
        );

      case 'document':
        const fileName = message.metadata?.originalName || 
                  (message.metadata as { filePath?: string; fileSize?: number; mimeType?: string; originalName?: string; fileName?: string; }).fileName || 
                  'Document';
        const fileSize = message.metadata?.fileSize 
          ? `${Math.round(message.metadata.fileSize / 1024)} KB`
          : '';
        
        return (
          <div className="space-y-2">
            {hasMedia && (
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border",
                isOutbound 
                  ? "bg-green-700 border-green-600" 
                  : "bg-white border-gray-200"
              )}>
                <div className={cn(
                  "p-2 rounded-full",
                  isOutbound ? "bg-green-800" : "bg-blue-100"
                )}>
                  <FileText className={cn(
                    "w-5 h-5",
                    isOutbound ? "text-white" : "text-blue-600"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isOutbound ? "text-white" : "text-gray-900"
                  )}>
                    {fileName}
                  </p>
                  <div className="flex items-center space-x-2">
                    {fileSize && (
                      <p className={cn(
                        "text-xs",
                        isOutbound ? "text-green-100" : "text-gray-500"
                      )}>
                        {fileSize}
                      </p>
                    )}
                    {(message.mediaMimeType || message.metadata?.mimeType) && (
                      <p
                      className={cn(
                        "text-xs",
                        isOutbound ? "text-green-100" : "text-gray-500"
                      )}
                    >
                      {(
                        message.mediaMimeType ??
                        message.metadata?.mimeType ??
                        "FILE/UNKNOWN"
                      )
                        .split("/")[1]
                        ?.toUpperCase() || "FILE"}
                    </p>                    
                    )}
                  </div>
                </div>
                <a
                  href={downloadUrl || ''}
                  download={fileName}
                  className={cn(
                    "p-1 rounded-full hover:bg-opacity-80 transition-colors",
                    isOutbound ? "hover:bg-green-800" : "hover:bg-gray-100"
                  )}
                  onClick={(e) => e.stopPropagation()}
                  title="Download file"
                >
                  <Download className={cn(
                    "w-4 h-4",
                    isOutbound ? "text-white" : "text-gray-600"
                  )} />
                </a>
              </div>
            )}
            {renderTextContent()}
          </div>
        );

      case 'interactive':
        // Handle interactive messages (buttons/lists)
        interface MessageMetadata {
          filePath?: string;
          fileSize?: number;
          mimeType?: string;
          originalName?: string;
          buttons?: { id?: string; text: string }[]; // Add buttons property
        }

        const buttons = (message.metadata as MessageMetadata)?.buttons;
        return (
          <div className="space-y-3">
            {renderTextContent()}
            {buttons && buttons.length > 0 && (
              <div className="space-y-2">
                {buttons.map((button: { id?: string; text: string }, index: number) => (
                  <button
                    key={button.id || index}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors",
                      isOutbound 
                        ? "border-green-300 text-green-100 hover:bg-green-700" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => {
                      // Handle button click - you might want to emit an event or call a callback
                      console.log('Button clicked:', button);
                    }}
                  >
                    {button.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'template':
        return (
          <div className={cn(
            "flex items-start space-x-2 p-3 rounded border-l-4",
            isOutbound 
              ? "border-green-300 bg-green-700" 
              : "border-blue-400 bg-blue-50"
          )}>
            <div className="text-lg mt-1">📧</div>
            <div className="flex-1">
              <p className={cn(
                "text-xs font-medium mb-1",
                isOutbound ? "text-green-100" : "text-blue-700"
              )}>
                Template Message
              </p>
              {renderTextContent()}
            </div>
          </div>
        );

      case 'text':
      default:
        // Handle text messages that might also have media
        if (hasMedia) {
          // Determine media type from MIME type or URL
          const mimeType = message.mediaMimeType || message.metadata?.mimeType || '';
          const isImage = mimeType.startsWith('image/') || 
                         mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const isVideo = mimeType.startsWith('video/') || 
                         mediaUrl?.match(/\.(mp4|webm|ogg|mov)$/i);
          const isAudio = mimeType.startsWith('audio/') || 
                         mediaUrl?.match(/\.(mp3|wav|ogg|m4a)$/i);
          
          if (isImage) {
            return (
              <div className="space-y-2">
                <div className="relative group">
                  <button 
                    onClick={() => mediaUrl && window.open(mediaUrl, '_blank')} // Ensure mediaUrl is a valid string
                    className="max-w-[250px] max-h-[300px] rounded-lg object-cover cursor-pointer transition-opacity group-hover:opacity-90"
                    onError={(e) => {
                      console.error('Failed to load image:', mediaUrl);
                      // e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                    }}
                    onKeyDown={(e) => { // Add keyboard event listener for accessibility
                      if (e.key === 'Enter' || e.key === ' ') {
                        mediaUrl && window.open(mediaUrl, '_blank'); // Ensure mediaUrl is a valid string
                      }
                    }}
                    tabIndex={0} // Make the button focusable
                  >
                    <img 
                      src={mediaUrl || ''} // Ensure src is a string
                      alt="" // Remove redundant words from alt attribute
                    />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black bg-opacity-50 rounded-full p-2">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                {renderTextContent()}
              </div>
            );
          } else if (isVideo) {
            return (
              <div className="space-y-2">
                <div className="relative">
                  <video 
                    controls 
                    className="max-w-[250px] max-h-[300px] rounded-lg"
                    preload="metadata"
                    onError={(e) => {
                      console.error('Failed to load video:', mediaUrl);
                    }}
                  >
                    <source src={`${mediaUrl}#t=0.1`} type={mimeType} />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                </div>
                {renderTextContent()}
              </div>
            );
          } else if (isAudio) {
            return (
              <div className="space-y-2">
                <div className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg min-w-[200px]",
                  isOutbound ? "bg-green-700" : "bg-gray-200"
                )}>
                  <div className={cn(
                    "p-2 rounded-full",
                    isOutbound ? "bg-green-800" : "bg-gray-300"
                  )}>
                    <Volume2 className={cn(
                      "w-4 h-4",
                      isOutbound ? "text-white" : "text-gray-600"
                    )} />
                  </div>
                  <div className="flex-1">
                    <audio 
                      controls 
                      className="w-full h-8"
                      style={{ 
                        filter: isOutbound ? 'invert(1)' : 'none'
                      }}
                      onError={(e) => {
                        console.error('Failed to load audio:', mediaUrl);
                      }}
                    >
                        <source src={mediaUrl || ''} type={mimeType || ''} />
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                </div>
                {renderTextContent()}
              </div>
            );
          } else {
            // Generic file/document
            const fileName = message.metadata?.originalName || 
                            message.metadata?.originalName || 
                            'Attachment';
            const fileSize = message.metadata?.fileSize 
              ? `${Math.round(message.metadata.fileSize / 1024)} KB`
              : '';
            
            return (
              <div className="space-y-2">
                <div className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border",
                  isOutbound 
                    ? "bg-green-700 border-green-600" 
                    : "bg-white border-gray-200"
                )}>
                  <div className={cn(
                    "p-2 rounded-full",
                    isOutbound ? "bg-green-800" : "bg-blue-100"
                  )}>
                    <FileText className={cn(
                      "w-5 h-5",
                      isOutbound ? "text-white" : "text-blue-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isOutbound ? "text-white" : "text-gray-900"
                    )}>
                      {fileName}
                    </p>
                    <div className="flex items-center space-x-2">
                      {fileSize && (
                        <p className={cn(
                          "text-xs",
                          isOutbound ? "text-green-100" : "text-gray-500"
                        )}>
                          {fileSize}
                        </p>
                      )}
                      {mimeType && (
                        <p className={cn(
                          "text-xs",
                          isOutbound ? "text-green-100" : "text-gray-500"
                        )}>
                          {mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={downloadUrl || undefined}
                    download={fileName}
                    className={cn(
                      "p-1 rounded-full hover:bg-opacity-80 transition-colors",
                      isOutbound ? "hover:bg-green-800" : "hover:bg-gray-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    title="Download file"
                  >
                    <Download className={cn(
                      "w-4 h-4",
                      isOutbound ? "text-white" : "text-gray-600"
                    )} />
                  </a>
                </div>
                {renderTextContent()}
              </div>
            );
          }
        }
        
        // Pure text message
        return renderTextContent() || <p className="text-sm whitespace-pre-wrap">{message.content || ""}</p>;
    }
  };

  const formatMessageDate = (date: string | Date) => {
    return format(new Date(date), "MMMM d, yyyy");
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="text-xs">✓</span>;
      case 'delivered':
        return <span className="text-xs">✓✓</span>;
      case 'read':
        return <span className="text-xs text-blue-300">✓✓</span>;
      case 'failed':
        return <span className="text-xs text-red-300">✗</span>;
      default:
        return <span className="text-xs">○</span>;
    }
  };
  
  return (
    <>
      {showDate && (
        <div className="flex items-center justify-center my-4">
          <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
            {formatMessageDate(message.createdAt)}
          </div>
        </div>
      )}
      
      <div className={cn(
        "flex items-end gap-2 mb-4",
        isOutbound ? "justify-end" : "justify-start"
      )}>
        {!isOutbound && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gray-200 text-xs">C</AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOutbound 
            ? "bg-green-600 text-white rounded-br-sm" 
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        )}>
          {renderMediaContent()}
          
          <div className={cn(
            "flex items-center gap-1 mt-2",
            isOutbound ? "justify-end" : "justify-start"
          )}>
            <span className={cn(
              "text-xs",
              isOutbound ? "text-green-100" : "text-gray-500"
            )}>
              {format(new Date(message.createdAt), "h:mm a")}
            </span>
            {isOutbound && getMessageStatusIcon(message.status || "pending")}
          </div>
        </div>
      </div>
    </>
  );
};


// Template Dialog Component
const TemplateDialog = ({ 
  channelId, 
  onSelectTemplate 
}: { 
  channelId?: string; 
  onSelectTemplate: (template: any) => void;
}) => {
  const [open, setOpen] = useState(false);
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates", channelId],
    queryFn: async () => {
      const response = await api.getTemplates(channelId);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!channelId && open,
  });

  const approvedTemplates = templates.filter((t: any) => t.status === "APPROVED");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
          <DialogDescription>
            Choose from approved WhatsApp templates
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
            </div>
          ) : approvedTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved templates available
            </div>
          ) : (
            <div className="space-y-3">
              {approvedTemplates.map((template: any) => (
                <div
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template);
                    setOpen(false);
                  }}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{template.body}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};


// Team Assignment Dropdown Component
const TeamAssignDropdown = ({ conversationId, currentAssignee,currentAssigneeName, onAssign }: {
  conversationId: string;
  currentAssignee?: string;
  currentAssigneeName?: string;
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

  // console.log(currentAssignee , currentAssigneeName)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          {currentAssignee ? `Reassign (${currentAssigneeName})` : "Assign"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Assign to team member</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currentAssignee && (
          <>
            <DropdownMenuItem onClick={() => onAssign("", "")}>
              <UserIcon className="w-4 h-4 mr-2" />
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
            <UserIcon className="w-4 h-4 mr-2" />
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

// Main Component
export default function Inbox() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {user} = useAuth();

  // Fetch active channel
  const { data: activeChannel } = useQuery({
    queryKey: ["/api/channels/active"],
    queryFn: async () => {
      const response = await fetch("/api/channels/active");
      if (!response.ok) return null;
      return await response.json();
    },
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations", activeChannel?.id],
    queryFn: async () => {
      const response = await api.getConversations(activeChannel?.id);
      return await response.json();
    },
    enabled: !!activeChannel,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const response = await api.getMessages(selectedConversation.id);
      const data = await response.json();
      console.log('Fetched messages:', data);
      return data;
    },
    enabled: !!selectedConversation?.id,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/team/members"],
    enabled: !!selectedConversation,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Create WebSocket connection immediately
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // const wsUrl = `${protocol}//${window.location.host}/ws`;
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Join all conversations for updates
      ws.send(JSON.stringify({
        type: 'join-all-conversations'
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new-message') {
        // Refresh conversations list to update unread counts
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        
        // If the message is for the selected conversation, refresh messages
        if (selectedConversation && data.conversationId === selectedConversation.id) {
          queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation.id, "messages"] });
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  console.log("Query" , queryClient)

  // Join specific conversation when selected
  useEffect(() => {
    if (!selectedConversation || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Join the specific conversation for detailed updates
    wsRef.current.send(JSON.stringify({
      type: 'join-conversation',
      conversationId: selectedConversation.id
    }));
  }, [selectedConversation]); 

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update conversation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { conversationId: string; status: string }) => {
      const response = await fetch(`/api/conversations/${data.conversationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data.status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update status");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Success",
        description: "Conversation status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send template mutation
  const sendTemplateMutation = useMutation({
    mutationFn: async (data: { 
      conversationId: string; 
      templateName: string; 
      phoneNumber: string;
    }) => {
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
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] });
      toast({
        title: "Success",
        description: "Template sent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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

  const handleSelectTemplate = (template: any) => {
    if (!selectedConversation) return;
    
    sendTemplateMutation.mutate({
      conversationId: selectedConversation.id,
      templateName: template.name,
      phoneNumber: selectedConversation.contactPhone || "",
    });
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;
  
    const formData = new FormData();
    formData.append("media", file);
    formData.append("fromUser", "true");
    formData.append("conversationId", selectedConversation.id);
    formData.append("caption", messageText || ""); // optional text/caption
  
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        body: formData, // no headers! browser sets them
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send media");
      }
  
      const result = await response.json();
      toast({
        title: "Success",
        description: "Media sent successfully",
      });
  
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation.id, "messages"] });
      setMessageText("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  
    event.target.value = "";
  };
  

  const updateConversationStatus = (status: string) => {
    if (!selectedConversation) return;
    
    updateStatusMutation.mutate({
      conversationId: selectedConversation.id,
      status: status,
    });
  };

  const handleViewContact = () => {
    if (!selectedConversation || !selectedConversation.contactId) return;
    window.location.href = `/contacts?id=${selectedConversation.contactId}&phone=${selectedConversation.contactPhone || ""}`;
  };

  const handleArchiveChat = async () => {
    if (!selectedConversation) return;
    
    try {
      await apiRequest('PATCH', `/api/conversations/${selectedConversation.id}`, { status: 'archived' });
      
      toast({
        title: "Chat Archived",
        description: "This conversation has been archived",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive chat",
        variant: "destructive",
      });
    }
  };

  const handleBlockContact = async () => {
    if (!selectedConversation || !selectedConversation.contactId) return;
    
    try {
      await apiRequest('PATCH', `/api/contacts/${selectedConversation.contactId}`, { status: 'blocked' });
      
      toast({
        title: "Contact Blocked",
        description: "This contact has been blocked",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block contact",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedConversation) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this chat? This action cannot be undone.");
    if (!confirmed) return;
    
    try {
      await apiRequest('DELETE', `/api/conversations/${selectedConversation.id}`);
      
      toast({
        title: "Chat Deleted",
        description: "This conversation has been deleted",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    }
  };


  const updateConversationMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await fetch(`/api/conversations/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      const result = await response.json(); // parse JSON body

      if (!response.ok) {
        // Optionally log the server error message if provided
        console.error(result.error || 'Unknown error');
        throw new Error(result.error || 'Failed to update conversation');
      }
  console.log("Update conversation result:", result);
      return result;
    },
    onSuccess: (updatedConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(updatedConversation);
      toast({
        title: "Success",
        description: "Conversation updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });


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

  // Filter conversations  
  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch = conv.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.contactPhone?.includes(searchQuery);
    
    switch (filterTab) {
      case "unread":
        return matchesSearch && (conv.unreadCount || 0) > 0;
      case "open":
        return matchesSearch && conv.status === "open";
      case "resolved":
        return matchesSearch && conv.status === "resolved";
        case "assigned":
          return matchesSearch &&
                 conv.status === "assigned" &&
                 (user?.role === 'admin' || conv.assignedTo === user?.id);
      default:
        return matchesSearch;
    }
  });

  // Check if 24-hour window has passed
  const is24HourWindowExpired = selectedConversation?.lastMessageAt ? 
    differenceInHours(new Date(), new Date(selectedConversation.lastMessageAt)) > 24 : false;

  if (!activeChannel) {
    return (
      <div className="h-screen flex flex-col">
        <Header title="Team Inbox" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={MessageCircle}
            title="No Active Channel"
            description="Please select a channel from the channel switcher to view conversations."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header title="Team Inbox" />
      <div className="flex-1 flex bg-gray-50 overflow-hidden">
      
      {/* Conversations List */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col",
        selectedConversation ? "hidden md:flex md:w-80 lg:w-96" : "w-full x-5 md:w-80 lg:w-96"
      )}>
        {/* Search and Filter */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50"
            />
          </div>
          
          <Tabs value={filterTab} onValueChange={setFilterTab}>
            <TabsList className="grid w-full grid-cols-5 h-9">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="assigned" className="text-xs">Assigned</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              <TabsTrigger value="open" className="text-xs">Open</TabsTrigger>
              <TabsTrigger value="resolved" className="text-xs">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1 ">
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conversation: Conversation & { contact?: Contact }) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                user={user}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9"
                  onClick={() => setSelectedConversation(null)}
                  data-testid="button-back-conversations"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-200">
                    {(selectedConversation as any).contactName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {user?.username === 'demouser'
                      ? (
                          (selectedConversation?.contactName
                            ? selectedConversation.contactName.slice(0, -1).replace(/./g, "*") +
                              selectedConversation.contactName.slice(-1)
                            : selectedConversation?.contactPhone
                            ? selectedConversation.contactPhone.slice(0, -4).replace(/\d/g, "*") +
                              selectedConversation.contactPhone.slice(-4)
                            : "Unknown")
                        )
                      : (
                          (selectedConversation as any)?.contactName ||
                          selectedConversation?.contactPhone ||
                          "Unknown"
                        )}
                  </h3>


                    <Badge 
                      variant={selectedConversation.status === 'resolved' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {selectedConversation.status || 'open'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {user?.username === 'demouser'
                      ? (
                          selectedConversation?.contact?.phone
                            ? selectedConversation.contact.phone.slice(0, -4).replace(/\d/g, "*") +
                              selectedConversation.contact.phone.slice(-4)
                            : selectedConversation?.contactPhone
                            ? selectedConversation.contactPhone.slice(0, -4).replace(/\d/g, "*") +
                              selectedConversation.contactPhone.slice(-4)
                            : ""
                        )
                      : (
                          selectedConversation?.contact?.phone ||
                          selectedConversation?.contactPhone ||
                          ""
                        )}
                  </p>

                </div>
              </div>

              <div className="flex items-center gap-2">
              {user?.username !== 'demouser' && selectedConversation.assignedTo !== user?.id ? (
                <TeamAssignDropdown
                  conversationId={selectedConversation.id}
                  currentAssignee={selectedConversation.assignedTo || undefined}
                  currentAssigneeName={selectedConversation?.assignedToName || undefined}
                  onAssign={handleAssignConversation}
                />
              ) : (
                <button
                  type="button"
                  className="text-sm text-gray-700 px-4 py-2 w-full text-left hover:bg-gray-100"
                  disabled
                >
                  Assign to team member
                </button>
              )}

              
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuItem  disabled={user?.username === 'demouser'} onClick={() => updateConversationStatus('open')}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Mark as Open
                    </DropdownMenuItem>
                    <DropdownMenuItem  disabled={user?.username === 'demouser'} onClick={() => updateConversationStatus('resolved')}>
                      <Check className="mr-2 h-4 w-4" />
                      Mark as Resolved
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem  onClick={() => handleViewContact()}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      View Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem   disabled={user?.username === 'demouser'} onClick={() => handleArchiveChat()}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem  disabled={user?.username === 'demouser'} onClick={() => handleBlockContact()}>
                      <Ban className="mr-2 h-4 w-4" />
                      Block Contact
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem  disabled={user?.username === 'demouser'} className="text-red-600" onClick={() => handleDeleteChat()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlMGUwZTAiIG9wYWNpdHk9IjAuMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')]">
            <div className="min-h-full">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading />
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((message: Message, index: number) => {
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showDate = !prevMessage || 
                      !isToday(new Date(message.createdAt || new Date())) ||
                      (prevMessage && !isToday(new Date(prevMessage.createdAt || new Date())));
                    
                    return (
                      <MessageItem
                        key={message.id}
                        message={message}
                        showDate={showDate}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-3 md:p-4">
            {is24HourWindowExpired && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">24-hour window expired</p>
                    <p className="text-yellow-700">You can only send template messages now</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-end gap-1 md:gap-2">
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={handleFileAttachment} disabled={user?.username === 'demouser'}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach File</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
{user?.username === 'demouser' ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" disabled>
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Templates disabled for demo user</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (

                <TemplateDialog
                  channelId={activeChannel?.id}
                  onSelectTemplate={handleSelectTemplate}
                />)}
              </div>

              <Input
                placeholder={is24HourWindowExpired ? "Templates only" : "Type a message..."}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={user?.username === 'demouser'? true : is24HourWindowExpired}
                className="flex-1"
              />

              <Button
                onClick={handleSendMessage}
                disabled={user?.username === 'demouser'? true : (!messageText.trim() || is24HourWindowExpired || sendMessageMutation.isPending)}
                size="icon"
                className="h-8 w-8 md:h-9 md:w-9 bg-green-600 hover:bg-green-700"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}