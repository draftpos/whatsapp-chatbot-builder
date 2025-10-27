import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Upload,
  Plus,
  MessageSquare,
  Phone,
  Download,
  Shield,
  CheckCircle,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertContactSchema,
  type Contact,
  type InsertContact,
} from "@shared/schema";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";



interface ContactsResponse {
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    count: number;
    total: number;
    totalPages: number;
  };
}


// Edit Contact Form Component
function EditContactForm({
  contact,
  onSuccess,
  onCancel,
}: {
  contact: Contact;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {user} = useAuth()
  const { t } = useTranslation();
  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone,
      groups: contact.groups || [],
      tags: contact.tags || [],

      status: contact.status,
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update contact");
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: () => {
      // Handle error
    },
  });

  const onSubmit = (data: InsertContact) => {
    updateContactMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => {
          const isDemoUser = user?.username === 'demouser';

          // Mask name: replace all characters except the last one with '*'
          const maskName = (name: string) => {
            if (!name) return '';
            return name.slice(0, -1).replace(/./g, '*') + name.slice(-1);
          };

          const maskedValue = isDemoUser ? maskName(field.value) : field.value;

          return (
            <FormItem>
              <FormLabel>{t('contacts.addContact.name')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={maskedValue || ''}
                  readOnly={isDemoUser} // Optional: make read-only if masked
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />


        <FormField
          control={form.control}
          name="email"
          render={({ field }) => {
            const isDemoUser = user?.username === 'demouser';

            // Mask email: show only the last 3 characters before @ and the domain
            const maskEmail = (email: string | null | undefined) => {
              if (!email) return '';
              const [localPart, domain] = email.split('@');
              if (!domain) return email;
              const visibleChars = 3;
              const maskedLocal = localPart.length > visibleChars
                ? '*'.repeat(localPart.length - visibleChars) + localPart.slice(-visibleChars)
                : '*'.repeat(localPart.length);
              return `${maskedLocal}@${domain}`;
            };

            const maskedValue = isDemoUser ? maskEmail(field.value) : field.value;

            return (
              <FormItem>
                <FormLabel>{t('contacts.addContact.email')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    value={maskedValue || ""}
                    readOnly={isDemoUser} // Optional: prevent editing if demo user
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />


          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => {
              const isDemoUser = user?.username === 'demouser';
              const maskedValue = isDemoUser
                ? field.value?.slice(0, -4).replace(/\d/g, "*") + field.value?.slice(-4)
                : field.value;

              return (
                <FormItem>
                  <FormLabel>{t('contacts.addContact.phone')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={maskedValue}
                      readOnly={isDemoUser} // Optional: prevent editing if in demo
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />


        <FormField
          control={form.control}
          name="groups"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contacts.groups')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={`${t('contacts.editContact.groupsPlaceholder')}`}
                  value={
                    Array.isArray(field.value) ? field.value.join(", ") : ""
                  }
                  onChange={(e) => {
                    const groups = e.target.value
                      .split(",")
                      .map((g) => g.trim())
                      .filter((g) => g.length > 0);
                    field.onChange(groups);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={user?.username === 'demouser'? true : updateContactMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {updateContactMutation.isPending ? `${t('contacts.editContact.updating')}` : t('contacts.editContact.successTitle')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
const ITEMS_PER_PAGE = 10;
export default function Contacts() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, string>
  >({});
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null); // Add status filter
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone");
    if (phone) {
      setSearchQuery(phone);
    }
    console.log("Initial search query from URL:", phone);
  }, []);

  // const { data: contacts, isLoading } = useQuery({
  //   queryKey: ["/api/contacts", searchQuery, activeChannel?.id],
  //   queryFn: async () => {
  //     const response = await api.getContacts(searchQuery, activeChannel?.id);
  //     return await response.json();
  //   },
  //   enabled: !!activeChannel,
  // });

  // Form for adding contacts
  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      groups: [],
      tags: [],
    },
  });

  // First, get the active channel
  const { data: activeChannel } = useQuery({
    queryKey: ["/api/channels/active"],
    queryFn: async () => {
      const response = await fetch("/api/channels/active");
      if (!response.ok) return null;
      return await response.json();
    },
  });

  // Updated query to fetch contacts with proper server-side filtering
  const { data: contactsResponse, isLoading } = useQuery<ContactsResponse>({
    queryKey: [
      "/api/contacts",
      activeChannel?.id,
      currentPage,
      limit,
      selectedGroup,
      selectedStatus,
      searchQuery,
    ],
    queryFn: async () => {
      const response = await api.getContacts(
        searchQuery || undefined,
        activeChannel?.id,
        currentPage,
        limit,
        selectedGroup !== "all" && selectedGroup ? selectedGroup : undefined,
        selectedStatus !== "all" && selectedStatus ? selectedStatus : undefined
      );
      return (await response.json()) as ContactsResponse;
    },
    placeholderData: (prev) => prev, 
    enabled: !!activeChannel,
  });
  

  const contacts = contactsResponse?.data || [];
  const pagination = contactsResponse?.pagination || {
    page: 1,
    limit: limit,
    count: 0,
    total: 0,
    totalPages: 1,
  };

  // Destructure values from backend
  const { page, totalPages, total, count } = pagination;
  // console.log("Contacts fetched:", contacts, pagination);

  // Pagination helpers
  const goToPage = (p: number) => setCurrentPage(p);
  const goToPreviousPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, page - halfRange);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Extract unique groups from all contacts for filter dropdown
  const uniqueGroups = useMemo(() => {
    if (!contacts.length) return [];
    const groups = new Set<string>();
    contacts.forEach((contact: Contact) => {
      if (Array.isArray(contact.groups)) {
        contact.groups.forEach((group: string) => groups.add(group));
      }
    });
    return Array.from(groups).sort();
  }, [contacts]);

  // Extract unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    if (!contacts.length) return [];
    const statuses = new Set<string>();
    contacts.forEach((contact: Contact) => {
      if (contact.status) {
        statuses.add(contact.status);
      }
    });
    return Array.from(statuses).sort();
  }, [contacts]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGroup, selectedStatus]);

  // Selection handlers - using contacts directly since pagination is server-side
  const allSelected =
    contacts.length > 0 &&
    contacts.every((contact: Contact) =>
      selectedContactIds.includes(contact.id)
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedContactIds((prev) =>
        prev.filter((id) => !contacts.some((contact) => contact.id === id))
      );
    } else {
      setSelectedContactIds((prev) => [
        ...prev,
        ...contacts
          .map((contact) => contact.id)
          .filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Clear filters function
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedGroup(null);
    setSelectedStatus(null);
    setCurrentPage(1);
  };

  const { data: channels } = useQuery({
    queryKey: ["/api/whatsapp/channels"],
    queryFn: async () => {
      const response = await fetch("/api/whatsapp/channels");
      return await response.json();
    },
  });

  const { data: availableTemplates = [] } = useQuery({
    queryKey: ["/api/templates", activeChannel?.id],
    queryFn: async () => {
      const response = await fetch("/api/templates");
      return await response.json();
    },
    enabled: !!activeChannel,
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      const response = await fetch(
        `/api/contacts${
          activeChannel?.id ? `?channelId=${activeChannel.id}` : ""
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("Failed to create contact");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact created",
        description: "The contact has been successfully added.",
      });
      setShowAddDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete contact");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      });
      setShowDeleteDialog(false);
      setContactToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteBulkContactsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch(`/api/contacts-bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to delete contacts");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contacts deleted",
        description: "The selected contacts have been successfully deleted.",
      });
      setSelectedContactIds([]); // Clear selection
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contacts. Please try again.",
        variant: "destructive",
      });
    },
  });
  

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const {
        phone,
        type,
        message,
        templateName,
        templateLanguage,
        templateVariables,
      } = data;

      if (!activeChannel?.id) {
        throw new Error("No active channel selected");
      }

      const payload =
        type === "template"
          ? {
              to: phone,
              type: "template",
              templateName,
              templateLanguage,
              templateVariables,
            }
          : {
              to: phone,
              type: "text",
              message,
            };

      const response = await fetch(
        `/api/whatsapp/channels/${activeChannel.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your WhatsApp message has been sent successfully.",
      });
      setShowMessageDialog(false);
      setMessageText("");
      setMessageType("text");
      setSelectedTemplateId("");
      setTemplateVariables({});
    },
    onError: () => {
      toast({
        title: "Error",
        description:
          "Failed to send message. Please check your WhatsApp configuration and template settings.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteContact = (id: string) => {
    setContactToDelete(id);
    setShowDeleteDialog(true);
  };

  const importContactsMutation = useMutation({
    mutationFn: async (contacts: InsertContact[]) => {
      const response = await fetch(
        `/api/contacts/import${
          activeChannel?.id ? `?channelId=${activeChannel.id}` : ""
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contacts }),
        }
      );
      if (!response.ok) throw new Error("Failed to import contacts");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Import Completed",
        description: `Imported: ${data.created}, Duplicates: ${data.duplicates}, Failed: ${data.failed}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import contacts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleContactStatusMutation = useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: "active" | "blocked";
    }) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok)
        throw new Error(
          `Failed to ${newStatus === "blocked" ? "block" : "unblock"} contact`
        );
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: `Contact ${newStatus === "blocked" ? "blocked" : "unblocked"}`,
        description: `The contact has been ${
          newStatus === "blocked" ? "blocked" : "unblocked"
        } successfully.`,
      });
    },
    onError: (_, { newStatus }) => {
      toast({
        title: "Error",
        description: `Failed to ${
          newStatus === "blocked" ? "block" : "unblock"
        } contact. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // Single handler function
  const handleToggleContactStatus = (
    id: string,
    currentStatus: string | null
  ): void => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    toggleContactStatusMutation.mutate({ id, newStatus });
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedContacts: InsertContact[] = (results.data as any[])
            .filter((row) => row && Object.keys(row).length > 0) // filter out empty rows
            .map((row: any) => ({
              name: row?.name?.toString().trim() || "",
              phone: row?.phone ? String(row.phone).trim() : "",
              email: row?.email?.toString().trim() || "",
              groups: row?.groups
                ? row.groups.split(",").map((g: string) => g.trim())
                : [],
              tags: row?.tags
                ? row.tags.split(",").map((t: string) => t.trim())
                : [],
            }))
            .filter((c) => c.name || c.phone); // ignore completely empty rows

          if (parsedContacts.length === 0) {
            toast({
              title: "CSV Error",
              description: "No valid contacts found in the file.",
              variant: "destructive",
            });
            return;
          }

          importContactsMutation.mutate(parsedContacts);
        } catch (err: any) {
          toast({
            title: "CSV Parse Error",
            description: err.message || "Failed to parse CSV file.",
            variant: "destructive",
          });
        }
      },
      error: (err) => {
        toast({
          title: "CSV Error",
          description: err.message,
          variant: "destructive",
        });
      },
    });

    // Reset input so same file can be selected again
    event.target.value = "";
  };



  type InsertContact = {
    name: string;
    phone: string;
    email: string;
    groups: string[];
    tags: string[];
  };
  
  const handleExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
  
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        alert("No worksheet found in Excel file.");
        return;
      }
  
      const rows: Record<string, string>[] = [];
  
      // ✅ Get headers safely with null check
      const headerRow = worksheet.getRow(1);
      if (!headerRow || !headerRow.values) {
        alert("No header row found in Excel file.");
        return;
      }
      
      const headerValues = Array.isArray(headerRow.values)
      ? headerRow.values.slice(1).map((h: ExcelJS.CellValue | undefined) =>
          typeof h === "string"
            ? h.trim().toLowerCase()
            : typeof h === "number"
            ? String(h)
            : ""
        )
      : [];
    
    
  
      // ✅ Extract data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
      
        const rowData: Record<string, string> = {};
        if (row.values && Array.isArray(row.values)) {
          row.values.slice(1).forEach((cell: ExcelJS.CellValue | undefined, idx: number) => {
            const key = headerValues[idx];
            if (key) {
              if (typeof cell === "string") rowData[key] = cell.trim();
              else if (typeof cell === "number") rowData[key] = String(cell);
              else rowData[key] = "";
            }
          });
        }
      
        rows.push(rowData); // <-- push outside the inner forEach but inside eachRow
      });
      
  
      // ✅ Map rows to InsertContact
      const parsedContacts: InsertContact[] = rows.map((row) => ({
        name: row["name"] || "",
        phone: row["phone"] || "",
        email: row["email"] || "",
        groups: row["groups"] ? row["groups"].split(",").map((g) => g.trim()) : [],
        tags: row["tags"] ? row["tags"].split(",").map((t) => t.trim()) : [],
      }));
  
      importContactsMutation.mutate(parsedContacts);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      alert("Failed to read Excel file. Please check the format.");
    }
  
    event.target.value = "";
  };
  
  

  if (isLoading) {
    return (
      <div className="flex-1 dots-bg">
        <Header title="Contacts" subtitle="Loading contacts..." />
        <div className="p-6">
          <Loading size="lg" text="Loading contacts..." />
        </div>
      </div>
    );
  }

  // const allSelected =
  //   filteredContacts.length > 0 &&
  //   selectedContactIds.length === filteredContacts.length;

  // const toggleSelectAll = () => {
  //   if (allSelected) {
  //     setSelectedContactIds([]);
  //   } else {
  //     setSelectedContactIds(filteredContacts.map((contact) => contact.id));
  //   }
  // };

  // const toggleSelectOne = (id: string) => {
  //   setSelectedContactIds((prev) =>
  //     prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  //   );
  // };

// ✅ Export Selected Contacts
const handleExportSelectedContacts = () => {
  const selectedContacts = contacts.filter((contact) =>
    selectedContactIds.includes(contact.id)
  );

  if (selectedContacts.length === 0) {
    alert("No contacts selected.");
    return;
  }

  exportToExcel(selectedContacts, "selected_contacts.xlsx");
};

// ✅ Export All Contacts
const handleExportAllContacts = async () => {
  try {
    const response = await fetch("/api/contacts-all");
    if (!response.ok) {
      throw new Error("Failed to fetch contacts");
    }

    const allContacts: Contact[] = await response.json();

    if (!allContacts || allContacts.length === 0) {
      alert("No contacts available.");
      return;
    }

    exportToExcel(allContacts, "all_contacts.xlsx");
  } catch (error) {
    console.error("Error exporting contacts:", error);
    alert("Failed to export contacts. Please try again.");
  }
};

// ✅ Download Sample Template
const handleExcelDownload = () => {
  const sampleContacts = [
    {
      name: "Alice Smith",
      phone: "1234567890",
      email: "alice@example.com",
      groups: "Friends, Work",
      tags: "VIP, Newsletter",
    },
    {
      name: "Bob Johnson",
      phone: "9876543210",
      email: "bob@example.com",
      groups: "Family",
      tags: "New",
    },
    {
      name: "Charlie Brown",
      phone: "5555555555",
      email: "charlie@example.com",
      groups: "Customers, Support",
      tags: "Premium, Active",
    },
  ];

  exportToExcel(sampleContacts, "sample_contacts.xlsx");
};

// ✅ Reusable Excel Export Function (using ExcelJS)
const exportToExcel = async (data: any[], fileName: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Contacts");

  if (data.length === 0) {
    alert("No data to export.");
    return;
  }

  // Add header row based on keys of first object
  worksheet.columns = Object.keys(data[0]).map((key) => ({
    header: key.charAt(0).toUpperCase() + key.slice(1),
    key,
    width: 20,
  }));

  // Add all rows
  data.forEach((item) => {
    worksheet.addRow(item);
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };

  // Generate file and download
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
};

  return (
    <div className="flex-1 dots-bg min-h-screen">
      <Header
        title={t('contacts.title')}
        subtitle={t('contacts.subtitle')}
        action={{
          label: `${t('contacts.addContact.title')}`,
          onClick: () =>{ setShowAddDialog(true)},
        }}
      />

      <main className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={`${t('contacts.searchContacts')}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    {selectedGroup || `${t('contacts.allGroups')}`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setSelectedGroup(null)}
                    className={!selectedGroup ? "bg-gray-100" : ""}
                  >
                    {t('contacts.allGroups')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowGroupDialog(true)}
                    className="text-green-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('contacts.createNewGroup')}
                  </DropdownMenuItem>
                  {uniqueGroups.length > 0 && (
                    <>
                      <DropdownMenuItem disabled className="py-1">
                        <span className="text-xs text-gray-500 uppercase">
                          {t('contacts.availableGroups')}
                        </span>
                      </DropdownMenuItem>
                      {uniqueGroups.map((group) => (
                        <DropdownMenuItem
                          key={group}
                          onClick={() => setSelectedGroup(group)}
                          className={
                            selectedGroup === group ? "bg-gray-100" : ""
                          }
                        >
                          {group}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    {selectedStatus || `${t('contacts.allStatuses')}`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setSelectedStatus(null)}
                    className={!selectedStatus ? "bg-gray-100" : ""}
                  >
                    {t('contacts.allStatuses')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedStatus("active")}
                    className={selectedStatus === "active" ? "bg-gray-100" : ""}
                  >
                    {t('contacts.active')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedStatus("blocked")}
                    className={
                      selectedStatus === "blocked" ? "bg-gray-100" : ""
                    }
                  >
                    {t('contacts.blocked')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={handleExportAllContacts}
                disabled={user?.username === 'demouser'}
              >
                <Upload className="w-4 h-4 mr-2" />
               {t('contacts.exportAllContacts')}
              </Button>

              {user?.username === 'demouser' ? 
              <Button disabled={user?.username === 'demouser'} variant="outline" className="" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {t('contacts.importContacts')}
              </span>
            </Button>
            :

              <label className="cursor-pointer" >
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]?.name.endsWith(".csv")) {
                      handleCSVUpload(e);
                    } else {
                      handleExcelUpload(e);
                    }
                  }}
                  readOnly={user?.username === 'demouser'}
                />
                <Button disabled={user?.username === 'demouser'} variant="outline" className="" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('contacts.importContacts')}
                  </span>
                </Button>
              </label>
              }

              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={handleExcelDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('contacts.downloadSampleExcel')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedContactIds.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedContactIds.length} {t('contacts.contact')}
                  {selectedContactIds.length > 1 ? "s" : ""} {t('contacts.selected')}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSelectedContacts}
                    disabled={user?.username === 'demouser'}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('contacts.exportSelected')}
                  </Button>
                  <Button  disabled={user?.username === 'demouser'} variant="outline" size="sm" className="text-red-600" onClick={() => setShowBulkDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                   {t('contacts.deleteSelected')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts Table */}
        <Card>
          <CardContent className="p-0">
            {!contacts.length ? (
              <EmptyState
                icon={Users}
                title={`${t('contacts.noContactsFound')}`}
                description={
                  searchQuery || selectedGroup || selectedStatus
                    ? `${t('contacts.noFilters')}`
                    : `${t('contacts.noContactsYet')}`
                }
                action={
                  !(searchQuery || selectedGroup || selectedStatus)
                    ? {
                        label: `${t('contacts.addYourFirstContact')}`,
                        onClick: () => setShowAddDialog(true),
                      }
                    : {
                        label:` ${t('contacts.clearFilters')}`,
                        onClick: clearAllFilters,
                      }
                }
                className="py-12"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                       {t('contacts.contact')}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('contacts.phone')}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('contacts.groups')}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('contacts.status')}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('contacts.lastContact')}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('contacts.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact: Contact) => (
                      <tr
                        key={contact.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedContactIds.includes(contact.id)}
                            onChange={() => toggleSelectOne(contact.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user?.username === 'demouser' ? (
                                  <span className=" px-2 py-1 rounded">
                                    {contact.name.slice(0, -1).replace(/./g, "*") + contact.name.slice(-1)}
                                  </span>
                                ) : (
                                  contact.name
                                )}
                              </div>
                              {contact.email && (
                                <div className="text-sm text-gray-500">
                                  {user?.username === 'demouser' ? (
                                    <span className=" px-2 py-1 rounded">
                                      {(contact.email).split("@")[0].slice(0, -2).replace(/./g, "*") + contact.email.slice(contact.email.indexOf("@") -2)}
                                    </span>
                                  ) : (
                                  contact.email
                                  )}

                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user?.username === 'demouser' ? (
                            <span className=" px-2 py-1 rounded">
                              {(contact.phone).slice(0, -4).replace(/\d/g, "*") + contact.phone.slice(-4)}
                            </span>
                          ) : (
                            contact.phone
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-1">
                            {Array.isArray(contact.groups) &&
                            contact.groups.length > 0 ? (
                              contact.groups.map(
                                (group: string, index: number) => (
                                  <Badge key={index} variant="secondary">
                                    {group}
                                  </Badge>
                                )
                              )
                            ) : (
                              <span className="text-sm text-gray-400">
                                {t('contacts.noGroups')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              contact.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              contact.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {contact.status?.toLocaleUpperCase() || "N/A"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.lastContact
                            ? new Date(contact.lastContact).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContact(contact);
                                setShowMessageDialog(true);
                              }}
                              disabled={ !channels || channels.length === 0}
                              title={
                                !channels || channels.length === 0
                                  ?  `${t('contacts.noChannels')}`
                                  : `${t('contacts.sendMessage.title')}`
                              }
                            >
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContact(contact);
                                setShowEditDialog(true);
                              }}
                              // disabled={user?.username === 'demouser'}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContact(contact.id)}
                              disabled={user?.username === 'demouser'? true : deleteContactMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContact(contact);
                                    setShowEditDialog(true);
                                  }}
                                  // disabled={user?.username === 'demouser'}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('contacts.editContact.title')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContact(contact);
                                    setShowMessageDialog(true);
                                  }}
                                  disabled={ !channels || channels.length === 0}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  {t('contacts.sendMessage.title')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleToggleContactStatus(
                                      contact.id,
                                      contact.status
                                    )
                                  }
                                  className={
                                    contact.status === "active"
                                      ? "text-red-600 focus:text-red-600"
                                      : "text-green-600 focus:text-green-600"
                                  }
                                  disabled={user?.username === 'demouser'}
                                >
                                  {contact.status === "active" ? (
                                    <>
                                      <Shield className="h-4 w-4 mr-2" />
                                     {t('contacts.blockContact')}
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      {t('contacts.unblockContact')}
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteContact(contact.id)
                                  }
                                  className="text-red-600"
                                  disabled={user?.username === 'demouser'}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                {t('contacts.deleteContact.title')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Enhanced Pagination */}
            {contacts.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(page - 1) * limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min((page - 1) * limit + limit, total)}
                    </span>{" "}
                    of <span className="font-medium">{total}</span> contacts
                  </div>

                  {/* Items per page selector */}
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => {
                      setLimit(Number(value));
                      setCurrentPage(1); // reset page when limit changes
                    }}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={page === 1}
                  >
                    {t('contacts.previous')}
                  </Button>

                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className={
                        page === pageNum
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : ""
                      }
                    >
                      {pageNum}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={page === totalPages}
                  >
                    {t('contacts.next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contacts.addContact.title')}</DialogTitle>
            <DialogDescription>
              {t('contacts.addContact.description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                createContactMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contacts.addContact.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormDescription>{t('contacts.addContact.description')} </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contacts.addContact.phone')}</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('contacts.addContact.phoneDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contacts.addContact.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john@example.com"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                >
                  {t('contacts.addContact.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={user?.username === 'demouser' ? true : createContactMutation.isPending}
                >
                  {createContactMutation.isPending
                    ? `${t('contacts.addContact.submitting')}`
                    : `${t('contacts.addContact.submit')}`}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('contacts.sendMessage.title')}</DialogTitle>
            <DialogDescription>
              {t('contacts.sendMessage.description')} {selectedContact?.name} (
              {selectedContact?.phone})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {activeChannel && (
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <div className="text-sm">
                    <span className="font-medium">{t('contacts.sendMessage.activeChannel')}</span>{" "}
                    <span className="text-gray-700">{activeChannel.name}</span>
                  </div>
                </div>
              </div>
            )}

            {!activeChannel && (
              <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  {t('contacts.sendMessage.noChannel')}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('contacts.sendMessage.messageType')}</label>
              <select
                className="w-full p-2 border rounded-md"
                value={messageType}
                onChange={(e) => {
                  setMessageType(e.target.value);
                  setSelectedTemplateId("");
                  setTemplateVariables({});
                }}
              >
                <option value="text">{t('contacts.sendMessage.textMessage')}</option>
                <option value="template">{t('contacts.sendMessage.templateMessage')}</option>
              </select>
            </div>

            {messageType === "template" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('contacts.sendMessage.textMessage')}</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      const template = availableTemplates?.find(
                        (t: any) => t.id === e.target.value
                      );
                      if (template && template.variables) {
                        const vars: any = {};
                        (template.variables as string[]).forEach((v, i) => {
                          vars[i + 1] = "";
                        });
                        setTemplateVariables(vars);
                      }
                    }}
                  >
                    <option value="">{t('contacts.sendMessage.selectTemplate')}</option>
                    {availableTemplates
                      ?.filter(
                        (t: any) => t.status?.toLowerCase() === "approved"
                      )
                      .map((template: any) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </option>
                      ))}
                  </select>
                </div>

                {selectedTemplateId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                    {t('contacts.sendMessage.templateVariables')}
                    </label>
                    {Object.keys(templateVariables).map((key) => {
                      const template = availableTemplates?.find(
                        (t: any) => t.id === selectedTemplateId
                      );
                      const variableName =
                        template?.variables?.[parseInt(key) - 1] ||
                        `Variable ${key}`;
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-xs text-gray-600">{`{{${key}}} - ${variableName}`}</label>
                          <Input
                            placeholder={`Enter ${variableName}`}
                            value={templateVariables[key] || ""}
                            onChange={(e) =>
                              setTemplateVariables({
                                ...templateVariables,
                                [key]: e.target.value,
                              })
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('contacts.sendMessage.message')}</label>
                <textarea
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                  placeholder={`${t('contacts.sendMessage.messagePlaceholder')}`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowMessageDialog(false);
                  setMessageText("");
                  setMessageType("text");
                  setSelectedTemplateId("");
                  setTemplateVariables({});
                }}
              >
                {t('contacts.addContact.cancel')}
              </Button>
              <Button
                disabled={ user?.username === 'demouser'? true :
                  !activeChannel ||
                  sendMessageMutation.isPending ||
                  (messageType === "text" && !messageText) ||
                  (messageType === "template" &&
                    (!selectedTemplateId ||
                      Object.values(templateVariables).some((v) => !v)))
                }
                onClick={() => {
                  if (selectedContact && activeChannel) {
                    if (messageType === "template" && selectedTemplateId) {
                      const template = availableTemplates?.find(
                        (t: any) => t.id === selectedTemplateId
                      );
                      if (template) {
                        sendMessageMutation.mutate({
                          phone: selectedContact.phone,
                          type: "template",
                          templateName: template.name,
                          templateLanguage: template.language,
                          templateVariables: Object.values(templateVariables),
                        });
                      }
                    } else {
                      sendMessageMutation.mutate({
                        phone: selectedContact.phone,
                        type: "text",
                        message: messageText,
                      });
                    }
                  }
                }}
              >
                {sendMessageMutation.isPending ? `${t('contacts.sendMessage.sending')}` : `${t('contacts.sendMessage.send')}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contacts.deleteContact.title')}</DialogTitle>
            <DialogDescription>
            {t('contacts.deleteContact.title')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setContactToDelete(null);
              }}
            >
              {t('contacts.addContact.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (contactToDelete) {
                  deleteContactMutation.mutate(contactToDelete);
                }
              }}
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contacts.deleteContacts.title')}</DialogTitle>
            <DialogDescription>
            {t('contacts.deleteContacts.description')} <strong>{selectedContactIds.length}</strong>{" "}
              {selectedContactIds.length > 1 ? `${t('contacts.contacts')}` : `${t('contacts.contact')}`}. {t('contacts.deleteContacts.confirmation')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkDeleteDialog(false);
              }}
            >
              {t('contacts.addContact.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteBulkContactsMutation.mutate(selectedContactIds);
                setShowBulkDeleteDialog(false);
              }}
              disabled={deleteBulkContactsMutation.isPending}
            >
              {deleteBulkContactsMutation.isPending ? `${t('contacts.deleteContacts.deleting')}` : `${t('contacts.deleteContacts.title')}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Edit Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contacts.editContact.title')}</DialogTitle>
            <DialogDescription>{t('contacts.editContact.description')}</DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <EditContactForm
              contact={selectedContact}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
                setShowEditDialog(false);
                setSelectedContact(null);
                toast({
                  title: `${t('contacts.editContact.successTitle')}`,
                  description:  `${t('contacts.editContact.successDesc')}`,
                });
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedContact(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('contacts.createGroup.title')}</DialogTitle>
            <DialogDescription>
              {t('contacts.createGroup.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">{t('contacts.createGroup.name')}</label>
              <Input
                placeholder= {`${t('contacts.createGroup.groupNamePlaceholder')}`}
                className="mt-1"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
              {t('contacts.createGroup.groupDescription')}
              </label>
              <Textarea
                placeholder={ `${t('contacts.createGroup.groupDescriptionPlaceholder')}`}
                className="mt-1"
                rows={3}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGroupDialog(false);
                  setGroupName("");
                  setGroupDescription("");
                }}
              >
                {t('contacts.addContact.cancel')}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  if (groupName.trim()) {
                    toast({
                      title:  `${t('contacts.createGroup.successTitle')}`,
                      description: `${t('contacts.createGroup.successDesc')} ${groupName}`,
                    });
                    setShowGroupDialog(false);
                    setGroupName("");
                    setGroupDescription("");
                  } else {
                    toast({
                      title: "Error",
                      description: "Please enter a group name",
                      variant: "destructive",
                    });
                  }
                }}
              >
              {t('contacts.createGroup.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
