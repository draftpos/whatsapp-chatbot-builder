import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Clock, 
  FileText, 
  MessageCircle, 
  Hash,
  Trash2,
  X,
  Save,
  Reply,
  Timer,
  Users,
  FileCheck,
  Zap,
  Download,
  Share2,
  Eye,
  ArrowLeft,
  Settings,
  ChevronRight,
  Plus,
  Maximize2,
  Home,
  PenTool
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AutomationNode {
  id: string;
  type: "user_reply" | "time_gap" | "send_template" | "custom_reply" | "keyword_catch";
  position: number;
  config: any;
  nextNodeId?: string | null;
}

interface AutomationFlowBuilderProps {
  automation?: any;
  onClose: () => void;
}

const operationCards = [
  {
    title: "Send a message",
    description: "With no response required from visitor",
    icon: <MessageCircle className="h-5 w-5" />,
    color: "bg-orange-500",
    category: "message"
  },
  {
    title: "Ask a question",
    description: "Get question and save user input in server",
    icon: <Reply className="h-5 w-5" />,
    color: "bg-orange-400",
    category: "question"
  },
  {
    title: "Set a condition",
    description: "Send message(s) based on logical condition(s)",
    icon: <Settings className="h-5 w-5" />,
    color: "bg-yellow-400",
    category: "condition"
  },
  {
    title: "Subscribe",
    description: "",
    icon: <Users className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "subscribe"
  },
  {
    title: "Unsubscribe",
    description: "",
    icon: <Users className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "unsubscribe"
  },
  {
    title: "Update Attribute",
    description: "",
    icon: <PenTool className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "attribute"
  },
  {
    title: "Set tags",
    description: "",
    icon: <Hash className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "tags"
  },
  {
    title: "Assign Team",
    description: "",
    icon: <Users className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "team"
  },
  {
    title: "Assign User",
    description: "",
    icon: <Users className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "user"
  },
  {
    title: "Trigger Chatbot",
    description: "",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "chatbot"
  },
  {
    title: "Update Chat Status",
    description: "",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "status"
  },
  {
    title: "Template",
    description: "",
    icon: <FileText className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "template"
  },
  {
    title: "Time Delay",
    description: "",
    icon: <Clock className="h-5 w-5" />,
    color: "bg-gray-400",
    category: "delay"
  }
];

export default function AutomationFlowBuilder({ automation, onClose }: AutomationFlowBuilderProps) {
  const [name, setName] = useState(automation?.name || "Doctor Appointment");
  const [nodes, setNodes] = useState<AutomationNode[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch templates for template selection
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates"],
  });

  // Load existing automation data
  useEffect(() => {
    if (automation?.id) {
      fetch(`/api/automations/${automation.id}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.nodes) {
            setNodes(data.nodes.sort((a: any, b: any) => a.position - b.position));
          }
        });
    }
  }, [automation]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = automation?.id 
        ? `/api/automations/${automation.id}`
        : "/api/automations";
      const method = automation?.id ? "PUT" : "POST";
      
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({ title: automation?.id ? "Automation updated" : "Automation created" });
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to save automation",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const automationData = {
      automation: {
        name,
        description: "",
        trigger: "new_conversation",
        triggerConfig: {},
        status: automation?.status || "active",
      },
      nodes: nodes.map((node, index) => ({
        id: node.id,
        type: node.type,
        position: index,
        config: node.config,
        nextNodeId: nodes[index + 1]?.id || null,
      })),
    };

    saveMutation.mutate(automationData);
  };

  const addNode = (type: AutomationNode["type"], config: any = {}) => {
    const newNode: AutomationNode = {
      id: `node-${Date.now()}`,
      type,
      position: nodes.length,
      config: config || getDefaultConfig(type),
    };

    setNodes([...nodes, newNode]);
    setSelectedOperation(null);
  };

  const getDefaultConfig = (type: AutomationNode["type"]) => {
    switch (type) {
      case "user_reply":
        return { question: "", saveAs: "" };
      case "time_gap":
        return { delay: 60 };
      case "send_template":
        return { templateId: "", variables: [] };
      case "custom_reply":
        return { message: "" };
      case "keyword_catch":
        return { keywords: [], action: "continue" };
      default:
        return {};
    }
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, config } : node
    ));
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId).map((n, i) => ({ ...n, position: i })));
  };

  const renderNodeContent = (node: AutomationNode) => {
    switch (node.type) {
      case "custom_reply":
        return (
          <div className="bg-orange-500 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Message
              </span>
              <button 
                onClick={() => deleteNode(node.id)}
                className="hover:bg-orange-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {node.config.message && (
              <div className="text-sm opacity-90">{node.config.message}</div>
            )}
          </div>
        );
      
      case "send_template":
        const template = (templates as any[]).find((t: any) => t.id === node.config.templateId);
        return (
          <div className="bg-blue-500 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Template
              </span>
              <button 
                onClick={() => deleteNode(node.id)}
                className="hover:bg-blue-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {template && (
              <div className="text-sm opacity-90">{template.name}</div>
            )}
          </div>
        );

      case "user_reply":
        return (
          <div className="bg-pink-500 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium flex items-center gap-2">
                <Reply className="h-4 w-4" />
                Question
              </span>
              <button 
                onClick={() => deleteNode(node.id)}
                className="hover:bg-pink-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {node.config.question && (
              <div className="text-sm opacity-90">{node.config.question}</div>
            )}
          </div>
        );

      case "time_gap":
        return (
          <div className="bg-gray-500 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Delay
              </span>
              <button 
                onClick={() => deleteNode(node.id)}
                className="hover:bg-gray-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm opacity-90">
              {node.config.delay} seconds
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderConfigForm = (node: AutomationNode) => {
    if (expandedNode !== node.id) return null;

    return (
      <Card className="mt-2 p-4 bg-gray-50 border-gray-200">
        {node.type === "custom_reply" && (
          <div className="space-y-3">
            <div>
              <Label>Message</Label>
              <Textarea
                value={node.config.message || ""}
                onChange={(e) => updateNodeConfig(node.id, { ...node.config, message: e.target.value })}
                placeholder="Type your message here..."
                rows={3}
                className="bg-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setExpandedNode(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                Save
              </Button>
            </div>
          </div>
        )}

        {node.type === "send_template" && (
          <div className="space-y-3">
            <div>
              <Label>Select Template</Label>
              <Select
                value={node.config.templateId}
                onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, templateId: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {(templates as any[]).map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setExpandedNode(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                Save
              </Button>
            </div>
          </div>
        )}

        {node.type === "user_reply" && (
          <div className="space-y-3">
            <div>
              <Label>Question</Label>
              <Textarea
                value={node.config.question || ""}
                onChange={(e) => updateNodeConfig(node.id, { ...node.config, question: e.target.value })}
                placeholder="What would you like to ask?"
                rows={2}
                className="bg-white"
              />
            </div>
            <div>
              <Label>Save answer as</Label>
              <Input
                value={node.config.saveAs || ""}
                onChange={(e) => updateNodeConfig(node.id, { ...node.config, saveAs: e.target.value })}
                placeholder="Variable name"
                className="bg-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setExpandedNode(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
                Save
              </Button>
            </div>
          </div>
        )}

        {node.type === "time_gap" && (
          <div className="space-y-3">
            <div>
              <Label>Delay (seconds)</Label>
              <Input
                type="number"
                value={node.config.delay || 60}
                onChange={(e) => updateNodeConfig(node.id, { ...node.config, delay: parseInt(e.target.value) })}
                className="bg-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setExpandedNode(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-gray-500 hover:bg-gray-600">
                Save
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar - Operations */}
      <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Operations</h3>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-6">
            {/* Send a message section */}
            <div>
              <div className="px-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <MessageCircle className="h-3 w-3" />
                  <span>Send a message</span>
                </div>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => addNode("custom_reply")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 rounded transition-colors flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  Message
                </button>
                <button
                  onClick={() => addNode("send_template")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Template
                </button>
              </div>
            </div>

            {/* Ask a question section */}
            <div>
              <div className="px-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <Reply className="h-3 w-3" />
                  <span>Ask a question</span>
                </div>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => addNode("user_reply")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-pink-50 rounded transition-colors flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-pink-500 rounded-full" />
                  Question
                </button>
              </div>
            </div>

            {/* Operations section */}
            <div>
              <div className="px-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <Settings className="h-3 w-3" />
                  <span>Operations</span>
                </div>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => addNode("time_gap")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  Time Delay
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
              <Badge variant="outline" className="text-xs">
                Free chatbot testing
              </Badge>
              <Badge className="bg-green-500 text-white text-xs">
                New
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="ghost">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Flow Builder Canvas */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl mx-auto">
            {/* Start Node */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <div className="font-medium">Starting from</div>
                <div className="text-sm text-gray-600">Welcome to Health Clinic!</div>
              </div>
            </div>

            {/* Flow Nodes */}
            <div className="space-y-6 ml-6 relative">
              {/* Vertical line connector */}
              {nodes.length > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300" 
                     style={{ left: '-24px' }} />
              )}

              {nodes.map((node, index) => (
                <div key={node.id} className="relative">
                  {/* Node connection dot */}
                  <div className="absolute -left-7 top-6 w-2 h-2 bg-gray-400 rounded-full" />
                  
                  {/* Node content */}
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                  >
                    {renderNodeContent(node)}
                  </div>

                  {/* Node configuration form */}
                  {renderConfigForm(node)}
                </div>
              ))}

              {/* Add button at the end */}
              <div className="relative">
                <div className="absolute -left-7 top-3 w-2 h-2 bg-gray-400 rounded-full" />
                <button 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => {/* Show add node menu */}}
                >
                  <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Add step</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}