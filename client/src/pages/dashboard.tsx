import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Loading } from "@/components/ui/loading";
import { MessageChart } from "@/components/charts/message-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Megaphone,
  CheckCircle,
  Users,
  TrendingUp,
  Clock,
  Activity,
  Zap,
  Upload,
  FileText,
  BarChart3,
  ExternalLink,
  TrendingDown,
} from "lucide-react";
import { useDashboardStats, useAnalytics } from "@/hooks/use-dashboard";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import { User, LogOut, LogIn, Edit, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { DashboardStarApiDataType } from "./types/type";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: activeChannel } = useQuery({
    queryKey: ["/api/channels/active"],
    queryFn: async () => {
      const response = await fetch("/api/channels/active");
      if (!response.ok) return null;
      return await response.json();
    },
  });

  const { data: activityLogs = [], isLoading } = useQuery({
    queryKey: ["/api/team/activity-logs"],
    queryFn: async () => {
      const response = await fetch("/api/team/activity-logs");
      if (!response.ok) return null;
      return await response.json();
    },
  });

  const [timeRange, setTimeRange] = useState<number>(30);

  // Fetch campaign analytics
  const { data: campaignAnalytics, isLoading: campaignLoading } = useQuery({
    queryKey: ["/api/analytics/campaigns", activeChannel?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(activeChannel?.id && { channelId: activeChannel.id }),
      });
      const response = await fetch(`/api/analytics/campaigns?${params}`);
      if (!response.ok) throw new Error("Failed to fetch campaign analytics");
      return await response.json();
    },
    enabled: !!activeChannel,
  });

  const { data: stats, isLoading: statsLoading } = useDashboardStats(
    activeChannel?.id
  );
  // const { data: analytics, isLoading: analyticsLoading } = useAnalytics(7, activeChannel?.id);

  // Fetch message analytics
  const { data: messageAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/messages", activeChannel?.id, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: timeRange.toString(),
        ...(activeChannel?.id && { channelId: activeChannel.id }),
      });
      const response = await fetch(`/api/analytics/messages?${params}`);
      if (!response.ok) throw new Error("Failed to fetch message analytics");
      return await response.json();
    },
    enabled: !!activeChannel,
  });

  // console.log("this is stats ", stats);

  if (statsLoading) {
    return (
      <div className="flex-1 dots-bg">
        <Header title="Dashboard" subtitle="Loading dashboard data..." />
        <div className="p-6">
          <Loading size="lg" text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  // const chartData = analytics || [];
  const chartData =
    messageAnalytics?.dailyStats?.map((stat: any) => ({
      date: new Date(stat.date).toLocaleDateString(),
      sent: stat.totalSent || 0,
      delivered: stat.delivered || 0,
      read: stat.read || 0,
      failed: stat.failed || 0,
    })) || [];

  const messageMetrics = messageAnalytics?.overall || {};

  // Calculate rates
  const deliveryRate =
    messageMetrics.totalMessages > 0
      ? ((messageMetrics.totalDelivered || 0) / messageMetrics.totalMessages) *
        100
      : 0;

  const getActivityMeta = (action: string) => {
    switch (action) {
      case "login":
        return {
          icon: <LogIn className="w-4 h-4 text-green-600" />,
          color: "bg-green-100",
          label: "User logged in",
        };
      case "logout":
        return {
          icon: <LogOut className="w-4 h-4 text-gray-600" />,
          color: "bg-gray-100",
          label: "User logged out",
        };
      case "user_created":
        return {
          icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
          color: "bg-blue-100",
          label: "User created",
        };
      case "user_updated":
        return {
          icon: <Edit className="w-4 h-4 text-yellow-600" />,
          color: "bg-yellow-100",
          label: "User updated",
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-purple-600" />,
          color: "bg-purple-100",
          label: "Activity",
        };
    }
  };

  const getWeekComparison = (stats: DashboardStarApiDataType) => {
    const thisWeek = stats?.weekContacts || 0;
    const lastWeek = stats?.lastWeekContacts || 0;

    if (lastWeek === 0) {
      return {
        percentage: thisWeek > 0 ? "+100.0" : "0.0",
        isUp: thisWeek > 0,
      };
    }

    const change = ((thisWeek - lastWeek) / lastWeek) * 100;
    const sign = change >= 0 ? "+" : "";

    return {
      percentage: `${sign}${change.toFixed(1)}`,
      isUp: change >= 0,
    };
  };

  type ActivityLog = {
    action: string;
    createdAt: string; // or Date
    [key: string]: any; // other optional fields
  };

  const getMonthlyGrowth = (stats: DashboardStarApiDataType) => {
    const thisMonth = stats?.thisMonthMessages || 0;
    const lastMonth = stats?.lastMonthMessages || 0;

    if (lastMonth === 0) {
      return {
        growth: thisMonth > 0 ? 100 : 0,
        isPositive: thisMonth > 0,
        isFlat: thisMonth === 0,
      };
    }

    const growthRate = ((thisMonth - lastMonth) / lastMonth) * 100;

    return {
      growth: Math.abs(growthRate).toFixed(1),
      isPositive: growthRate >= 0,
      isFlat: growthRate === 0,
    };
  };

  return (
    <div className="flex-1 dots-bg min-h-screen">
      <Header
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        action={{
          label: t("dashboard.newCampaign"),
          onClick: () => setLocation("/campaigns"),
        }}
      />

      <main className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* <Card className="hover-lift fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("dashboard.totalMessagesSent")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {messageMetrics?.totalMessages?.toLocaleString() || "0"}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      +{stats?.messagesGrowth || 0}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      {t("dashboard.vsLastMonth")}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card className="hover-lift fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("dashboard.totalMessagesSent")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats?.totalMessages?.toLocaleString() || "0"}
                  </p>
                  <div className="flex items-center mt-2">
                    {(() => {
                      if (!stats) {
                        return; // or handle default case
                      }
                      const monthlyGrowth = getMonthlyGrowth(stats);

                      return (
                        <>
                          {monthlyGrowth.isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              monthlyGrowth.isFlat
                                ? "text-gray-600"
                                : monthlyGrowth.isPositive
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {monthlyGrowth.isPositive ? "+" : "-"}
                            {monthlyGrowth.growth}%
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            {t("dashboard.vsLastMonth")}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("dashboard.totalCampaigns")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaignAnalytics?.summary?.totalCampaigns || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600 font-medium">
                      {campaignAnalytics?.summary?.activeCampaigns || 0}{" "}
                      {t("dashboard.runningNow")}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Megaphone className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("dashboard.deliveryRate")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {deliveryRate.toFixed(1) || "0.0"}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${stats?.deliveryRate || 0}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("dashboard.textLead")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats?.todayContacts || "0"}
                  </p>

                  
                  <div className="flex items-center mt-2">
                    {(() => {
                      if (!stats) {
                        return; // or handle default case
                      }
                      const comparison = getWeekComparison(stats);
                      return (
                        <>
                          {comparison.isUp ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              comparison.isUp
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {comparison.percentage}%
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                          {t("dashboard.vsLastWeek")}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Analytics Chart */}
          <Card className="lg:col-span-2 hover-lift fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("dashboard.messageAnalytics")}</CardTitle>
                <div className="flex space-x-2">
                  {[
                    { value: 1, label: t("dashboard.today") },
                    { value: 7, label: t("dashboard.7Days") },
                    { value: 30, label: t("dashboard.30Days") },
                    // { value: 90, label: "3 Months" },
                  ].map((range) => (
                    <Button
                      key={range.value}
                      variant={
                        timeRange === range.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setTimeRange(range.value)}
                      className={
                        timeRange === range.value ? "bg-green-600" : ""
                      }
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Loading text="Loading chart data..." />
              ) : (
                <MessageChart data={chartData} />
              )}

              {/* Chart Legend */}
              <div className="flex items-center justify-center space-x-6 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded mr-2" />
                  <span className="text-sm text-gray-600">
                    {t("dashboard.sent")}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded mr-2" />
                  <span className="text-sm text-gray-600">
                    {t("dashboard.delivered")}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-600 rounded mr-2" />
                  <span className="text-sm text-gray-600">
                    {t("dashboard.read")}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-600 rounded mr-2" />
                  <span className="text-sm text-gray-600">
                    {t("dashboard.replied")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="hover-lift fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                {t("dashboard.recentActivities")}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-gray-500">
                    {t("dashboard.loadingActivities")}
                  </p>
                ) : activityLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {t("dashboard.noRecentActivities")}
                  </p>
                ) : (
                  (activityLogs as ActivityLog[])
                  .sort((a: ActivityLog, b: ActivityLog) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((log: ActivityLog) => {
                    const meta = getActivityMeta(log.action);
                      return (
                        <div
                          key={log.id}
                          className="flex items-start space-x-3"
                        >
                          <div
                            className={`w-8 h-8 ${meta.color} rounded-full flex items-center justify-center flex-shrink-0`}
                          >
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              {meta.label} by {log.userName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(log.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              <Button
                variant="ghost"
                className="w-full mt-4 text-green-600 hover:text-green-700"
                onClick={() => setLocation("/team")}
              >
                {t("dashboard.viewAllActivities")}{" "}
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and API Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="hover-lift fade-in">
            <CardHeader>
              <CardTitle>{t("dashboard.quickActions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="p-4 h-auto text-left flex flex-col items-start space-y-2 hover:bg-blue-50"
                  onClick={() => setLocation("/contacts")}
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("dashboard.importContacts")}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t("dashboard.uploadCSV")}
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto text-left flex flex-col items-start space-y-2 hover:bg-green-50"
                  onClick={() => setLocation("/templates")}
                >
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("dashboard.newTemplate")}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t("dashboard.createMessageTemplate")}
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto text-left flex flex-col items-start space-y-2 hover:bg-purple-50"
                  onClick={() => setLocation("/automation")}
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("dashboard.buildFlow")}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t("dashboard.createAutomation")}
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto text-left flex flex-col items-start space-y-2 hover:bg-orange-50"
                  onClick={() => setLocation("/analytics")}
                >
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("dashboard.viewReports")}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t("dashboard.detailedAnalytics")}
                    </p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card className="hover-lift fade-in">
            <CardHeader>
              <CardTitle>{t("dashboard.apiStatusConnection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* WhatsApp Cloud API */}
                <div
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    activeChannel?.isActive === true
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activeChannel?.isActive === true
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t("dashboard.whatsAppCloudAPI")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {user?.username ? (
                          activeChannel ? (
                            `${activeChannel.name
                              .slice(0, -1)
                              .replace(/./g, "*") + activeChannel.name.slice(-1)} (${activeChannel.phoneNumber
                              .slice(0, -4)
                              .replace(/\d/g, "*") + activeChannel.phoneNumber.slice(-4)})`
                          ) : (
                            t("dashboard.noChannelSelected")
                          )
                        ) : activeChannel ? (
                          `${activeChannel.name} (${activeChannel.phoneNumber})`
                        ) : (
                          t("dashboard.noChannelSelected")
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activeChannel?.isActive === true
                          ? "bg-green-500 pulse-gentle"
                          : "bg-red-500"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        activeChannel?.isActive === true
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {activeChannel?.isActive === true
                        ? t("dashboard.connected")
                        : activeChannel?.isActive === false
                        ? t("dashboard.warning")
                        : activeChannel
                        ? t("dashboard.error")
                        : t("dashboard.noChannel")}
                    </span>
                  </div>
                </div>

                {/* Channel Quality */}
                {activeChannel && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {t("dashboard.healthDetails")}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t("dashboard.rating")}:{" "}
                          {activeChannel?.healthDetails.quality_rating || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-600 font-medium">
                        {t("dashboard.tier")}:{" "}
                        {activeChannel?.healthDetails.messaging_limit || "N/A"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {activeChannel?.lastHealthCheck ? "100%" : "N/A"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {t("dashboard.apiUptime")}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {activeChannel?.healthDetails.name_status || "N/A"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {t("dashboard.apiStatus")}
                    </p>
                  </div>
                </div>

                {/* Daily Limit */}
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t("dashboard.dailyMessageLimit")}
                    </span>
                    <span className="text-sm text-gray-600">
                      {stats?.todayMessages || 0} /{" "}
                      {activeChannel?.healthDetails.messaging_limit ===
                      "TIER_1K"
                        ? "1,000"
                        : activeChannel?.healthDetails.messaging_limit ===
                          "TIER_10K"
                        ? "10,000"
                        : activeChannel?.healthDetails.messaging_limit ===
                          "TIER_100K"
                        ? "100,000"
                        : activeChannel?.healthDetails.messaging_limit ===
                          "TIER_UNLIMITED"
                        ? "Unlimited"
                        : "1,000"}
                    </span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((stats?.todayMessages || 0) /
                            (activeChannel?.healthDetails.messaging_limit ===
                            "TIER_1K"
                              ? 1000
                              : activeChannel?.healthDetails.messaging_limit ===
                                "TIER_10K"
                              ? 10000
                              : activeChannel?.healthDetails.messaging_limit ===
                                "TIER_100K"
                              ? 100000
                              : 1000)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
