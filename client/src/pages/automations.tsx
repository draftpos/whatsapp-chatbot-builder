import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Bot,
  Play,
  Pause,
  Trash2,
  Edit,
  LucideTestTube,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AutomationFlowBuilderXYFlow from "@/components/automation-flow-builder";
import { TestAutomationModal } from "@/components/TestAutomationModal";
import { useAuth } from "@/contexts/auth-context";


type Automation = {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "paused";
  trigger: string;
  executionCount: number | null;
  lastExecutedAt?: string | null;
};


export default function Automations() {
  const [showFlowBuilder, setShowFlowBuilder] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const {user} = useAuth();
  const openModal = (id: string) => {
    setSelectedAutomationId(id);
    setIsModalOpen(true);
  };

  const { data: automations = [], isLoading } = useQuery<Automation[]>({
    queryKey: ["/api/automations"],
    queryFn: async () => {
      const res = await fetch("/api/automations");
      if (!res.ok) throw new Error("Failed to fetch automations");
      return res.json() as Promise<Automation[]>;
    },
  });
  

  const { data: activeChannel } = useQuery({
    queryKey: ["/api/channels/active"],
    queryFn: async () => {
      const response = await fetch("/api/channels/active");
      if (!response.ok) return null;
      return await response.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/automations/${id}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to toggle automation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({ title: "Automation status updated" });
    },
    onError: () => {
      toast({
        title: "Failed to update automation",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/automations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete automation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({ title: "Automation deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete automation",
        variant: "destructive",
      });
    },
  });

  const handleCreateNew = () => {
    setSelectedAutomation(null);
    setShowFlowBuilder(true);
  };

  const handleEdit = (automation: any) => {
    setSelectedAutomation(automation);
    setShowFlowBuilder(true);
  };

  type TestPayload = {
    id: string;
    conversationId: string;
    contactId: string;
  };

  const handleTest = useMutation({
    mutationFn: async ({ id, conversationId, contactId }: TestPayload) => {
      const response = await fetch(`/api/automations/${id}/test`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId, contactId }),
      });

      if (!response.ok) {
        throw new Error("Failed to test automation");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Automation test result:", data);
      toast({ title: "Automation tested successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to test automation",
        variant: "destructive",
      });
    },
  });

  const handleCloseFlowBuilder = () => {
    setShowFlowBuilder(false);
    setSelectedAutomation(null);
    queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
  };

  if (isLoading) {
    return <div className="p-6">Loading automations...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create automated workflows to engage with your customers
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          data-testid="button-create-automation"
          // disabled={user?.username === 'demouser'}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {automations.length === 0 ? (
        <Card className="p-12 text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No automations yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first automation to start engaging with customers
            automatically
          </p>
          <Button
            onClick={handleCreateNew}
            data-testid="button-create-first-automation"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Automation
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {automations.map((automation: any) => (
            <Card
              key={automation.id}
              className="p-6"
              data-testid={`card-automation-${automation.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3
                      className="text-lg font-medium"
                      data-testid={`text-name-${automation.id}`}
                    >
                      {automation.name}
                    </h3>
                    <Badge
                      variant={
                        automation.status === "active" ? "default" : "secondary"
                      }
                    >
                      {automation.status}
                    </Badge>
                  </div>

                  {automation.description && (
                    <p
                      className="text-sm text-muted-foreground mb-3"
                      data-testid={`text-description-${automation.id}`}
                    >
                      {automation.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Trigger: {automation.trigger}</span>
                    {automation.executionCount !== null && (
                      <span>Executions: {automation.executionCount}</span>
                    )}
                    {automation.lastExecutedAt && (
                      <span>
                        Last run:{" "}
                        {format(
                          new Date(automation.lastExecutedAt),
                          "MMM d, yyyy HH:mm"
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(automation.id)}
                    data-testid={`button-test-${automation.id}`}
                    aria-label="Test automation"
                    disabled={user?.username === 'demouser'}
                  >
                    <LucideTestTube className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(automation)}
                    data-testid={`button-edit-${automation.id}`}
                    disabled={user?.username === 'demouser'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleMutation.mutate(automation.id)}
                    data-testid={`button-toggle-${automation.id}`}
                    disabled={user?.username === 'demouser' ? true : toggleMutation.isPending}
                  >
                    {automation.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete this automation?"
                        )
                      ) {
                        deleteMutation.mutate(automation.id);
                      }
                    }}
                    disabled={user?.username === 'demouser' ? true : deleteMutation.isPending}
                    data-testid={`button-delete-${automation.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showFlowBuilder} onOpenChange={setShowFlowBuilder}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Automation Flow Builder</DialogTitle>
            <DialogDescription>
              Create and edit automation workflows
            </DialogDescription>
          </DialogHeader>
          {/* <AutomationFlowBuilder
            automation={selectedAutomation}
            onClose={handleCloseFlowBuilder}
          /> */}
          <AutomationFlowBuilderXYFlow
            automation={selectedAutomation}
            channelId={activeChannel?.id}
            onClose={handleCloseFlowBuilder}
          />
        </DialogContent>
      </Dialog>
      {selectedAutomationId && (
        <TestAutomationModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          automationId={selectedAutomationId}
          onSubmit={(data) => handleTest.mutate(data)}
        />
      )}
    </div>
  );
}
