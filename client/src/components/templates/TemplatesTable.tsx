import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  FileText, 
  Eye, 
  Edit, 
  Copy, 
  Trash, 
  MoreVertical, 
  Search 
} from "lucide-react";
import { format } from "date-fns";
import type { Template } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

interface TemplatesTableProps {
  templates: Template[];
  onViewTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDuplicateTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template) => void;
}

export function TemplatesTable({
  templates,
  onViewTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
}: TemplatesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const {user} = useAuth()

  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.body.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      APPROVED: { variant: "default" as const, className: "bg-green-100 text-green-800" },
      PENDING: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      REJECTED: { variant: "destructive" as const, className: "" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "MARKETING":
        return "📢";
      case "UTILITY":
        return "🔧";
      case "AUTHENTICATION":
        return "🔐";
      default:
        return "📄";
    }
  };

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No templates yet"
        description="Create your first WhatsApp message template to start sending messages"
        action={{
          label: "Create Template",
          onClick: () => onEditTemplate({} as Template),
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No templates found matching "{searchQuery}"
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewTemplate(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span>{getCategoryIcon(template.category)}</span>
                    <span className="truncate">{template.name}</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.language || "en_US"}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {getStatusBadge(template.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewTemplate(template)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditTemplate(template)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicateTemplate(template)} disabled={user?.username === 'demouser'} >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={user?.username === 'demouser'}
                        onClick={() => onDeleteTemplate(template)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-2">
                {template.header && (
                  <p className="text-sm font-medium">{template.header}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>
                {template.footer && (
                  <p className="text-xs text-gray-500">{template.footer}</p>
                )}
              </div>

              {template.components && template.components.some(c => c.type === "BUTTONS") && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {template.components
                    .filter(c => c.type === "BUTTONS")
                    .flatMap(c => c.buttons || [])
                    .map((button, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {button.text}
                      </Badge>
                    ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t text-xs text-gray-400">
                Created {format(new Date(template.createdAt), "MMM d, yyyy")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}