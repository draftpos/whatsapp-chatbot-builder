import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, FileSpreadsheet, Code } from "lucide-react";
import { CreateCampaignForm } from "./CreateCampaignForm";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: any[];
  contacts: any[];
  onCreateCampaign: (campaignData: any) => void;
  isCreating: boolean;
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  templates,
  contacts,
  onCreateCampaign,
  isCreating,
}: CreateCampaignDialogProps) {
  const [campaignType, setCampaignType] = useState<"contacts" | "csv" | "api">(
    "contacts"
  );
  const {user} = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [variableMapping, setVariableMapping] = useState<
    Record<string, string>
  >({});
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [autoRetry, setAutoRetry] = useState(false);
const { t } = useTranslation();
  const resetForm = () => {
    setSelectedTemplate(null);
    setVariableMapping({});
    setSelectedContacts([]);
    setCsvData([]);
    setScheduledTime("");
    setAutoRetry(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split("\n").map((row) => row.split(","));
      const headers = rows[0];
      const data = rows.slice(1).map((row) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = row[index]?.trim() || "";
        });
        return obj;
      });
      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const extractTemplateVariables = (template: any) => {
    const variables: string[] = [];
    const regex = /\{\{(\d+)\}\}/g;

    if (template?.body) {
      let match;
      while ((match = regex.exec(template.body)) !== null) {
        variables.push(match[1]);
      }
    }

    return variables;
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ["name", "phone", "email", "custom_field_1", "custom_field_2"],
      ["John Doe", "+1234567890", "john@example.com", "Value 1", "Value 2"],
      ["Jane Smith", "+0987654321", "jane@example.com", "Value 3", "Value 4"],
      [
        "Example User",
        "+1122334455",
        "example@email.com",
        "Value 5",
        "Value 6",
      ],
    ];

    const csvContent = sampleData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaign_contacts_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = (formData: any) => {
    onCreateCampaign({
      ...formData,
      campaignType,
      selectedTemplate,
      variableMapping,
      selectedContacts,
      csvData,
      scheduledTime,
      autoRetry,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('campaigns.dialogTitle')}</DialogTitle>
          <DialogDescription>
          {t('campaigns.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={campaignType}
          onValueChange={(v) => setCampaignType(v as any)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('campaigns.contactsImport')}
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {t('campaigns.csvImport')}
            </TabsTrigger>
            <TabsTrigger
              disabled={true}
              value="api"
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              {t('campaigns.apiCampaign')} ({t('campaigns.comingSoon')})
            </TabsTrigger>
          </TabsList>

          <CreateCampaignForm
            onSubmit={handleSubmit}
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            variableMapping={variableMapping}
            setVariableMapping={setVariableMapping}
            extractTemplateVariables={extractTemplateVariables}
            scheduledTime={scheduledTime}
            setScheduledTime={setScheduledTime}
            autoRetry={autoRetry}
            setAutoRetry={setAutoRetry}
            isCreating={isCreating}
            onCancel={() => onOpenChange(false)}
          >
            <TabsContent value="contacts" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t('campaigns.selectConatcts')}</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={
                        selectedContacts.length === contacts.length &&
                        contacts.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedContacts(contacts.map((c: any) => c.id));
                        } else {
                          setSelectedContacts([]);
                        }
                      }}
                    />
                    <Label className="font-normal text-sm">
                    {t('campaigns.selectAll')} ({contacts.length})
                    </Label>
                  </div>
                </div>
                <ScrollArea className="h-64 border rounded-md p-4">
                  {contacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContacts([
                              ...selectedContacts,
                              contact.id,
                            ]);
                          } else {
                            setSelectedContacts(
                              selectedContacts.filter((id) => id !== contact.id)
                            );
                          }
                        }}
                      />
                      <Label className="font-normal">
                        {user?.username === 'demouser' ? (
                          <>
                            {contact.name.slice(0, -1).replace(/./g, "*") + contact.name.slice(-1)} (
                            {contact.phone.slice(0, -4).replace(/\d/g, "*") + contact.phone.slice(-4)})
                          </>
                        ) : (
                          <>
                            {contact.name} ({contact.phone})
                          </>
                        )}
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div>
                <Label htmlFor="csvFile">{t('campaigns.uploadCSVFile')}</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      downloadSampleCSV();
                    }}
                    className="text-blue-500 hover:underline"
                  >
                    {t('campaigns.downloadSampleCSV')}
                  </a>
                </p>
              </div>

              {csvData.length > 0 && (
                <div>
                  <Label>{t('campaigns.csvPreview')} ({csvData.length} {t('campaigns.rows')})</Label>
                  <ScrollArea className="h-64 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(csvData[0] || {}).map((header) => (
                            <TableHead key={header}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, i) => (
                              <TableCell key={i}>{value}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                {t('campaigns.tabContent')}
                </p>
              </div>
            </TabsContent>
          </CreateCampaignForm>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
