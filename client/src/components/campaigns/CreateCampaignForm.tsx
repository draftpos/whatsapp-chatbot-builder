import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";

interface CreateCampaignFormProps {
  onSubmit: (formData: any) => void;
  templates: any[];
  selectedTemplate: any;
  setSelectedTemplate: (template: any) => void;
  variableMapping: Record<string, string>;
  setVariableMapping: (mapping: Record<string, string>) => void;
  extractTemplateVariables: (template: any) => string[];
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  autoRetry: boolean;
  setAutoRetry: (retry: boolean) => void;
  isCreating: boolean;
  onCancel?: () => void;
  children: ReactNode;
}

export function CreateCampaignForm({
  onSubmit,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  variableMapping,
  setVariableMapping,
  extractTemplateVariables,
  scheduledTime,
  setScheduledTime,
  autoRetry,
  setAutoRetry,
  isCreating,
  onCancel,
  children
}: CreateCampaignFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const campaignData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      variableMapping: variableMapping,
    };
    onSubmit(campaignData);
  };

  const activeTemplates = templates.filter((t: any) => t.status === "APPROVED");
  const {user} = useAuth()

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <Label htmlFor="name">Campaign Name</Label>
        <Input id="name" name="name" required placeholder="Black Friday Sale" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="Campaign objectives and notes..." />
      </div>

      <div>
        <Label>Template</Label>
        <Select value={selectedTemplate?.id} onValueChange={(value) => {
          const template = templates.find(t => t.id === value);
          setSelectedTemplate(template);
          setVariableMapping({});
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {activeTemplates.map((template: any) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} ({template.language})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Show template preview */}
      {selectedTemplate && (
        <div className="bg-gray-50 p-4 rounded-md space-y-2">
          <Label>Template Preview</Label>
          {selectedTemplate.headerType === "text" && selectedTemplate.headerText && (
            <div className="font-semibold">{selectedTemplate.headerText}</div>
          )}
          <div className="whitespace-pre-wrap">{selectedTemplate.body}</div>
          {selectedTemplate.footerText && (
            <div className="text-sm text-gray-600">{selectedTemplate.footerText}</div>
          )}
        </div>
      )}

      {/* Variable mapping */}
      {selectedTemplate && extractTemplateVariables(selectedTemplate).length > 0 && (
        <div className="space-y-2">
          <Label>Template Variables</Label>
          {extractTemplateVariables(selectedTemplate).map((variable: string) => (
            <div key={variable}>
              <Label htmlFor={`var-${variable}`} className="text-sm font-normal">
                Variable {variable}
              </Label>
              <Input
                id={`var-${variable}`}
                placeholder={`Value for {{${variable}}}`}
                value={variableMapping[variable] || ''}
                onChange={(e) => setVariableMapping({
                  ...variableMapping,
                  [variable]: e.target.value
                })}
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <Label htmlFor="scheduledTime">Schedule Campaign (Optional)</Label>
        <Input
          id="scheduledTime"
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="autoRetry"
          checked={autoRetry}
          onCheckedChange={(checked) => setAutoRetry(!!checked)}
        />
        <Label htmlFor="autoRetry" className="font-normal">
          Enable auto-retry for failed messages
        </Label>
      </div>

      {children}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={user?.username === 'demouser' ? true : isCreating}>
          {scheduledTime ? "Schedule Campaign" : "Start Campaign"}
        </Button>
      </div>
    </form>
  );
}