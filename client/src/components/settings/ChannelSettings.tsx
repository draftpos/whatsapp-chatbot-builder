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
import {
  Smartphone,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  TestTube,
  RefreshCw,
  Info,
  Activity,
  MessageSquare,
  Shield,
  TrendingUp,
  Gauge,
  ShieldCheck,
  Award,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Channel } from "@shared/schema";
import { Loading } from "@/components/ui/loading";
import { ChannelDialog } from "./ChannelDialog";
import { TestMessageDialog } from "./TestMessageDialog";
import { useAuth } from "@/contexts/auth-context";

export function ChannelSettings() {
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  // Fetch WhatsApp channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<
    Channel[]
  >({
    queryKey: ["/api/channels"],
  });

  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      return await apiRequest("DELETE", `/api/channels/${channelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Channel deleted",
        description: "The channel has been removed successfully.",
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

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setShowChannelDialog(true);
  };

  const handleDeleteChannel = (channelId: string) => {
    if (confirm("Are you sure you want to delete this channel?")) {
      deleteChannelMutation.mutate(channelId);
    }
  };

  const checkChannelHealth = async (channelId: string) => {
    try {
      toast({
        title: "Checking health...",
        description: "Verifying channel connection and status",
      });

      const response = await apiRequest(
        "POST",
        `/api/channels/${channelId}/health`
      );

      await queryClient.invalidateQueries({ queryKey: ["/api/channels"] });

      if (response.status === "healthy") {
        toast({
          title: "Channel is healthy",
          description: "The WhatsApp channel is working properly",
        });
      } else if (response.status === "warning") {
        toast({
          title: "Channel has warnings",
          description:
            response.error || "Check health details for more information",
          variant: "default",
        });
      } else if (response.status === "error") {
        toast({
          title: "Channel has issues",
          description: response.error || "The channel needs attention",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Health check failed",
        description: "Could not verify channel status",
        variant: "destructive",
      });
    }
  };

  const getHealthIcon = (status?: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getHealthStatusBadge = (status?: string, lastChecked?: string) => {
    const variant =
      status === "healthy"
        ? "success"
        : status === "warning"
        ? "warning"
        : status === "error"
        ? "destructive"
        : "secondary";
    const displayStatus = status === "error" ? "Error" : status || "Unknown";

    return (
      <div className="flex items-center space-x-2">
        <Badge variant={variant as any} className="capitalize">
          {displayStatus}
        </Badge>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              WhatsApp Channels
            </CardTitle>
            <Button
              onClick={() => {
                setEditingChannel(null);
                setShowChannelDialog(true);
              }}
              // disabled={user?.username === "demouser"}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Channel
            </Button>
          </div>
          <CardDescription>
            Configure your WhatsApp Business API channels for Cloud API and MM
            Lite
          </CardDescription>
        </CardHeader>
        <CardContent>
          {channelsLoading ? (
            <Loading />
          ) : channels.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                No WhatsApp channels configured yet
              </p>
              <Button onClick={() => setShowChannelDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Channel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{user?.username === 'demouser' ? (
                                  <span className=" px-2 py-1 rounded">
                                    {channel.name.slice(0, -1).replace(/./g, "*") + channel.name.slice(-1)}
                                  </span>
                                ) : (
                                  channel.name
                                )}</h3>
                        {channel.isActive && (
                          <Badge variant="success" className="text-xs">
                            Active
                          </Badge>
                        )}
                        {channel.mmLiteEnabled && (
                          <Badge variant="secondary" className="text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            MM Lite
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Phone: {user?.username === 'demouser' ? ((channel.phoneNumber).slice(0, -4).replace(/\d/g, "*") + channel.phoneNumber.slice(-4)) : channel.phoneNumber || "Not set"}</p>
                        <p>Phone Number ID: {user?.username === 'demouser' ?(channel.phoneNumberId).slice(0, -4).replace(/\d/g, "*") + channel.phoneNumberId.slice(-4): channel.phoneNumberId}</p>
                        <p>
                          Business Account ID:{" "}
                          {user?.username === 'demouser' ?(channel.whatsappBusinessAccountId).slice(0, -4).replace(/\d/g, "*") + channel.whatsappBusinessAccountId.slice(-4) : channel.whatsappBusinessAccountId || "Not set"}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-5 h-5 text-gray-600" />
                              <span className="font-semibold text-gray-700">
                                Channel Health
                              </span>
                            </div>
                            {getHealthStatusBadge(
                              channel.healthStatus,
                              channel.lastHealthCheck
                            )}
                          </div>
                          {channel?.healthDetails &&
                            Object.keys(channel?.healthDetails).length > 0 && (
                              <div className="mt-3">
                                {channel?.healthDetails.error ? (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-1 text-sm">
                                    <p className="text-red-700 font-medium">
                                      Error: {channel.healthDetails.error}
                                    </p>
                                    {channel.healthDetails.error_code && (
                                      <p className="text-red-600">
                                        Error Code:{" "}
                                        {channel.healthDetails.error_code}
                                      </p>
                                    )}
                                    {channel.healthDetails.error_type && (
                                      <p className="text-red-600">
                                        Error Type:{" "}
                                        {channel.healthDetails.error_type}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {channel.healthDetails.status && (
                                      <div
                                        className={`p-3 rounded-lg border ${
                                          channel.healthDetails.status ===
                                          "LIVE"
                                            ? "bg-green-50 border-green-200"
                                            : "bg-yellow-50 border-yellow-200"
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2 mb-1">
                                          <Activity
                                            className={`w-4 h-4 ${
                                              channel.healthDetails.status ===
                                              "LIVE"
                                                ? "text-green-600"
                                                : "text-yellow-600"
                                            }`}
                                          />
                                          <span className="text-xs font-medium text-gray-600">
                                            Account Mode
                                          </span>
                                        </div>
                                        <p
                                          className={`font-semibold ${
                                            channel.healthDetails.status ===
                                            "LIVE"
                                              ? "text-green-700"
                                              : "text-yellow-700"
                                          }`}
                                        >
                                          {channel.healthDetails.status}
                                        </p>
                                      </div>
                                    )}

                                    {channel.healthDetails.quality_rating && (
                                      <div
                                        className={`p-3 rounded-lg border ${
                                          channel.healthDetails
                                            .quality_rating === "GREEN"
                                            ? "bg-emerald-50 border-emerald-200"
                                            : channel.healthDetails
                                                .quality_rating === "YELLOW"
                                            ? "bg-amber-50 border-amber-200"
                                            : "bg-red-50 border-red-200"
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2 mb-1">
                                          <TrendingUp
                                            className={`w-4 h-4 ${
                                              channel.healthDetails
                                                .quality_rating === "GREEN"
                                                ? "text-emerald-600"
                                                : channel.healthDetails
                                                    .quality_rating === "YELLOW"
                                                ? "text-amber-600"
                                                : "text-red-600"
                                            }`}
                                          />
                                          <span className="text-xs font-medium text-gray-600">
                                            Quality Rating
                                          </span>
                                        </div>
                                        <p
                                          className={`font-semibold ${
                                            channel.healthDetails
                                              .quality_rating === "GREEN"
                                              ? "text-emerald-700"
                                              : channel.healthDetails
                                                  .quality_rating === "YELLOW"
                                              ? "text-amber-700"
                                              : "text-red-700"
                                          }`}
                                        >
                                          {channel.healthDetails.quality_rating}
                                        </p>
                                      </div>
                                    )}

                                    {channel.healthDetails.messaging_limit && (
                                      <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <Zap className="w-4 h-4 text-blue-600" />
                                          <span className="text-xs font-medium text-gray-600">
                                            Messaging Limit
                                          </span>
                                        </div>
                                        <p className="font-semibold text-blue-700">
                                          {
                                            channel.healthDetails
                                              .messaging_limit
                                          }
                                        </p>
                                      </div>
                                    )}

                                    {channel.healthDetails.throughput_level && (
                                      <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <Gauge className="w-4 h-4 text-purple-600" />
                                          <span className="text-xs font-medium text-gray-600">
                                            Throughput
                                          </span>
                                        </div>
                                        <p className="font-semibold text-purple-700 capitalize">
                                          {
                                            channel.healthDetails
                                              .throughput_level
                                          }
                                        </p>
                                      </div>
                                    )}

                                    {channel.healthDetails
                                      .verification_status && (
                                      <div
                                        className={`p-3 rounded-lg border ${
                                          channel.healthDetails
                                            .verification_status === "VERIFIED"
                                            ? "bg-teal-50 border-teal-200"
                                            : "bg-gray-50 border-gray-200"
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2 mb-1">
                                          <ShieldCheck
                                            className={`w-4 h-4 ${
                                              channel.healthDetails
                                                .verification_status ===
                                              "VERIFIED"
                                                ? "text-teal-600"
                                                : "text-gray-600"
                                            }`}
                                          />
                                          <span className="text-xs font-medium text-gray-600">
                                            Verification
                                          </span>
                                        </div>
                                        <p
                                          className={`font-semibold ${
                                            channel.healthDetails
                                              .verification_status ===
                                            "VERIFIED"
                                              ? "text-teal-700"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          {channel.healthDetails.verification_status.replace(
                                            /_/g,
                                            " "
                                          )}
                                        </p>
                                      </div>
                                    )}

                                    {channel.healthDetails.name_status && (
                                      <div
                                        className={`p-3 rounded-lg border ${
                                          channel.healthDetails.name_status ===
                                          "APPROVED"
                                            ? "bg-indigo-50 border-indigo-200"
                                            : "bg-orange-50 border-orange-200"
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2 mb-1">
                                          <Award
                                            className={`w-4 h-4 ${
                                              channel.healthDetails
                                                .name_status === "APPROVED"
                                                ? "text-indigo-600"
                                                : "text-orange-600"
                                            }`}
                                          />
                                          <span className="text-xs font-medium text-gray-600">
                                            Name Status
                                          </span>
                                        </div>
                                        <p
                                          className={`font-semibold ${
                                            channel.healthDetails
                                              .name_status === "APPROVED"
                                              ? "text-indigo-700"
                                              : "text-orange-700"
                                          }`}
                                        >
                                          {channel.healthDetails.name_status}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {channel.lastHealthCheck && (
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">
                                      Last checked:{" "}
                                      {new Date(
                                        channel.lastHealthCheck
                                      ).toLocaleString()}
                                    </p>
                                    <Button
                                      onClick={() =>
                                        checkChannelHealth(channel.id)
                                      }
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs"
                                    >
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Refresh
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={user?.username === "demouser"}
                        onClick={() => {
                          setTestingChannelId(channel.id);
                          setShowTestDialog(true);
                        }}
                      >
                        <TestTube className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditChannel(channel)}
                        disabled={user?.username === "demouser"}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteChannel(channel.id)}
                        disabled={user?.username === 'demouser'? true :deleteChannelMutation.isPending}
                        // disabled={user?.username === "demouser"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Dialog */}
      <ChannelDialog
        open={showChannelDialog}
        onOpenChange={setShowChannelDialog}
        editingChannel={editingChannel}
        onSuccess={() => {
          setShowChannelDialog(false);
          setEditingChannel(null);
        }}
      />

      {/* Test Message Dialog */}
      <TestMessageDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        channelId={testingChannelId}
      />
    </>
  );
}
