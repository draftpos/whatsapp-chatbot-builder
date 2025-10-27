import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WebhookConfig } from "@shared/schema";
import { Info } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const webhookFormSchema = z.object({
  verifyToken: z.string().min(10, "Verify token must be at least 10 characters"),
  events: z.array(z.string()).min(1, "Select at least one event"),
});

interface WebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingWebhook: WebhookConfig | null;
  onSuccess: () => void;
}

export function WebhookDialog({ open, onOpenChange, editingWebhook, onSuccess }: WebhookDialogProps) {
  const { toast } = useToast();
const {user} = useAuth()
  const webhookForm = useForm<z.infer<typeof webhookFormSchema>>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      verifyToken: "",
      events: ["messages", "message_status"],
    },
  });

  useEffect(() => {
    if (editingWebhook) {
      webhookForm.reset({
        verifyToken: editingWebhook.verifyToken,
        events: editingWebhook.events as string[],
      });
    } else {
      webhookForm.reset({
        verifyToken: "",
        events: ["messages", "message_status"],
      });
    }
  }, [editingWebhook, webhookForm]);

  // Create/Update webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof webhookFormSchema>) => {
      // Use a simple webhook ID for the global webhook
      const webhookId = 'd420e261-9c12-4cee-9d65-253cda8ab4bc'; // Fixed webhook ID for global webhook
      const webhookUrl = `${window.location.origin}/webhook/${webhookId}`;
      
      if (editingWebhook) {
        return await apiRequest("PATCH", `/api/webhook-configs/${editingWebhook.id}`, {
          ...data,
          webhookUrl,
          channelId: null, // Global webhook - not tied to a specific channel
        });
      } else {
        return await apiRequest("POST", "/api/webhook-configs", { 
          ...data, 
          webhookUrl,
          channelId: null, // Global webhook - not tied to a specific channel
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhook-configs"] });
      toast({
        title: editingWebhook ? "Webhook updated" : "Webhook configured",
        description: editingWebhook ? "Your webhook has been updated successfully." : "Your webhook has been configured successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWebhookSubmit = (data: z.infer<typeof webhookFormSchema>) => {
    createWebhookMutation.mutate(data);
  };

  const eventOptions = [
    { value: "messages", label: "Messages - Receive incoming messages" },
    { value: "message_status", label: "Message Status - Track delivery status" },
    { value: "message_template_status_update", label: "Template Status - Template approval updates" },
    { value: "phone_number_name_update", label: "Phone Number Updates - Name changes" },
    { value: "account_update", label: "Account Updates - Account status changes" },
    { value: "security", label: "Security - Security-related events" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingWebhook ? "Edit" : "Configure"} Webhook</DialogTitle>
          <DialogDescription>
            Set up your webhook to receive real-time WhatsApp events
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Global Webhook Configuration</p>
              <p className="text-blue-700 mt-1">
                This creates a single webhook endpoint that handles events for all your WhatsApp channels.
                The webhook URL will be generated automatically.
              </p>
            </div>
          </div>
        </div>

        <Form {...webhookForm}>
          <form onSubmit={webhookForm.handleSubmit(handleWebhookSubmit)} className="space-y-6">
            <FormField
              control={webhookForm.control}
              name="verifyToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verify Token</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="my-secure-verify-token" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const token = Math.random().toString(36).substring(2, 15) + 
                                      Math.random().toString(36).substring(2, 15);
                        field.onChange(token);
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                  <FormDescription>
                    A secret token you'll use when configuring the webhook in Meta
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={webhookForm.control}
              name="events"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Events</FormLabel>
                  <FormDescription>
                    Select the events you want to receive notifications for
                  </FormDescription>
                  <div className="space-y-3 mt-3">
                    {eventOptions.map((event) => (
                      <div key={event.value} className="flex items-center space-x-3">
                        <Checkbox
                          checked={field.value?.includes(event.value)}
                          onCheckedChange={(checked) => {
                            const currentValues = field.value || [];
                            if (checked) {
                              field.onChange([...currentValues, event.value]);
                            } else {
                              field.onChange(currentValues.filter((v) => v !== event.value));
                            }
                          }}
                        />
                        <Label className="text-sm font-normal cursor-pointer">
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={user?.username === 'demouser'? true :createWebhookMutation.isPending}>
                {createWebhookMutation.isPending ? "Saving..." : editingWebhook ? "Update" : "Configure"} Webhook
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}