import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Webhook,
  Plus,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WebhookConfig } from "@shared/schema";
import { Loading } from "@/components/ui/loading";
import { WebhookDialog } from "./WebhookDialog";
import { WebhookFlowDiagram } from "@/components/webhook-flow-diagram";
import { useAuth } from "@/contexts/auth-context";

export function WebhookSettings() {
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(
    null
  );
  const { toast } = useToast();
  const { user } = useAuth();
  // Fetch webhook configs
  const {
    data: webhookConfigs = [],
    isLoading: webhooksLoading,
    refetch: refetchWebhookConfigs,
  } = useQuery<WebhookConfig[]>({
    queryKey: ["/api/webhook-configs"],
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      return await apiRequest("DELETE", `/api/webhook-configs/${webhookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhook-configs"] });
      toast({
        title: "Webhook deleted",
        description: "The webhook configuration has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      return await apiRequest("POST", `/api/webhook-configs/${webhookId}/test`);
    },
    onSuccess: () => {
      toast({
        title: "Test webhook sent",
        description: "Check your webhook endpoint for the test message.",
      });
    },
    onError: (error) => {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
  };

  const handleEditWebhook = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setShowWebhookDialog(true);
  };

  const handleDeleteWebhook = (webhookId: string) => {
    if (
      confirm("Are you sure you want to delete this webhook configuration?")
    ) {
      deleteWebhookMutation.mutate(webhookId);
    }
  };

  const getWebhookStatus = (webhook: WebhookConfig) => {
    if (!webhook.lastPingAt)
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: "No events received",
      };

    const lastPingDate = new Date(webhook.lastPingAt);
    const now = new Date();
    const hoursSinceLastPing =
      (now.getTime() - lastPingDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastPing < 24) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: "Active",
      };
    } else {
      return {
        icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
        text: "Inactive",
      };
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Webhook className="w-5 h-5 mr-2" />
                Webhook Configuration
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchWebhookConfigs()}
                  disabled={user?.username === "demouser"}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
                <Button
                  onClick={() => {
                    setEditingWebhook(null);
                    setShowWebhookDialog(true);
                  }}
                  // disabled={user?.username === "demouser"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Configure Webhook
                </Button>
              </div>
            </div>
            <CardDescription>
              Configure webhooks to receive real-time WhatsApp events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {webhooksLoading ? (
              <Loading />
            ) : webhookConfigs.length === 0 ? (
              <div className="text-center py-12">
                <Webhook className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No webhooks configured yet</p>
                <Button onClick={() => setShowWebhookDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Configure Your First Webhook
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {webhookConfigs.map((webhook) => {
                  const status = getWebhookStatus(webhook);
                  return (
                    <div
                      key={webhook.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">
                              {webhook.channelId
                                ? `Channel Webhook`
                                : "Global Webhook"}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {status.icon}
                              <span className="ml-1">{status.text}</span>
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm">Webhook URL:</Label>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {user?.username === "demouser" ? "https://your-domain.com/webhook/xxxx-xxxx-xxxx" : webhook.webhookUrl}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={user?.username === "demouser"}
                                onClick={() =>
                                  copyToClipboard(webhook.webhookUrl)
                                }
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm">Events:</Label>
                              <div className="flex flex-wrap gap-1">
                                {webhook.events.map((event) => (
                                  <Badge
                                    key={event}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {event}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {webhook.lastPingAt && (
                              <div className="text-sm text-gray-500">
                                Last event:{" "}
                                {new Date(webhook.lastPingAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              testWebhookMutation.mutate(webhook.id)
                            }
                            disabled={user?.username === "demouser" ? true : testWebhookMutation.isPending}
                          >
                            Test
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditWebhook(webhook)}
                            disabled={user?.username === "demouser"}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            disabled={user?.username === "demouser" ? true : deleteWebhookMutation.isPending}

                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook Flow Diagram */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              How Webhooks Work
            </CardTitle>
            <CardDescription>
              Understanding the webhook flow for WhatsApp Business API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookFlowDiagram />
          </CardContent>
        </Card>

        {/* Webhook Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                1. Configure Webhook in Meta App
              </h4>
              <p className="text-sm text-gray-600">
                Go to your Meta App Dashboard → WhatsApp → Configuration →
                Webhook
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Set Webhook URL</h4>
              <p className="text-sm text-gray-600">
                Copy the webhook URL from above and paste it in the Meta App
                webhook URL field
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Enter Verify Token</h4>
              <p className="text-sm text-gray-600">
                Use the verify token shown in your webhook configuration
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Subscribe to Events</h4>
              <p className="text-sm text-gray-600">
                Subscribe to messages, message_status, and other required
                webhook fields
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Dialog */}
      <WebhookDialog
        open={showWebhookDialog}
        onOpenChange={setShowWebhookDialog}
        editingWebhook={editingWebhook}
        onSuccess={() => {
          setShowWebhookDialog(false);
          setEditingWebhook(null);
        }}
      />
    </>
  );
}
