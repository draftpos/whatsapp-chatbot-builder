import { useState,useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Users,
  Activity,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { User } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";

interface TeamMemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string;
  role: "admin" | "manager" | "agent";
  permissions: string[];
}


// For form state (checkbox booleans)
type TeamMemberFormState = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string;
  role: "admin" | "manager" | "agent";
  permissions: Record<string, boolean>; // ✅ form uses boolean map
};




export default function TeamPage() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("members");
  const { user } = useAuth();
  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/team/members"],
  });

  // Fetch team activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ["/api/team/activity-logs"],
    enabled: activeTab === "activity",
  });

  // console.log("activity logs" , activityLogs)

  // Add/Update team member mutation
  const saveMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      if (editingMember) {
        return apiRequest('PUT', `/api/team/members/${editingMember.id}`,data);
      } else {
        return apiRequest('POST', "/api/team/members", data);
        // new add
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      toast({
        title: editingMember ? "Member updated" : "Member added",
        description: `Team member has been ${editingMember ? "updated" : "added"} successfully.`,
      });
      setShowAddDialog(false);
      setEditingMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return apiRequest( "DELETE" , `/api/team/members/${memberId}` )},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      toast({
        title: "Member removed",
        description: "Team member has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update member status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: string }) => {
      return apiRequest("PATCH" ,`/api/team/members/${memberId}/status`, {status});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      toast({
        title: "Status updated",
        description: "Team member status has been updated.",
      });
    },
  });

  const handleOpenDialog = (member?: User) => {
    if (member) {
      setEditingMember(member);
    }
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingMember(null);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";  
      case "inactive":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getOnlineStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members, roles, and permissions
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team members and their access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading team members...
                      </TableCell>
                    </TableRow>
                  ) : teamMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No team members found. Add your first team member.
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarImage src={member.avatar || undefined} />
                                <AvatarFallback>
                                  {`${member.firstName || ""} ${member.lastName || ""}`
                                    .split(" ")
                                    .filter(n => n)
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getOnlineStatusColor(
                                  "offline"
                                )}`}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{`${member.firstName || ""} ${member.lastName || ""}`.trim() || member.username}</div>
                              <div className="text-sm text-muted-foreground">
                                
                                {user?.username === 'demouser' ? (
                                    <span className=" px-2 py-1 rounded">
                                      {(member.email).split("@")[0].slice(0, -2).replace(/./g, "*") + member.email.slice(member.email.indexOf("@") -2)}
                                    </span>
                                  ) : (
                                    member.email
                                  )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                        <Badge variant={getStatusBadgeVariant(member.status) || "default"}> {member.status} </Badge>       
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {member.lastLogin
                                ? new Date(member.lastLogin).toLocaleString()
                                : "Never"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleOpenDialog(member)}
                                // disabled={user?.username === "demouser"}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                               disabled={user?.username === "demouser"}
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    memberId: member.id,
                                    status:
                                      member.status === "active"
                                        ? "inactive"
                                        : "active",
                                  })
                                }
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                {member.status === "active"
                                  ? "Deactivate"
                                  : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                               disabled={user?.username === "demouser"}
                                className="text-destructive"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to remove this team member?"
                                    )
                                  ) {
                                    deleteMemberMutation.mutate(member.id);
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Track team member activities and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activityLogs as any[])?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No activity logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (activityLogs as any[]).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell> {user?.username === 'demouser' ? (
                                  <span className=" px-2 py-1 rounded">
                                    {log.userName.slice(0, -1).replace(/./g, "*") + log.userName.slice(-1)}
                                  </span>
                                ) : (
                                  log.userName
                                )}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          {user?.username === "demouser" ? (
                            <span className=" px-2 py-1 rounded">
                              {"Details hidden for demo user"}
                            </span>
                          ) : (
                            <span>
                              <DetailsView details={log.details} />

                            </span>
                          )

                          }
                        </TableCell>
                        <TableCell>
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Team Member Dialog */}
      <TeamMemberDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        member={editingMember}
        onSave={(data) => saveMemberMutation.mutate(data)}
      />
    </div>
  );
}


function DetailsView({ details }: { details?: any }) {
  if (!details) return "-";

  if (details.updates) {
    const { role, email, firstName, lastName, permissions } = details.updates;
    return (
      <>
        <div><strong>Role:</strong> {role}</div>
        <div><strong>Email:</strong> {email}</div>
        <div><strong>Name:</strong> {firstName} {lastName}</div>
        <div><strong>Permissions:</strong> {permissions.join(", ")}</div>
      </>
    );
  }

  if (details.createdBy) {
    return <div>Created By: {details.createdBy}</div>;
  }

  if (details.ipAddress) {
    return (
      <>
        <div><strong>IP Address:</strong> {details.ipAddress}</div>
        <div><strong>User Agent:</strong> {details.userAgent || "-"}</div>
      </>
    );
  }

  return "-";
}


interface PermissionItem {
  key: string;
  label: string;
}

interface PermissionGroup {
  title: string;
  label: string;
  permissions: PermissionItem[];
}

// External configuration - easily manageable
const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    "title": "contacts",
    "label": "Manage Contacts",
    "permissions": [
      { "key": "contacts:view", "label": "View" },
      { "key": "contacts:create", "label": "Create" },
      { "key": "contacts:edit", "label": "Edit" },
      { "key": "contacts:delete", "label": "Delete" },
      { "key": "contacts:import", "label": "Import" },
      { "key": "contacts:export", "label": "Export" }
    ]
  },
  {
    "title": "campaigns",
    "label": "Manage Campaigns",
    "permissions": [
      { "key": "campaigns:view", "label": "View" },
      { "key": "campaigns:create", "label": "Create" },
      { "key": "campaigns:edit", "label": "Edit" },
      { "key": "campaigns:delete", "label": "Delete" },
      { "key": "campaigns:send", "label": "Send" },
      { "key": "campaigns:schedule", "label": "Schedule" }
    ]
  },
  {
    "title": "templates",
    "label": "Manage Templates",
    "permissions": [
      { "key": "templates:view", "label": "View" },
      { "key": "templates:create", "label": "Create" },
      { "key": "templates:edit", "label": "Edit" },
      { "key": "templates:delete", "label": "Delete" },
      { "key": "templates:sync", "label": "Sync" }
    ]
  },
  {
    "title": "analytics",
    "label": "View Analytics",
    "permissions": [
      { "key": "analytics:view", "label": "View" },
      { "key": "analytics:export", "label": "Export" }
    ]
  },
  {
    "title": "team",
    "label": "Manage Team",
    "permissions": [
      { "key": "team:view", "label": "View" },
      { "key": "team:create", "label": "Create" },
      { "key": "team:edit", "label": "Edit" },
      { "key": "team:delete", "label": "Delete" },
      { "key": "team:permissions", "label": "Permissions" }
    ]
  },
  {
    "title": "inbox",
    "label": "Manage Inbox",
    "permissions": [
      { "key": "inbox:view", "label": "View" },
      { "key": "inbox:send", "label": "Send" },
      { "key": "inbox:assign", "label": "Assign" },
      { "key": "inbox:delete", "label": "Delete" },
      { "key": "inbox:close", "label": "Close" }
    ]
  },
  {
    "title": "settings",
    "label": "Manage Settings",
    "permissions": [
      { "key": "settings:view", "label": "View" },
      { "key": "settings:channels", "label": "Channels" },
      { "key": "settings:webhook", "label": "Webhook" },
      { "key": "settings:team", "label": "Team" },
      { "key": "settings:api", "label": "APIs" }
    ]
  },
  {
    "title": "automations",
    "label": "Manage Automations",
    "permissions": [
      { "key": "automations:view", "label": "View" },
      { "key": "automations:create", "label": "Create" },
      { "key": "automations:edit", "label": "Edit" },
      { "key": "automations:delete", "label": "Delete" }
    ]
  },
  {
    "title": "general",
    "label": "General Settings",
    "permissions": [
      { "key": "data:export", "label": "Data Export" },
      { "key": "logs:view", "label": "Logs View" }
    ]
  }
];

// Convert array from API → object for form
function mapApiPermissionsToForm(permissions: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  permissions.forEach((key) => {
    result[key] = true;
  });

  // also set group main flags if any permission inside is true
  PERMISSION_GROUPS.forEach((group) => {
    const mainKey = getMainPermissionKey(group.title);
    result[mainKey] = group.permissions.some((perm) => result[perm.key]);
  });

  if (permissions.includes("analytics:export") || permissions.includes("analytics:view")) {
    result.canViewAnalytics = true;
  }
  if (permissions.includes("contacts:export")) {
    result.canExportData = true;
  }

  return result;
}

// Convert form object → array for API
function mapFormPermissionsToApi(permissions: Record<string, boolean>): string[] {
  const result: string[] = [];

  PERMISSION_GROUPS.forEach((group) => {
    group.permissions.forEach((perm) => {
      if (permissions[perm.key]) {
        result.push(perm.key);
      }
    });
  });

  if (permissions.canExportData) {
    result.push("data:export"); // or contacts:export depending on your API spec
  }

  return result;
}


// Helper functions
const getMainPermissionKey = (groupTitle: string): string => {
  if (groupTitle === 'analytics') return 'canViewAnalytics';
  return `canManage${groupTitle.charAt(0).toUpperCase() + groupTitle.slice(1)}`;
};

const findGroupByPermission = (permissionKey: string): PermissionGroup | undefined => {
  return PERMISSION_GROUPS.find(group => 
    group.permissions.some(perm => perm.key === permissionKey)
  );
};

// Team Member Form Dialog Component
function TeamMemberDialog({
  open,
  onOpenChange,
  member,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: User | null;
  onSave: (data: TeamMemberFormData) => void;
}) {
  const {user} = useAuth()
  const [formData, setFormData] = useState<TeamMemberFormState>({
    firstName: member?.firstName || "",
    lastName: member?.lastName || "",
    email: member?.email || "",
    username: member?.username || "",
    password: "",
    role: (member?.role as "admin" | "manager" | "agent") || "agent",
    permissions: member?.permissions
      ? mapApiPermissionsToForm(member.permissions as string[]) // ✅ convert API → form
      : {},
  });
  

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    PERMISSION_GROUPS.reduce((acc, group) => {
      acc[group.title] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  useEffect(() => {
    setFormData({
      firstName: member?.firstName || "",
      lastName: member?.lastName || "",
      email: member?.email || "",
      username: member?.username || "",
      password: "",
      role: (member?.role as "admin" | "manager" | "agent") || "agent",
      permissions: member?.permissions
        ? mapApiPermissionsToForm(member.permissions as string[]) // ✅ safe conversion
        : {},
    });
  }, [member]);
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    const payload = {
      ...formData,
      permissions: mapFormPermissionsToApi(formData.permissions),
    };
  
    onSave(payload);
  };

  const updatePermission = (key: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value,
      },
    }));
  };

  const updateGroupPermission = (group: PermissionGroup, checked: boolean) => {
    const updates: Record<string, boolean> = {};
    
    // Update the main group permission
    const mainKey = getMainPermissionKey(group.title);
    updates[mainKey] = checked;
    
    // Update all related granular permissions
    group.permissions.forEach(perm => {
      updates[perm.key] = checked;
    });

    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        ...updates
      }
    }));
  };

  const updateGranularPermission = (permissionKey: string, checked: boolean) => {
    const group = findGroupByPermission(permissionKey);
    if (!group) return;

    const updates = { [permissionKey]: checked };
    
    // Check if all permissions in the group will be true after this update
    const allGroupPermissionsChecked = group.permissions.every(perm => 
      perm.key === permissionKey ? checked : formData.permissions[perm.key]
    );
    
    // Update the main group permission accordingly
    const mainKey = getMainPermissionKey(group.title);
    updates[mainKey] = allGroupPermissionsChecked;

    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        ...updates
      }
    }));
  };

  const toggleSection = (groupTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const getGroupMainPermission = (groupTitle: string) => {
    const mainKey = getMainPermissionKey(groupTitle);
    return formData.permissions[mainKey];
  };

  const renderPermissionGroup = (group: PermissionGroup) => {
    const isExpanded = expandedSections[group.title];
    
    return (
      <div key={group.title} className="border rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => toggleSection(group.title)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </button>
            <Label className="text-sm font-medium cursor-pointer">
              {group.label}
            </Label>
          </div>
          <Switch
            checked={getGroupMainPermission(group.title) || false}
            onCheckedChange={(checked) => updateGroupPermission(group, checked)}
          />
        </div>
        
        {isExpanded && (
          <div className="mt-3 ml-6 pl-4 border-l-2 border-gray-200">
            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
              {group.permissions.map(perm => (
                <div key={perm.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={perm.key}
                    checked={formData.permissions[perm.key] || false}
                    onCheckedChange={(checked) => 
                      updateGranularPermission(perm.key, checked === true) // ✅ force boolean
                    }
                  />
                  <Label
                    htmlFor={perm.key}
                    className="text-xs text-gray-600 cursor-pointer"
                  >
                    {perm.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    const visibleChars = 3;
    const maskedLocal =
      localPart.length > visibleChars
        ? '*'.repeat(localPart.length - visibleChars) + localPart.slice(-visibleChars)
        : '*'.repeat(localPart.length);
    return `${maskedLocal}@${domain}`;
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {member ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
          <DialogDescription>
            {member
              ? "Update team member details and permissions"
              : "Add a new team member to your organization"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Basic Information */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={
                  user?.username === 'demouser'
                    ? maskEmail(formData.email)
                    : formData.email
                }
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                readOnly={user?.username === 'demouser'} // Optional
                required
              />
            </div>
              {!member && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!member}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value as "admin" | "manager" | "agent",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Permissions Section */}
            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {PERMISSION_GROUPS.map(renderPermissionGroup)}
              </div>
                {/* Export Data - Simple permission */}
                {/* <div className="flex items-center justify-between py-2">
                  <Label htmlFor="perm-export" className="text-sm font-normal">
                    Export Data
                  </Label>
                  <Switch
                    id="perm-export"
                    checked={formData.permissions.canExportData || false}
                    onCheckedChange={(checked) => updatePermission("canExportData", checked)}
                  />
                </div> */}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={user?.username === "demouser"}>
              {member ? "Update" : "Add"} Team Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}