import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useChannelContext } from "@/contexts/channel-context";
import { CampaignStatistics } from "@/components/campaigns/CampaignStatistics";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { CampaignDetailsDialog } from "@/components/campaigns/CampaignDetailsDialog";
import { CreateCampaignDialog } from "@/components/campaigns/CreateCampaignDialog";
import { useTranslation } from "@/lib/i18n"; 
import { useAuth } from "@/contexts/auth-context";



export default function Campaigns() {
  const { t } = useTranslation();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaignType, setCampaignType] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedChannel } = useChannelContext();
  const { user } = useAuth();


  // Log selected channel for debugging
  useEffect(() => {
    // console.log("Selected channel in campaigns:", selectedChannel);
  }, [selectedChannel]);

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: !!selectedChannel,
    queryFn: async () => {
      const res = await fetch("/api/campaigns", {
        credentials: "include",
        headers: {
          "x-channel-id": selectedChannel?.id || "",
        },
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  // Fetch templates for campaign creation
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/templates", selectedChannel?.id],
    enabled: createDialogOpen && !!selectedChannel,
    queryFn: async () => {
      const res = await fetch("/api/templates", {
        credentials: "include",
        headers: {
          "x-channel-id": selectedChannel?.id || "",
        },
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  // Fetch contacts for contacts-based campaigns
  const { data: contactsResponse } = useQuery({
    queryKey: ["/api/contacts"],
    enabled: createDialogOpen && !!selectedChannel,
    queryFn: async () => {
      const res = await fetch("/api/contacts", {
        credentials: "include",
        headers: {
          "x-channel-id": selectedChannel?.id || "",
        },
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const contacts = contactsResponse?.data || [];

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return await apiRequest("POST", "/api/campaigns", campaignData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setCreateDialogOpen(false);
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully",
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

  // Update campaign status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/campaigns/${id}/status`, {
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Status updated",
        description: "Campaign status has been updated",
      });
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign deleted",
        description: "Campaign has been deleted successfully",
      });
    },
  });

  const handleCreateCampaign = async (campaignData: any) => {
    const {
      selectedTemplate,
      selectedContacts,
      csvData,
      campaignType,
      scheduledTime,
      autoRetry,
    } = campaignData;

    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChannel || !selectedChannel.id) {
      toast({
        title: "Error",
        description: "Please select a channel from the top navigation",
        variant: "destructive",
      });
      return;
    }

    let recipientCount = 0;
    if (campaignType === "contacts") {
      recipientCount = selectedContacts.length;
      if (recipientCount === 0) {
        toast({
          title: "Error",
          description: "Please select at least one contact",
          variant: "destructive",
        });
        return;
      }
    } else if (campaignType === "csv") {
      recipientCount = csvData.length;
      if (recipientCount === 0) {
        toast({
          title: "Error",
          description: "Please upload a CSV file with contacts",
          variant: "destructive",
        });
        return;
      }
    }

    const finalCampaignData = {
      ...campaignData,
      channelId: selectedChannel.id,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      templateLanguage: selectedTemplate.language,
      status: scheduledTime ? "scheduled" : "active",
      scheduledAt: scheduledTime || null,
      contactGroups: campaignType === "contacts" ? selectedContacts : [],
      csvData: campaignType === "csv" ? csvData : [],
      recipientCount,
      type: "marketing",
      apiType: "mm_lite",
      campaignType: campaignType,
      variableMapping: campaignData.variableMapping || {},
      autoRetry: autoRetry,
    };

    createCampaignMutation.mutate(finalCampaignData);
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      deleteCampaignMutation.mutate(id);
    }
  };

  if (campaignsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        Loading campaigns...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('campaigns.title')}</h1>
          <p className="text-muted-foreground">
          {t('campaigns.subtitle')}
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setCreateDialogOpen(true)}
          // disabled={user?.username === 'demouser'}
        >
          <Plus className="h-4 w-4" />
          {t('campaigns.createCampaign')}
        </Button>
      </div>

      {/* Campaign Statistics */}
      <CampaignStatistics campaigns={campaigns} />

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('campaigns.allCampaigns')}</CardTitle>
          <CardDescription>{t('campaigns.listDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignsTable
            campaigns={campaigns}
            onViewCampaign={setSelectedCampaign}
            onUpdateStatus={handleUpdateStatus}
            onDeleteCampaign={handleDeleteCampaign}
          />
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        templates={templates}
        contacts={contacts}
        onCreateCampaign={handleCreateCampaign}
        isCreating={createCampaignMutation.isPending}
      />

      {/* Campaign Details Dialog */}
      <CampaignDetailsDialog
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />
    </div>
  );
}
