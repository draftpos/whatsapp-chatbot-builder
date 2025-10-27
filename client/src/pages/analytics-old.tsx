import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageChart } from "@/components/charts/message-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Eye, 
  Reply, 
  XCircle,
  Download,
  Calendar,
  Filter,
  PlusCircle,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Send,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<number>(30);
  const [selectedMetric, setSelectedMetric] = useState<string>("messages");
  const [exportLoading, setExportLoading] = useState(false);

  const { data: activeChannel } = useQuery({
    queryKey: ["/api/channels/active"],
    queryFn: async () => {
      const response = await fetch("/api/channels/active");
      if (!response.ok) return null;
      return await response.json();
    },
  });

  // Fetch message analytics
  const { data: messageAnalytics, isLoading: messageLoading } = useQuery({
    queryKey: ["/api/analytics/messages", activeChannel?.id, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: timeRange.toString(),
        ...(activeChannel?.id && { channelId: activeChannel.id })
      });
      const response = await fetch(`/api/analytics/messages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch message analytics');
      return await response.json();
    },
    enabled: !!activeChannel,
  });

  // Fetch campaign analytics
  const { data: campaignAnalytics, isLoading: campaignLoading } = useQuery({
    queryKey: ["/api/analytics/campaigns", activeChannel?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(activeChannel?.id && { channelId: activeChannel.id })
      });
      const response = await fetch(`/api/analytics/campaigns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch campaign analytics');
      return await response.json();
    },
    enabled: !!activeChannel,
  });

  // Handle export functionality
  const handleExport = async (format: 'pdf' | 'excel', type: 'messages' | 'campaigns' | 'all') => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        format,
        type,
        days: timeRange.toString(),
        ...(activeChannel?.id && { channelId: activeChannel.id })
      });
      
      const response = await fetch(`/api/analytics/export?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: `Analytics report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export analytics report",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate metrics from real data
  const messageMetrics = messageAnalytics?.overall || {};
  const campaignMetrics = campaignAnalytics?.summary || {};

  // Calculate rates
  const deliveryRate = messageMetrics.totalMessages > 0 
    ? ((messageMetrics.totalDelivered || 0) / messageMetrics.totalMessages) * 100 
    : 0;
  const readRate = messageMetrics.totalDelivered > 0 
    ? ((messageMetrics.totalRead || 0) / messageMetrics.totalDelivered) * 100 
    : 0;
  const replyRate = messageMetrics.totalMessages > 0 
    ? ((messageMetrics.totalReplied || 0) / messageMetrics.totalMessages) * 100 
    : 0;
  const failureRate = messageMetrics.totalMessages > 0 
    ? ((messageMetrics.totalFailed || 0) / messageMetrics.totalMessages) * 100 
    : 0;

  // Transform daily stats for chart
  const chartData = messageAnalytics?.dailyStats?.map((stat: any) => ({
    date: stat.date,
    sent: stat.totalSent || 0,
    delivered: stat.delivered || 0,
    read: stat.read || 0,
    failed: stat.failed || 0,
  })) || [];

  if (messageLoading || campaignLoading) {
    return (
      <div className="flex-1 dots-bg">
        <Header title="Analytics" subtitle="Loading analytics..." />
        <div className="p-6">
          <Loading size="lg" text="Loading analytics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 dots-bg min-h-screen">
      <Header 
        title="Analytics & Reports" 
        subtitle="Track your WhatsApp business performance with real-time data"
      />

      <main className="p-6 space-y-6">
        {/* Time Range and Export Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Time Range:</span>
                </div>
                <div className="flex space-x-2">
                  {[
                    { value: 7, label: "7 Days" },
                    { value: 30, label: "30 Days" },
                    { value: 90, label: "3 Months" }
                  ].map((range) => (
                    <Button
                      key={range.value}
                      variant={timeRange === range.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(range.value)}
                      className={timeRange === range.value ? "bg-green-600" : ""}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const dropdown = document.getElementById('export-dropdown');
                      if (dropdown) dropdown.classList.toggle('hidden');
                    }}
                    disabled={exportLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportLoading ? 'Exporting...' : 'Export'}
                  </Button>
                  <div id="export-dropdown" className="hidden absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div className="py-1">
                      <button
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                        onClick={() => {
                          handleExport('pdf', 'all');
                          document.getElementById('export-dropdown')?.classList.add('hidden');
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export as PDF
                      </button>
                      <button
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                        onClick={() => {
                          handleExport('excel', 'all');
                          document.getElementById('export-dropdown')?.classList.add('hidden');
                        }}
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export as Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Messages</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(messageMetrics.totalMessages || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last {timeRange} days
                      </p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {deliveryRate.toFixed(1)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${deliveryRate}%` }}
                    />
                  </div>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Read Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {readRate.toFixed(1)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${readRate}%` }}
                    />
                  </div>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reply Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {replyRate.toFixed(1)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${replyRate}%` }}
                    />
                  </div>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Reply className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failure Rate</p>
                  <p className="text-2xl font-bold text-red-600">
                    {failureRate.toFixed(1)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${failureRate}%` }}
                    />
                  </div>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message Performance Trends</CardTitle>
                <div className="flex space-x-2">
                  {[
                    { value: "messages", label: "Messages" },
                    { value: "delivery", label: "Delivery" },
                    { value: "engagement", label: "Engagement" }
                  ].map((metric) => (
                    <Button
                      key={metric.value}
                      variant={selectedMetric === metric.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMetric(metric.value)}
                      className={selectedMetric === metric.value ? "bg-green-600" : ""}
                    >
                      {metric.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MessageChart data={chartData} />
            </CardContent>
          </Card>

          {/* Top Performing Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns?.slice(0, 5).map((campaign: any, index: number) => {
                  const campaignDeliveryRate = campaign.sentCount > 0 
                    ? (campaign.deliveredCount / campaign.sentCount) * 100 
                    : 0;
                  
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {campaign.sentCount || 0} sent
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {campaignDeliveryRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">delivery</p>
                      </div>
                    </div>
                  );
                }) || (
                  <div className="text-center py-8 text-gray-500">
                    No campaigns to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!campaigns?.length ? (
              <div className="text-center py-12 text-gray-500">
                No campaign data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Messages Sent
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivered
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Read
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Replied
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Failed
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.map((campaign: any) => {
                      const campaignDeliveryRate = campaign.sentCount > 0 
                        ? (campaign.deliveredCount / campaign.sentCount) * 100 
                        : 0;
                      
                      return (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {campaign.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {campaign.type} • {campaign.apiType}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(campaign.sentCount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(campaign.deliveredCount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(campaign.readCount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(campaign.repliedCount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(campaign.failedCount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${
                                campaignDeliveryRate >= 90 ? "text-green-600" :
                                campaignDeliveryRate >= 70 ? "text-orange-600" :
                                "text-red-600"
                              }`}>
                                {campaignDeliveryRate.toFixed(1)}%
                              </span>
                              <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    campaignDeliveryRate >= 90 ? "bg-green-500" :
                                    campaignDeliveryRate >= 70 ? "bg-orange-500" :
                                    "bg-red-500"
                                  }`}
                                  style={{ width: `${campaignDeliveryRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
