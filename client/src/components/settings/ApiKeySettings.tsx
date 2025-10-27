import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'revoked';
}

export function ApiKeySettings() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  // Fetch API keys
  const { data: apiKeys = [], isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/api-keys", { name });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API key created",
        description: "Your new API key has been created. Make sure to copy it now as it won't be shown again.",
      });
      setShowCreateForm(false);
      setNewKeyName("");
      
      // Show the new key temporarily
      if (data?.id) {
        setShowKeys((prev) => ({ ...prev, [data.id]: true }));
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      return await apiRequest("POST", `/api/api-keys/${keyId}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API key revoked",
        description: "The API key has been revoked and can no longer be used.",
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

  const handleCreateKey = () => {
    if (!newKeyName) {
      toast({
        title: "Name required",
        description: "Please enter a name for the API key",
        variant: "destructive",
      });
      return;
    }
    createKeyMutation.mutate(newKeyName);
  };

  const handleRevokeKey = (keyId: string) => {
    if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      revokeKeyMutation.mutate(keyId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys({ ...showKeys, [keyId]: !showKeys[keyId] });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              API Keys
            </CardTitle>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>
          <CardDescription>
            Manage API keys for integrating with external systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keysLoading ? (
            <Loading />
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No API keys created yet</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                          {apiKey.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {showKeys[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-sm text-gray-500">
                          Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                          {apiKey.lastUsed && (
                            <span className="ml-4">
                              Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {apiKey.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeKey(apiKey.id)}
                        disabled={revokeKeyMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create API Key Form */}
          {showCreateForm && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-4">Create New API Key</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    A descriptive name to identify this API key
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCreateKey} disabled={createKeyMutation.isPending}>
                    {createKeyMutation.isPending ? "Creating..." : "Create Key"}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowCreateForm(false);
                    setNewKeyName("");
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Learn how to use the WhatsWay API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Base URL</h4>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {window.location.origin}/api/v1
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-gray-600">
              Include your API key in the Authorization header:
            </p>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded block mt-2">
              Authorization: Bearer YOUR_API_KEY
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">Example Request</h4>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`curl -X POST ${window.location.origin}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+1234567890",
    "message": "Hello from WhatsWay API!"
  }'`}
            </pre>
          </div>
          <div className="pt-4">
            <Button variant="outline">
              View Full Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}