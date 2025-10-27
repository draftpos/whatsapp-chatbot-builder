import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChannelProvider } from "@/contexts/channel-context";
import { UnreadCountProvider } from "@/contexts/UnreadCountContext";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Campaigns from "@/pages/campaigns";
import Templates from "@/pages/templates";
import Inbox from "@/pages/inbox";
import Automations from "@/pages/automations";
import Analytics from "@/pages/analytics";
import CampaignAnalytics from "@/pages/campaign-analytics";
import Settings from "@/pages/settings";
import Logs from "@/pages/logs";
import Team from "@/pages/team";
import Sidebar from "@/components/layout/sidebar";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import Account from "./pages/account";
import { AppLayout } from "./components/layout/AppLayout";

// Define route permissions mapping
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/contacts": "contacts.view",
  "/campaigns": "campaigns.view",
  "/templates": "templates.view",
  "/inbox": "inbox.view",
  "/team": "team.view",
  "/automation": "automations.view",
  "/analytics": "analytics.view",
  "/analytics/campaign/:campaignId": "analytics.view",
  "/logs": "logs.view",
  "/settings": "settings.view",
  "/account": "",
};

// Unauthorized component
function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
      </div>
    </div>
  );
}

// Permission wrapper component
function PermissionRoute({
  component: Component,
  requiredPermission,
}: {
  component: React.ComponentType;
  requiredPermission?: string;
}) {
  const { user } = useAuth();

  const hasPermission = (permission?: string) => {
    if (!permission) return true; // No permission required
    if (!user?.permissions) return false;

    const perms = Array.isArray(user.permissions)
      ? user.permissions
      : Object.keys(user.permissions);

    const normalize = (str: string) => str.replace(".", ":");

    return perms.some(
      (perm) =>
        perm.startsWith(normalize(permission)) &&
        (Array.isArray(user.permissions) ? true : user.permissions[perm])
    );
  };

  if (!hasPermission(requiredPermission)) {
    return <UnauthorizedPage />;
  }

  return <Component />;
}

function ProtectedRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Check if user has access to current route
  useEffect(() => {
    if (isAuthenticated && user && location !== "/") {
      const requiredPermission = ROUTE_PERMISSIONS[location];
      // console.log(
      //   "Checking permissions for route:",
      //   location,
      //   requiredPermission,
      //   hasRoutePermission(requiredPermission, user)
      // );
      if (requiredPermission && !hasRoutePermission(requiredPermission, user)) {
        // Redirect to dashboard if user doesn't have permission for current route
        setLocation("/");
      }
    }
  }, [location, isAuthenticated, user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will handle the redirect
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Switch>
          <Route path="/">
            <Dashboard />
          </Route>
          <Route path="/contacts">
            <PermissionRoute
              component={Contacts}
              requiredPermission="contacts:view"
            />
          </Route>
          <Route path="/campaigns">
            <PermissionRoute
              component={Campaigns}
              requiredPermission="campaigns:view"
            />
          </Route>
          <Route path="/templates">
            <PermissionRoute
              component={Templates}
              requiredPermission="templates:view"
            />
          </Route>
          <Route path="/inbox">
            <PermissionRoute
              component={Inbox}
              requiredPermission="inbox:view"
            />
          </Route>
          <Route path="/team">
            <PermissionRoute component={Team} requiredPermission="team:view" />
          </Route>
          <Route path="/automation">
            <PermissionRoute
              component={Automations}
              requiredPermission="automations:view"
            />
          </Route>
          <Route path="/analytics">
            <PermissionRoute component={Analytics} />
          </Route>
          {/* <Route path="/analytics/campaign/:campaignId">
            <PermissionRoute
              component={CampaignAnalytics}
              requiredPermission="analytics:view"
            />
          </Route> */}
          <Route path="/logs">
            <PermissionRoute component={Logs} requiredPermission="logs:view" />
          </Route>
          <Route path="/settings">
            <PermissionRoute
              component={Settings}
              requiredPermission="settings:view"
            />
          </Route>
          <Route path="/account">
            <PermissionRoute component={Account} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

// Helper function to check route permissions
function hasRoutePermission(permission: string, user: any) {
  if (!user?.permissions) return false;

  const perms = Array.isArray(user.permissions)
    ? user.permissions
    : Object.keys(user.permissions);

  const normalize = (str: string) => str.replace(".", ":");

  return perms.some(
    (perm: string) =>
      perm.startsWith(normalize(permission)) &&
      (Array.isArray(user.permissions) ? true : user.permissions[perm])
  );
}

// Custom hook for permission checking
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user?.permissions) return false;

    const perms = Array.isArray(user.permissions)
      ? user.permissions
      : Object.keys(user.permissions);

    const normalize = (str: string) => str.replace(".", ":");
    const normalizedPermission = normalize(permission);

    return perms.some(
      (perm) =>
        perm.startsWith(normalizedPermission) &&
        (Array.isArray(user.permissions) ? true : user.permissions[perm])
    );
  };

  const canAccessRoute = (route: string) => {
    const requiredPermission = ROUTE_PERMISSIONS[route];
    return requiredPermission ? hasPermission(requiredPermission) : true;
  };

  return { hasPermission, canAccessRoute, user };
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/analytics/campaign/:campaignId" component={CampaignAnalytics}/>
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
      <AuthProvider>
        <ChannelProvider>
          <TooltipProvider>
            <UnreadCountProvider>
              <Toaster />
              <Router />
            </UnreadCountProvider>
          </TooltipProvider>
        </ChannelProvider>
      </AuthProvider>
      </AppLayout>
    </QueryClientProvider>
  );
}

export default App;
