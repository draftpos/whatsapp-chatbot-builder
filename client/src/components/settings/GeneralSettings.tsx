import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Edit,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Image,
  Type,
  Tag,
  Globe,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";
import GeneralSettingsModal from "../modals/GeneralSettingsModal";
import { setMeta } from "@/hooks/setMeta";
import { useAuth } from "@/contexts/auth-context";

// Types
interface BrandSettings {
  title?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  updatedAt?: string;
}

export function GeneralSettings(): JSX.Element {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();
  // Fetch brand settings
  const {
    data: brandSettings,
    isLoading: settingsLoading,
    error,
    refetch: refetchSettings,
    isFetching,
  } = useQuery<BrandSettings>({
    queryKey: ["/api/brand-settings"],
    queryFn: () => fetch("/api/brand-settings").then(res => {
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Static fallback data when API fails
  const staticData: BrandSettings = {
    title: "Your App Name",
    tagline: "Building amazing experiences",
    logo: "",
    favicon: "",
    updatedAt: new Date().toISOString(),
  };
// console.log('BrandSettings render, error:', error , brandSettings );
  // Use static data if API fails, otherwise use API data
  const displayData = error ? staticData : brandSettings || {};

  // console.log('Displaying brand settings:', displayData);

  useEffect(() => {
    if (displayData) {
      setMeta({
        title: displayData.title,
        favicon: displayData.favicon,
        description: displayData.tagline, // or a separate field
        keywords: `${displayData.title} ${displayData?.tagline}`,   // optional
      });
    }
  }, [brandSettings]);

  const isUsingStaticData = Boolean(error);

  const handleEditClick = (): void => {
    if (isUsingStaticData) {
      toast({
        title: "Connection Issue",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      return;
    }
    setShowEditDialog(true);
  };

  const handleRefresh = async (): Promise<void> => {
    try {
      await refetchSettings();
      toast({
        title: "Refreshed",
        description: "Settings have been refreshed successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loading />
              <p className="text-sm text-gray-500 mt-2">Loading settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatLastUpdated = (dateString?: string): string => {
    if (!dateString) return "Unknown";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return "Just now";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              General Configuration
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={isUsingStaticData ? "destructive" : "default"} className="text-xs">
                {isUsingStaticData ? (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </>
                ) : (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </>
                )}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                onClick={handleEditClick}
                disabled={ isUsingStaticData}
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Settings
              </Button>
            </div>
          </div>
          <CardDescription>
            Manage your application's brand identity and appearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Show error message if API failed */}
          {isUsingStaticData && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Connection Error</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Unable to load settings from server. Showing sample data. Please check your connection and try refreshing.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-lg">Brand Identity</h3>
                <Badge variant={isUsingStaticData ? "secondary" : "default"} className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {isUsingStaticData ? "Sample Data" : "Live Data"}
                </Badge>
              </div>
              {displayData.updatedAt && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatLastUpdated(displayData.updatedAt)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Type className="w-4 h-4 text-blue-500" />
                  <Label className="font-medium">Application Title</Label>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium text-gray-900">
                    {displayData.title || "Not configured"}
                  </p>
                  {!displayData.title && (
                    <p className="text-xs text-gray-500 mt-1">
                      Click "Edit Settings" to configure your app title
                    </p>
                  )}
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-green-500" />
                  <Label className="font-medium">Tagline</Label>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700">
                    {displayData.tagline || "Not configured"}
                  </p>
                  {!displayData.tagline && (
                    <p className="text-xs text-gray-500 mt-1">
                      Add a compelling tagline for your brand
                    </p>
                  )}
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Image className="w-4 h-4 text-purple-500" />
                  <Label className="font-medium">Logo</Label>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  {displayData.logo ? (
                    <div className="flex items-center space-x-3">
                      <img
                        src={displayData.logo}
                        alt="Logo"
                        className="w-12 h-12 object-contain rounded border bg-white"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Logo uploaded
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Logo is ready to display
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Image className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No logo uploaded</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Upload a logo to enhance your brand
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-orange-500" />
                  <Label className="font-medium">Favicon</Label>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  {displayData.favicon ? (
                    <div className="flex items-center space-x-3">
                      <img
                        src={displayData.favicon}
                        alt="Favicon"
                        className="w-8 h-8 object-contain rounded border bg-white"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Favicon uploaded
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Favicon will appear in browser tabs
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Globe className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No favicon uploaded</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Add a favicon for browser tab icon
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Configuration Status */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    displayData.title && displayData.logo ? 'bg-green-500' : 
                    displayData.title ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-600">
                    Configuration Status: {
                      displayData.title && displayData.logo ? 'Complete' :
                      displayData.title ? 'Partial' : 'Incomplete'
                    }
                  </span>
                </div>
                {displayData.updatedAt && !isUsingStaticData && (
                  <span className="text-gray-500">
                    Last updated: {new Date(displayData.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Preview */}
      {displayData.title && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Brand Preview
            </CardTitle>
            <CardDescription>
              How your brand will appear in the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
              {displayData.logo && (
                <img
                  src={displayData.logo}
                  alt="Brand Logo"
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {displayData.title}
                </h3>
                {displayData.tagline && (
                  <p className="text-gray-600 text-base mt-1">
                    {displayData.tagline}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Settings Modal */}
      <GeneralSettingsModal
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        brandSettings={displayData}
        onSuccess={() => {
          setShowEditDialog(false);
          refetchSettings();
        }}
      />
    </div>
  );
}