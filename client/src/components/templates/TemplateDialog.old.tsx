import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Type, 
  Image, 
  Video, 
  FileText, 
  Plus, 
  Trash2,
  MessageSquare,
  Hash,
  Link,
  Phone,
  X
} from "lucide-react";
import type { Template } from "@shared/schema";

// Template form schema
const templateFormSchema = z.object({
  name: z.string()
    .min(1, "Template name is required")
    .max(512, "Template name must be less than 512 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores allowed"),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  language: z.string().default("en_US"),
  mediaType: z.enum(["text", "image", "video", "document"]).default("text"),
  mediaUrl: z.string().optional(),
  header: z.string().max(60, "Header must be less than 60 characters").optional().default(""),
  body: z.string()
    .min(1, "Message body is required")
    .max(1024, "Body must be less than 1024 characters"),
  footer: z.string().max(60, "Footer must be less than 60 characters").optional().default(""),
  buttons: z.array(z.object({
    type: z.enum(["QUICK_REPLY", "URL", "PHONE_NUMBER"]),
    text: z.string().min(1).max(20, "Button text must be less than 20 characters"),
    url: z.string().optional(),
    phoneNumber: z.string().optional(),
  })).max(3, "Maximum 3 buttons allowed").default([]),
  variables: z.array(z.string()).default([]),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
  onSubmit: (data: TemplateFormData) => void;
  isSubmitting?: boolean;
}

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting = false,
}: TemplateDialogProps) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      category: "MARKETING",
      language: "en_US",
      mediaType: "text",
      mediaUrl: "",
      header: "",
      body: "",
      footer: "",
      buttons: [],
      variables: [],
    },
  });

  const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
    control: form.control,
    name: "buttons",
  });

  useEffect(() => {
    if (template) {
      // Extract data from template components if available
      const headerComponent = template.components?.find(c => c.type === "HEADER");
      const bodyComponent = template.components?.find(c => c.type === "BODY");
      const footerComponent = template.components?.find(c => c.type === "FOOTER");
      const buttonComponent = template.components?.find(c => c.type === "BUTTONS");

      form.reset({
        name: template.name,
        category: template.category as any,
        language: template.language || "en_US",
        mediaType: headerComponent?.format === "IMAGE" ? "image" : 
                   headerComponent?.format === "VIDEO" ? "video" : 
                   headerComponent?.format === "DOCUMENT" ? "document" : "text",
        mediaUrl: "",
        header: headerComponent?.text || template.header || "",
        body: bodyComponent?.text || template.body,
        footer: footerComponent?.text || template.footer || "",
        buttons: buttonComponent?.buttons?.map(b => ({
          type: b.type as any,
          text: b.text,
          url: b.url,
          phoneNumber: b.phone_number,
        })) || [],
        variables: extractVariables(bodyComponent?.text || template.body),
      });
    } else {
      form.reset();
    }
  }, [template, form]);

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [...new Set([...text.matchAll(regex)].map(match => match[1]))];
    return matches;
  };

  const handleAddButton = () => {
    if (buttonFields.length < 3) {
      appendButton({ type: "QUICK_REPLY", text: "", url: "", phoneNumber: "" });
    }
  };

  const handleSubmit = (data: TemplateFormData) => {
    onSubmit(data);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "Create New Template"}
          </DialogTitle>
          <DialogDescription>
            Create WhatsApp message templates for marketing, utility, or authentication purposes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left side - Form */}
              <div className="overflow-y-auto max-h-[calc(90vh-200px)] pr-4 space-y-4">{template ? "Edit Template" : "Create New Template"}

                {/* Basic Info */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="welcome_message" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use lowercase letters, numbers, and underscores only
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MARKETING">Marketing</SelectItem>
                            <SelectItem value="UTILITY">Utility</SelectItem>
                            <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en_US">English (US)</SelectItem>
                            <SelectItem value="en_GB">English (UK)</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="pt_BR">Portuguese (BR)</SelectItem>
                            <SelectItem value="hi">Hindi</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                }

                <TabsContent value="content" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mediaType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">
                              <div className="flex items-center">
                                <Type className="w-4 h-4 mr-2" />
                                Text Only
                              </div>
                            </SelectItem>
                            <SelectItem value="image">
                              <div className="flex items-center">
                                <Image className="w-4 h-4 mr-2" />
                                Image
                              </div>
                            </SelectItem>
                            <SelectItem value="video">
                              <div className="flex items-center">
                                <Video className="w-4 h-4 mr-2" />
                                Video
                              </div>
                            </SelectItem>
                            <SelectItem value="document">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                Document
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("mediaType") !== "text" && (
                    <FormField
                      control={form.control}
                      name="mediaUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sample Media URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            Provide a sample URL for preview purposes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="header"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Welcome to our service!" {...field} />
                        </FormControl>
                        <FormDescription>
                          Max 60 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Hi {{1}}, welcome to our service! Your account has been created successfully."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Use {"{{1}}"}, {"{{2}}"}, etc. for variables. Max 1024 characters.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Reply STOP to unsubscribe" {...field} />
                        </FormControl>
                        <FormDescription>
                          Max 60 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("body") && extractVariables(form.watch("body")).length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Detected Variables</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {extractVariables(form.watch("body")).map((variable) => (
                          <Badge key={variable} variant="secondary">
                            <Hash className="w-3 h-3 mr-1" />
                            Variable {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="buttons" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Action Buttons</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddButton}
                        disabled={buttonFields.length >= 3}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Button
                      </Button>
                    </div>

                    {buttonFields.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No buttons added. Click "Add Button" to create action buttons.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {buttonFields.map((field, index) => (
                          <div key={field.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Button {index + 1}</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeButton(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <FormField
                              control={form.control}
                              name={`buttons.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Button Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="QUICK_REPLY">
                                        <div className="flex items-center">
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Quick Reply
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="URL">
                                        <div className="flex items-center">
                                          <Link className="w-4 h-4 mr-2" />
                                          URL
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="PHONE_NUMBER">
                                        <div className="flex items-center">
                                          <Phone className="w-4 h-4 mr-2" />
                                          Phone Number
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`buttons.${index}.text`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Button Text</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Click me" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    Max 20 characters
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {form.watch(`buttons.${index}.type`) === "URL" && (
                              <FormField
                                control={form.control}
                                name={`buttons.${index}.url`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>URL</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://example.com/{{1}}" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      You can use variables like {"{{1}}"} in URLs
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {form.watch(`buttons.${index}.type`) === "PHONE_NUMBER" && (
                              <FormField
                                control={form.control}
                                name={`buttons.${index}.phoneNumber`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1234567890" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Include country code
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : template ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium mb-2 ${className || ""}`}>{children}</div>;
}