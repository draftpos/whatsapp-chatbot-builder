import { useState } from "react";
import Header from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Webhook, Key, User, SettingsIcon } from "lucide-react";
import { ChannelSettings } from "@/components/settings/ChannelSettings";
import { WebhookSettings } from "@/components/settings/WebhookSettings";
// import { AccountSettings } from "@/components/settings/AccountSettings";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general_setting");

  return (
    <div className="flex-1 dots-bg min-h-screen">
      <Header
        title="Settings"
        subtitle="Manage your WhatsApp business configuration"
      />

      <main className="p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="general_setting"
              className="flex items-center space-x-2"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>General Setting</span>
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              className="flex items-center space-x-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger
              value="webhooks"
              className="flex items-center space-x-2"
            >
              <Webhook className="w-4 h-4" />
              <span>Webhooks</span>
            </TabsTrigger>
            <TabsTrigger
              disabled={true}
              value="api"
              className="flex items-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>API Keys (Coming soon) </span>
            </TabsTrigger>
          </TabsList>

          {/* General Setting Tab */}
          <TabsContent value="general_setting">
            <GeneralSettings />
          </TabsContent>

          {/* WhatsApp Numbers Tab */}
          <TabsContent value="whatsapp">
            <ChannelSettings />
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks">
            <WebhookSettings />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api">
            <ApiKeySettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
