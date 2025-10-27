import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Settings,
  Upload,
  X,
  Image as ImageIcon,
  Type,
  Tag,
  Globe,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";

// Types
interface BrandSettings {
  title?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  updatedAt?: string;
}

// This is only for React state
interface BrandFormValues {
  title: string;
  tagline: string;
  logo: File | null;
  favicon: File | null;
}


interface ValidationErrors {
  title?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
}

interface GeneralSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandSettings?: BrandSettings;
  onSuccess?: () => void;
}

const GeneralSettingsModal: React.FC<GeneralSettingsModalProps> = ({
  open,
  onOpenChange,
  brandSettings,
  onSuccess,
}) => {
  const {user} = useAuth()
  const [formData, setFormData] = useState<BrandFormValues>({
    title: "",
    tagline: "",
    logo: null,
    favicon: null,
  });
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [faviconPreview, setFaviconPreview] = useState<string>("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [uploadStatus, setUploadStatus] = useState<{
    logo?: 'uploading' | 'success' | 'error';
    favicon?: 'uploading' | 'success' | 'error';
  }>({});
  const { toast } = useToast();

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && brandSettings) {
      setFormData({
        title: brandSettings.title || "",
        tagline: brandSettings.tagline || "",
        logo: null,    // no File yet
        favicon: null, // no File yet
      });
      setLogoPreview(brandSettings.logo || "");
      setFaviconPreview(brandSettings.favicon || "");
      setErrors({});
      setUploadStatus({});
    }
  }, [open, brandSettings]);

  // Update brand settings mutation
  const updateBrandMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/brand-settings`, {
        method: "PUT",
        body: data, // FormData object
      });
      if (!res.ok) {
        throw new Error("Failed to update settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-settings"] });
      toast({
        title: "Settings updated",
        description: "Your general settings have been saved successfully.",
      });
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });
  

  const handleInputChange = (field: keyof BrandFormValues, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleFileUpload = (
    file: File | null,
    type: "logo" | "favicon"
  ): void => {
    if (!file) return;
  
    // Save file in state for sending later
    setFormData((prev) => ({
      ...prev,
      [type]: file,
    }));
  
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoPreview(previewUrl);
    } else {
      setFaviconPreview(previewUrl);
    }
  
    setUploadStatus((prev) => ({ ...prev, [type]: "success" }));
  };
  

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Application title is required";
    }

    if (formData.title.length > 50) {
      newErrors.title = "Title should be less than 50 characters";
    }

    if (formData.tagline.length > 100) {
      newErrors.tagline = "Tagline should be less than 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validateForm()) return;
  
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("tagline", formData.tagline);
  
    if (formData.logo) formDataToSend.append("logo", formData.logo);
    if (formData.favicon) formDataToSend.append("favicon", formData.favicon);    
  
    updateBrandMutation.mutate(formDataToSend);
  };

  const handleClose = (): void => {
    onOpenChange(false);
    // Reset form when closing
    setFormData({
      title: "",
      tagline: "",
      logo: null,
      favicon: null,
    });
    setLogoPreview("");
    setFaviconPreview("");
    setErrors({});
    setUploadStatus({});
  };

  const removeImage = (type: "logo" | "favicon"): void => {
    setFormData((prev) => ({
      ...prev,
      [type]: "",
    }));

    if (type === "logo") {
      setLogoPreview("");
    } else {
      setFaviconPreview("");
    }

    setUploadStatus(prev => ({ ...prev, [type]: undefined }));
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "favicon"
  ): void => {
    const file = e.target.files?.[0] || null;
    handleFileUpload(file, type);
  };

  const getUploadStatusIcon = (type: "logo" | "favicon") => {
    const status = uploadStatus[type];
    switch (status) {
      case 'uploading':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-semibold">
            <Settings className="w-5 h-5 mr-2" />
            Edit General Settings
          </DialogTitle>
          <DialogDescription>
            Update your application's brand identity and appearance settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Application Title */}
          <div className="space-y-2">
            <Label className="flex items-center font-medium">
              <Type className="w-4 h-4 mr-2 text-blue-500" />
              Application Title *
            </Label>
            <Input
              placeholder="Enter your application title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label className="flex items-center font-medium">
              <Tag className="w-4 h-4 mr-2 text-green-500" />
              Tagline
            </Label>
            <Textarea
              placeholder="Enter your brand tagline"
              value={formData.tagline}
              onChange={(e) => handleInputChange("tagline", e.target.value)}
              className={`min-h-[80px] ${
                errors.tagline ? "border-red-500" : ""
              }`}
            />
            {errors.tagline && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.tagline}
              </p>
            )}
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center font-medium">
              <ImageIcon className="w-4 h-4 mr-2 text-purple-500" />
              Logo
              {getUploadStatusIcon('logo') && (
                <span className="ml-2">
                  {getUploadStatusIcon('logo')}
                </span>
              )}
            </Label>
            <Card className="border-dashed border-2">
              <CardContent className="p-4">
                {logoPreview ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-12 h-12 object-contain rounded border"
                      />
                      <span className="text-sm text-gray-600">
                        Logo uploaded
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage("logo")}
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload your logo
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, JPEG, SVG up to 2MB
                    </p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={(e) => handleFileInputChange(e, "logo")}
                  className="mt-2"
                />
              </CardContent>
            </Card>
            {errors.logo && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.logo}
              </p>
            )}
          </div>

          {/* Favicon Upload */}
          <div className="space-y-2">
            <Label className="flex items-center font-medium">
              <Globe className="w-4 h-4 mr-2 text-orange-500" />
              Favicon
              {getUploadStatusIcon('favicon') && (
                <span className="ml-2">
                  {getUploadStatusIcon('favicon')}
                </span>
              )}
            </Label>
            <Card className="border-dashed border-2">
              <CardContent className="p-4">
                {faviconPreview ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={faviconPreview}
                        alt="Favicon preview"
                        className="w-8 h-8 object-contain rounded border"
                      />
                      <span className="text-sm text-gray-600">
                        Favicon uploaded
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage("favicon")}
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload your favicon
                    </p>
                    <p className="text-xs text-gray-400">
                      ICO, PNG 32x32px up to 2MB
                    </p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                  onChange={(e) => handleFileInputChange(e, "favicon")}
                  className="mt-2"
                />
              </CardContent>
            </Card>
            {errors.favicon && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.favicon}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={updateBrandMutation.isPending}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={user?.username === 'demouser'? true : updateBrandMutation.isPending || uploadStatus.logo === 'uploading' || uploadStatus.favicon === 'uploading'}
            type="button"
          >
            {updateBrandMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneralSettingsModal;